import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")

gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
print("Gemini API Key exists?:", bool(gemini_key))

prompt = """You are a master vector fashion illustrator. Generate ONLY raw valid SVG XML code (wrapped in <svg>...</svg>, no markdown ticks ```, no preamble, no explanations) representing a stunning, high-fashion croquis vector illustration of a male model wearing a Tailored Flannel Shirt with Dark Wash Raw Denim Jeans and Cashmere Cardigan.
Use rich SVG gradients, smooth paths, realistic garment folds, collar details, buttons, pocket highlights, and dark luxury aesthetic background.
Width: 600, Height: 800, viewBox: 0 0 600 800.
"""

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={gemini_key}"
payload = {
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {"temperature": 0.4}
}

try:
    with httpx.Client(timeout=30.0) as client:
        res = client.post(url, json=payload)
        print("Status code:", res.status_code)
        if res.status_code == 200:
            data = res.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            print("Response preview:", text[:300])
            if "<svg" in text:
                start = text.find("<svg")
                end = text.rfind("</svg>") + 6
                svg_code = text[start:end]
                with open("scratch/gemini_generated_test.svg", "w", encoding="utf-8") as f:
                    f.write(svg_code)
                print("Successfully wrote scratch/gemini_generated_test.svg! Size:", len(svg_code))
except Exception as e:
    print("Error:", e)
