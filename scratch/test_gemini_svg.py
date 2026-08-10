import os
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.getenv("GEMINI_API_KEY", "").strip()

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"

prompt = """You are Google Gemini AI Fashion Image Generator.
Generate an artistic, high-resolution, full-length vector SVG illustration of a handsome male model wearing a traditional silk sherwani jacket in Navy Blue with gold embroidery.
Return ONLY valid SVG XML code starting with <svg> and ending with </svg>. Do not include markdown codeblocks or any extra text."""

payload = {
    "contents": [{"parts": [{"text": prompt}]}]
}

with httpx.Client(timeout=30.0) as client:
    res = client.post(url, json=payload)
    print("Status:", res.status_code)
    if res.status_code == 200:
        text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
        print("Response length:", len(text))
        print("Snippet:", text[:200])
