import os
import urllib.parse
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.getenv("GEMINI_API_KEY", "").strip()

def generate_gemini_svg_fashion_image(clothing_type: str, colors: list, fabric: str, gender: str) -> str:
    if not api_key:
        return ""
    
    color_str = ", ".join(colors) if colors else "harmonious colors"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
    
    prompt = f"""You are Google Gemini AI Fashion Illustration Engine.
Generate an elegant, high-resolution vector SVG fashion sketch illustration for a {gender} model wearing: {clothing_type} in {color_str} with {fabric} texture.

REQUIREMENTS:
1. Return ONLY raw valid XML <svg viewBox="0 0 600 800" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">...</svg>.
2. Do NOT wrap in markdown or backticks.
3. Draw a stylish fashion croquis mannequin silhouette with garment layers, folds, collar, buttons, embroidery details, and rich gradient fills matching colors: {color_str}.
"""

    try:
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.4}
        }
        with httpx.Client(timeout=15.0) as client:
            res = client.post(url, json=payload)
            if res.status_code == 200:
                raw = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                if "```xml" in raw:
                    raw = raw.split("```xml")[1].split("```")[0].strip()
                elif "```svg" in raw:
                    raw = raw.split("```svg")[1].split("```")[0].strip()
                elif "```" in raw:
                    raw = raw.split("```")[1].split("```")[0].strip()
                
                if "<svg" in raw and "</svg>" in raw:
                    svg_clean = raw[raw.find("<svg"):raw.find("</svg>") + 6]
                    encoded = urllib.parse.quote(svg_clean)
                    return f"data:image/svg+xml;utf8,{encoded}"
    except Exception as e:
        print(f"Error: {e}")
    return ""

# Test execution
res_url = generate_gemini_svg_fashion_image("Royal Navy Sherwani", ["Navy Blue", "Gold"], "Raw Silk", "Male")
print("Result URL length:", len(res_url))
print("Is SVG data URL:", res_url.startswith("data:image/svg+xml;utf8,%3Csvg"))
