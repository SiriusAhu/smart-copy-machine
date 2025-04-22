import { useEffect, useState } from "react";
import {
    getModels,
    setOllamaHost,
    getPresets,
    genContent,
    getTemplateList,
    getTemplate,
} from "../api";
import styles from "./MainPanel.module.css";
import ReactMarkdown from 'react-markdown'

/** 字段配置 */
const HOTEL_INFO = [
    { label: "Hotel Name", key: "name" },
    { label: "Location", key: "location" },
    { label: "Architectural Style", key: "architecturalStyle" },
    { label: "Service Highlights", key: "serviceHighlights" },
    { label: "Suitable For", key: "suitableFor" },
];

export default function MainPanel() {
    /* ——— 基本状态 ——— */
    const [hostUrl] = useState("http://localhost:8000");
    const [LLMUrl, setLLMUrl] = useState("http://localhost:11434");

    const [isUrlLoading, setIsUrlLoading] = useState(false);
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState("");

    const [scenarios, setScenarios] = useState([]);
    const [stylesPreset, setStylesPreset] = useState([]);
    const [selectedScenario, setSelectedScenario] = useState("");
    const [selectedStyle, setSelectedStyle] = useState("");

    const [hotelInfo, setHotelInfo] = useState(
        Object.fromEntries(HOTEL_INFO.map(({ key }) => [key, ""]))
    );

    const [prompt, setPrompt] = useState("");
    const [result, setResult] = useState("");
    const [copied, setCopied] = useState(false);
    const [isLLMLoading, setIsLLMLoading] = useState(false);

    /* ——— 模板列表 ——— */
    const [templateList, setTemplateList] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");

    /* ——— 获取模板列表 ——— */
    useEffect(() => {
        const init = async () => {
            setIsUrlLoading(true);
            try {
                const data = await getTemplateList(hostUrl);
                setTemplateList(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsUrlLoading(false);
            }
        };
        init();
    }, [hostUrl]);

    /* ——— 获取模型 & 预设 ——— */
    useEffect(() => {
        const init = async () => {
            setIsUrlLoading(true);
            try {
                setModels(await getModels(hostUrl));

                /* 预设 */
                const data = await getPresets(hostUrl);
                setScenarios(Object.keys(data.scenarios));
                setStylesPreset(Object.keys(data.styles));
                setSelectedScenario(Object.keys(data.scenarios)[0] ?? "");
                setSelectedStyle(Object.keys(data.styles)[0] ?? "");
            } finally {
                setIsUrlLoading(false);
            }
        };
        init();
    }, [hostUrl]);

    /* ——— 当选中的模板变化时，获取对应的酒店信息 ——— */
    useEffect(() => {
        const fetchTemplate = async () => {
            if (!selectedTemplate) return;
            setIsUrlLoading(true);
            try {
                const res = await getTemplate(hostUrl, selectedTemplate);
                console.log("📝 模板原始数据:", res);

                // 根据 HOTEL_INFO 定义，把 res[label] 映射到 hotelInfo[key]
                const mapped = HOTEL_INFO.reduce((acc, { label, key }) => {
                    acc[key] = res[label] ?? "";   // 如果 res[label] 不存在就空字符串
                    return acc;
                }, {});

                setHotelInfo(mapped);
            } catch (err) {
                console.error(err);
            } finally {
                setIsUrlLoading(false);
            }
        };
        fetchTemplate();
    }, [hostUrl, selectedTemplate]);

    /* ——— 切换 LLM 地址：重新拉模型 ——— */
    const applyLLMHost = async () => {
        if (!LLMUrl.trim()) return;
        setIsUrlLoading(true);
        try {
            await setOllamaHost(LLMUrl, hostUrl);
            setModels(await getModels(hostUrl));
        } catch (err) {
            console.error(err);
        } finally {
            setIsUrlLoading(false);
        }
    };

    /* ——— 生成内容 ——— */
    const handleGenerate = async () => {
        setIsLLMLoading(true);
        if (!selectedModel) {
            alert("Please select a model.");
            setIsLLMLoading(false);
            return;
        }
        const res = await genContent(
            hostUrl,
            selectedModel,
            prompt,
            selectedScenario,
            selectedStyle,
            hotelInfo
        );
        setIsLLMLoading(false);
        setResult(res);
    };

    /* ——— 复制 ——— */
    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    /* ——— 渲染 ——— */
    return (
        <div className={styles.page}>
            <h1 className={styles.heading}>Smart Copy Machine</h1>

            {/* Card 1 · System Configuration */}
            <section className={styles.card}>
                <div className={styles.promptHeader}></div>
                <div className={styles.promptHeader}>
                    <h2 className={styles.cardTitle}>🔧 System Configuration</h2>
                    <button
                        className={styles.btn}
                        onClick={applyLLMHost}
                        disabled={isUrlLoading}
                    >
                        Apply
                    </button>
                </div>
                <div className={styles.grid2}>
                    <div className={styles.fieldRow}>
                        <label className={styles.label}>HOST URL</label>
                        <input className={styles.input} value={hostUrl} readOnly />
                    </div>
                    {/* LLM URL 行 */}
                    <div className={styles.fieldRow}>
                        <label className={styles.label}>LLM URL</label>
                        <input
                            className={styles.input}
                            value={LLMUrl}
                            onChange={(e) => setLLMUrl(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Card 2 · Presets & Models */}
            <section className={styles.card}>
                <div className={styles.promptHeader}>
                    <h2 className={styles.cardTitle}>📦 Presets & Models</h2>
                </div>
                {/* 给 grid3 额外 class → 专门控制行方向 */}
                <div className={`${styles.grid3} ${styles.presetsGrid}`}>
                    <div className={styles.fieldRow}>
                        <label className={styles.label}>Model</label>
                        <select
                            className={styles.select}
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            disabled={isUrlLoading}
                        >
                            <option value="">-- Select --</option>
                            {models.map((m) => (
                                <option key={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.fieldRow}>
                        <label className={styles.label}>Scenario</label>
                        <select
                            className={styles.select}
                            value={selectedScenario}
                            onChange={(e) => setSelectedScenario(e.target.value)}
                        >
                            {scenarios.map((s) => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.fieldRow}>
                        <label className={styles.label}>Style</label>
                        <select
                            className={styles.select}
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                        >
                            {stylesPreset.map((s) => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </section >

            {/* Card 3 · Hotel Information */}
            <section className={`${styles.card} ${styles.hotelCard}`}>
                <div className={styles.promptHeader}>
                    <h2 className={styles.cardTitle}>🏨 Hotel Information</h2>
                    <select
                        className={`${styles.templateSelect}`}
                        value={selectedTemplate}
                        onChange={e => setSelectedTemplate(e.target.value)}
                    >
                        <option value="">-- Select Template --</option>
                        {templateList.map(t => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 下面这个循环会随着 hotelInfo 变化自动填入对应 input */}
                {HOTEL_INFO.map(({ label, key }) => (
                    <div key={key} className={styles.fieldRow}>
                        <label className={styles.label}>{label}</label>
                        <input
                            className={styles.input}
                            value={hotelInfo[key] ?? ""}   // 双保险，确保不会拿到 undefined
                            onChange={e =>
                                setHotelInfo({ ...hotelInfo, [key]: e.target.value })
                            }
                            placeholder={`Enter ${label}`}
                        />
                    </div>
                ))}
            </section>


            {/* Card 4: Prompt */}
            < section className={styles.card} >
                <div className={styles.promptHeader}>
                    <h2 className={styles.cardTitle}>✍️ Prompt (Optional: Extra Request)</h2>
                    <button className={styles.btn} onClick={handleGenerate} disabled={isLLMLoading}>
                        Generate
                    </button>
                </div>
                <textarea
                    className={styles.textarea}
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
            </section >

            {/* Card 5: Result */}
            < section className={styles.card} >
                <div className={styles.promptHeader}>
                    <h2 className={styles.cardTitle}>✅ Result</h2>
                    <button className={styles.btn} onClick={handleCopy}>
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
                <div className={styles.resultBox}>
                    <ReactMarkdown>
                        {isLLMLoading ? "Generating..." : result}
                    </ReactMarkdown>
                </div>
            </section >
        </div >
    );
}
