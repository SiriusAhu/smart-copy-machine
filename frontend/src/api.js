import axios from 'axios'

export async function getModels(hostUrl) {
  const res = await axios.get(`${hostUrl}/get_models`)
  return res.data
}

// for testing only
export async function getResponse(hostUrl, model, prompt) {
  const res = await axios.get(`${hostUrl}/get_response`, {
    params: { model, prompt },
  })
  return res.data
}

export async function setOllamaHost(LLMUrl, hostUrl) {
  // console.log('Setting Ollama host to:', LLMUrl)
  // console.log('Host URL:', hostUrl)
  return axios.post(`${hostUrl}/set_host`, { LLMUrl }).then(r => r.data)
}

export async function getPresets(hostUrl) {
  const { data } = await axios.get(`${hostUrl}/get_presets`);
  // console.log('Presets:', data);
  // 这里可以做一次简单校验，确保返回格式正确
  if (!data.scenarios || !data.styles) {
    throw new Error("Invalid /presets response");
  }
  return data;
}

export async function genContent(hostUrl, model, prompt, scenario, style, hotelInfo) {
  const res = await axios.post(`${hostUrl}/gen_content`, {
    model,
    prompt,
    scenario,
    style,
    hotelInfo
  });
  console.log('Response:', res.data);
  return res.data;
}

export async function getTemplateList(hostUrl) {
  const res = await axios.get(`${hostUrl}/get_template_list`);
  return res.data;
}

export async function getTemplate(hostUrl, templateName) {
  const res = await axios.get(`${hostUrl}/get_template`, {
    params: { template_name: templateName },
  });
  return res.data;
}