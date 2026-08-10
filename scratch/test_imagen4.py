import os
import base64
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.getenv("GEMINI_API_KEY", "").strip()

models_to_test = [
    ("imagen-4.0-generate-001", f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key={api_key}"),
    ("imagen-4.0-fast-generate-001", f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key={api_key}"),
    ("gemini-2.5-flash-image", f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={api_key}")
]

prompt = "High fashion editorial photograph of an Indian male model wearing traditional silk sherwani in Navy Blue with gold embroidery, full length portrait."

for name, url in models_to_test:
    print(f"\n--- Testing {name} ---")
    try:
        with httpx.Client(timeout=30.0) as client:
            if "imagen" in name:
                payload = {
                    "instances": [{"prompt": prompt}],
                    "parameters": {
                        "sampleCount": 1,
                        "aspectRatio": "3:4",
                        "outputMimeType": "image/jpeg"
                    }
                }
            else:
                payload = {
                    "contents": [{"parts": [{"text": f"Generate a high quality fashion image of: {prompt}"}]}],
                    "generationConfig": {
                        "responseMimeType": "image/jpeg"
                    }
                }
            res = client.post(url, json=payload)
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                data = res.json()
                print("Response JSON keys:", list(data.keys()))
                if "predictions" in data:
                    print("Predictions count:", len(data["predictions"]))
                    pred = data["predictions"][0]
                    print("Prediction keys:", list(pred.keys()))
                    if "bytesBase64Encoded" in pred:
                        b64 = pred["bytesBase64Encoded"]
                        print(f"SUCCESS! Received image base64 length: {len(b64)}")
                        with open("scratch/test_output.jpg", "wb") as f:
                            f.write(base64.b64decode(b64))
                        print("Saved test_output.jpg successfully!")
                        break
                elif "candidates" in data:
                    parts = data["candidates"][0]["content"]["parts"]
                    print("Candidates parts count:", len(parts))
                    for p in parts:
                        print("Part keys:", list(p.keys()))
                        if "inlineData" in p:
                            b64 = p["inlineData"]["data"]
                            print(f"SUCCESS! Received image base64 length: {len(b64)}")
                            with open("scratch/test_output.jpg", "wb") as f:
                                f.write(base64.b64decode(b64))
                            print("Saved test_output.jpg successfully!")
                            break
            else:
                print("Error body:", res.text[:300])
    except Exception as e:
        print(f"Exception: {e}")
