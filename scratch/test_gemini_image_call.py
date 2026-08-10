import os
import base64
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.getenv("GEMINI_API_KEY", "").strip()

def generate_gemini_fashion_image(prompt: str) -> str:
    if not api_key:
        return ""
    
    # Try gemini-2.5-flash-image or gemini-3.1-flash-image
    models = ["gemini-2.5-flash-image", "gemini-3.1-flash-image", "gemini-flash-latest"]
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": f"Generate a realistic high-resolution fashion editorial photograph of: {prompt}"}]}]
        }
        try:
            with httpx.Client(timeout=15.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for p in parts:
                            if "inlineData" in p:
                                b64 = p["inlineData"]["data"]
                                mime = p["inlineData"].get("mimeType", "image/jpeg")
                                return f"data:{mime};base64,{b64}"
        except Exception as e:
            print(f"Error calling {model}: {e}")
    return ""

print("Test result:", bool(generate_gemini_fashion_image("Indian male model wearing silk sherwani")))
