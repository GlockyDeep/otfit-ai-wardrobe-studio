import os
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.getenv("GEMINI_API_KEY", "").strip()

print(f"API Key present: {bool(api_key)}")

# Let's test Imagen 3 model endpoints or Gemini 2.0 Flash / Imagen endpoints
endpoints_to_test = [
    ("imagen-3.0-generate-002", f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={api_key}"),
    ("imagen-3.0-fast-generate-001", f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-generate-001:predict?key={api_key}"),
    ("gemini-2.0-flash", f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}")
]

prompt = "fashion studio photograph of Indian male model wearing traditional silk sherwani jacket in Navy Blue, full length editorial portrait"

for name, url in endpoints_to_test:
    print(f"\nTesting {name}...")
    try:
        with httpx.Client(timeout=30.0) as client:
            if "imagen" in name:
                payload = {
                    "instances": [{"prompt": prompt}],
                    "parameters": {"sampleCount": 1, "aspectRatio": "3:4"}
                }
            else:
                payload = {
                    "contents": [{"parts": [{"text": f"Generate image: {prompt}"}]}]
                }
            res = client.post(url, json=payload)
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                print("Response JSON keys:", list(res.json().keys()))
                data = res.json()
                if "predictions" in data:
                    print("Predictions count:", len(data["predictions"]))
                    if data["predictions"]:
                        print("Keys in prediction:", list(data["predictions"][0].keys()))
            else:
                print("Response text:", res.text[:200])
    except Exception as e:
        print(f"Error: {e}")
