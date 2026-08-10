import os
import urllib.parse
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.getenv("GEMINI_API_KEY", "").strip()

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"

prompt = """You are Google Gemini AI Fashion Designer & Illustration Generator.
Generate a complete, high-resolution vector SVG fashion sketch of an Indian male model wearing a traditional silk sherwani in Navy Blue with gold embroidery accents.
Requirements:
1. Output MUST be ONLY raw valid SVG starting with <svg> and ending with </svg>.
2. Use viewBox="0 0 800 1000" with width="100%" height="100%".
3. Render a stylish fashion mannequin figure with detailed garment drape, collar, buttons, colors, and shadows.
4. No text outside <svg>. No markdown wrapper."""

payload = {
    "contents": [{"parts": [{"text": prompt}]}]
}

with httpx.Client(timeout=30.0) as client:
    res = client.post(url, json=payload)
    print("Status:", res.status_code)
    if res.status_code == 200:
        raw = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        if "```xml" in raw:
            raw = raw.split("```xml")[1].split("```")[0].strip()
        elif "```svg" in raw:
            raw = raw.split("```svg")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
            
        print("Raw SVG length:", len(raw))
        print("Starts with <svg?:", raw.startswith("<svg"))
        encoded = urllib.parse.quote(raw)
        data_url = f"data:image/svg+xml;utf8,{encoded}"
        print("Data URL length:", len(data_url))
