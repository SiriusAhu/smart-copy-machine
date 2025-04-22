from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import ollama
from pydantic import BaseModel
import json
import jinja2

PRESET_PATHS= {
    "scenarios": r"presets/scenarios.json",
    "styles": r"presets/styles.json",
}

class HostData(BaseModel):
    LLMUrl: str

# Unset proxy settings for the FastAPI app
import os
os.environ.pop("http_proxy", None)
os.environ.pop("https_proxy", None)

# Initialize the Ollama client
client = ollama.Client(
    host="http://localhost:11434",
)
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to restrict origins if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

# region === LLM ===
@app.post("/set_host")
def set_host(data: HostData):
    print("#### set_host")
    try:
        global client
        client = ollama.Client(host=data.LLMUrl)
        print(f"{[model['model'] for model in client.list()['models']]}")
        return {"status": "ok", "host": data.LLMUrl}
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/get_models")
def get_models():
    try:
        models = client.list()
        return [model['model'] for model in models['models']]
    except Exception as e:
        return {"error": str(e)}

@app.get("/get_response")
def get_response(model: str, prompt: str):
    try:
        response = client.generate(model=model, prompt=prompt)
        return response['response']
    except Exception as e:
        return {"error": str(e)}
# endregion

# region === Preset: Scenarios & Styles ===
@app.get("/get_presets")
def get_presets():
    try:
        with open(PRESET_PATHS["scenarios"], "r") as f:
            scenarios = json.load(f)
        with open(PRESET_PATHS["styles"], "r") as f:
            styles = json.load(f)
        return {"scenarios": scenarios, "styles": styles}
    except Exception as e:
        return {"error": str(e)}
# endregion

# region === Content Generation ===
def gen_hotel_prompt(selected_style: str, selected_scenario: str, hotel_info: dict, prompt: str = "") -> str:

    # Load presets
    styles = json.load(open(r"presets/styles.json"))
    scenarios = json.load(open(r"presets/scenarios.json"))
    template = jinja2.Template(open(r"prompt_template").read())

    # hotel_info -> markdown bullet
    def hotel_info2str(hotel_info):
        lines = []
        for key, value in hotel_info.items():
            if isinstance(value, list):
                value = ", ".join(value)
            key = key.replace("_", " ").title()
            lines.append(f"- **{key}**: {value}")
        return "\n".join(lines)

    # Render final prompt
    rendered = template.render(
        hotel_info=hotel_info2str(hotel_info),
        style=selected_style,
        style_tone=styles[selected_style],
        scenario=selected_scenario,
        scenario_tone=scenarios[selected_scenario],
    )
    
    # Add additional prompt if provided
    if prompt:
        rendered += f"\n\nPlease also consider the following:\n{prompt}"

    return rendered

class HotelInfo(BaseModel):
    name: str
    location: str
    architecturalStyle: str
    serviceHighlights: str
    suitableFor: str

class GenContentRequest(BaseModel):
    model: str
    prompt: str
    scenario: str
    style: str
    hotelInfo: HotelInfo
    
@app.post("/gen_content")
def gen_content(data: GenContentRequest):
    print("#### gen_content")
    try:
        # Convert hotel info to dict
        hotel_info = data.hotelInfo.dict()
        
        # Generate prompt
        prompt = gen_hotel_prompt(
            selected_style=data.style,
            selected_scenario=data.scenario,
            hotel_info=hotel_info,
            prompt=data.prompt,
        )
        
        with open("presets/prompt.txt", "w") as f:
            f.write(prompt)
        
        # Get response from LLM
        response = client.generate(model=data.model, prompt=prompt)
        
        with open("presets/response.md", "w") as f:
            f.write(response['response'])
        
        return response['response']
    except Exception as e:
        return {"error": str(e)}
# endregion

# region === Templates ===
@app.get("/get_template_list")
def get_template_list():
    try:
        templates = []
        for root, dirs, files in os.walk(r"./templates"):
            for file in files:
                templates.append(file.replace(".json", ""))
        print(templates)
        return templates
    except Exception as e:
        return {"error": str(e)}

@app.get("/get_template")
def get_template(template_name: str):
    try:
        with open(fr"./templates/{template_name}.json", "r") as f:
            template = json.load(f)
        return template
    except Exception as e:
        return {"error": str(e)}
# endregion