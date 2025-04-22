# Prompt Design Document

## 1. ✨ Purpose
This prompt is designed for generating **hotel descriptions** across multiple platforms (e.g., websites, OTA platforms, social media) and styles (e.g., Japanese Minimalism, English Vintage, Youth Social). The prompt must preserve the core appeal of the hotel while adapting:

- **Tone & Emotion** based on the selected writing style
- **Structure & Content Priority** based on the selected platform scenario

It aims to ensure the generated content is consistent, relevant, and platform-appropriate.

---

## 2. 🔎 Prompt Template Structure

The system uses a **modular prompt** with 3 key inputs:

- `{{ hotel_info }}` — Basic hotel details (name, location, features, etc.)
- `{{ style }}` — A label referencing a specific tone/style preset (e.g., Japanese Minimal)
- `{{ scenario }}` — A label referencing a platform usage context (e.g., Website, OTA)

Each generation request dynamically inserts tone/structure rules from JSON files into the prompt template.

---

## 3. 🌐 Inputs

| Variable     | Description                                      |
| ------------ | ------------------------------------------------ |
| `hotel_info` | Raw hotel details entered or selected by user    |
| `style`      | A writing style label (mapped to style JSON)     |
| `scenario`   | A content-use scenario (mapped to scenario JSON) |

These are combined to produce a prompt like:

> You should use the "Japanese Minimal" tone to write the content for the "Website" platform.

---

## 4. ⚙️ Prompt Template (Main)
See `backend/prompt_template`
```jinja2
You are an experienced travel copywriter specializing in multi-platform hotel promotion. Your job is to adapt the same hotel into different formats while preserving consistency in core appeal and adjusting tone and priorities per platform and style.

Here is the hotel information:
{{ hotel_info }}

You should use the "{{ style }}" tone to write the content for the "{{ scenario }}" platform.

Your task:
- Apply the **style** mainly to tone, word choice, and emotional vibe.
- Follow the **scenario** instructions mainly for structure, length, and information focus.
- The style and the scenario must be **distinct but complementary**.

Please generate the following output:

1. **A one-line catchy headline (title)**
2. **A concise introduction** (2–3 sentences){% if scenario == "OTA" %} — Must be within 180 characters.{% endif %}
3. **Three bullet-point highlights** — Specific and vivid, not generic.

---

### Style Guidance: "{{ style }}"
{{ style_tone }}

### Scenario Instructions: "{{ scenario }}"
{{ scenario_tone }}

---

Additional rules:
- Do NOT mention the style or scenario name directly.
- Do NOT include emojis unless specifically encouraged in the style.
- Do NOT use promotional phrases like “Book now!”
- Always write in English unless otherwise instructed.

---

# Title
{Your catchy headline here}

# Introduction
{Your concise introduction here, 2–3 sentences}

# Highlights
- {Highlight 1 here}
- {Highlight 2 here}
- {Highlight 3 here}

---
```

---

## 5. ✅ Rules & Constraints

- **Style** affects: tone, word choice, emotional feel
- **Scenario** affects: content structure, word count, user intent
- Style & scenario must be used together, but not overlap
- Output must not directly mention either name
- Emojis and tone usage are governed strictly by the `style` setting
- No sales jargon like "Book now!"
- OTA scenario has strict character limit for the introduction (<=180 chars)

---

## 6. 🔄 Composability & Maintenance
- `style_tone` and `scenario_tone` are read from two separate JSON files.
- This design allows independent maintenance and easy extensibility.
- New styles or scenarios can be added without altering prompt logic.
- Users can add extra prompt input (e.g., “Please write in Chinese.”)

---

## 7. 📊 Example Prompt Output (Assembled)
> You are an experienced travel copywriter...
>
> Here is the hotel information:
> MUJI Hotel Ginza, located in Tokyo's Ginza district. It features tatami-style rooms, minimalist wooden interiors, a rooftop library, and a quiet lounge.
>
> You should use the "Japanese Minimal" tone to write the content for the "Website" platform.
>
> ### Style Guidance: "Japanese Minimal"
> Emphasize tranquility, harmony, and simplicity...
>
> ### Scenario Instructions: "Website"
> Create aspirational yet informative content that...
>
> ---
>
> # Title
> A Quiet Retreat in the Heart of Ginza
>
> # Introduction
> Discover a space where calm meets clarity. MUJI Hotel Ginza offers a serene escape within Tokyo’s liveliest district, surrounded by wood, light, and silence.
>
> # Highlights
> - Tatami-style rooms with natural light
> - Rooftop library with curated books
> - Minimalist design in every detail

---

## 8. ✨ Summary of Design Highlights
- ✅ Modular: Prompt template is universal, JSON-controlled components inject tone/structure
- ✅ Extensible: New styles and scenarios can be added without modifying the core logic
- ✅ Controlled: Rules prevent mixing tone/structure, encourage clean output
- ✅ Flexible: Extra prompt input supports multilingual use or advanced control

