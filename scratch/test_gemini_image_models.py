import os
import base64
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.getenv("GEMINI_API_KEY", "").strip()

models_to_test = [
    "gemini-3.1-flash-image",
    "gemini-3-pro-image",
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-lite-image",
    "gemini-3.5-flash"
]

prompt = "Fashion editorial photograph of an Indian male model wearing traditional silk sherwani in Navy Blue."

for model in models_to_test:
    print(f"\n--- Testing {model} ---")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    try:
        with httpx.Client(timeout=30.0) as client:
            res = client.post(url, json=payload)
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    print(f"Success! Received {len(parts)} parts.")
                    for idx, p in enumerate(parts):
                        print(f"Part {idx} keys: {list(p.keys())}")
                        if "inlineData" in p:
                            b64 = p["inlineData"]["data"]
                            mime = p["inlineData"].get("mimeType")
                            print(f"FOUND INLINE IMAGE! Mime: {mime}, length: {len(b64)}")
                            with open(f"scratch/{model}_out.jpg", "wb") as f:
                                f.write(base64.b64decode(b64))
                        elif "text" in p:
                            print("Text snippet:", p["text"][:100])
            else:
                print("Error:", res.text[:250])
    except Exception as e:
        print("Exception:", e)
