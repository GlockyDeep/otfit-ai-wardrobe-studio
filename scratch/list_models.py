import os
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.getenv("GEMINI_API_KEY", "").strip()

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
with httpx.Client(timeout=30.0) as client:
    res = client.get(url)
    if res.status_code == 200:
        models = res.json().get("models", [])
        print(f"Total models found: {len(models)}")
        for m in models:
            name = m.get("name")
            supported_methods = m.get("supportedGenerationMethods", [])
            print(f"- {name} | methods: {supported_methods}")
    else:
        print("Error:", res.status_code, res.text)
