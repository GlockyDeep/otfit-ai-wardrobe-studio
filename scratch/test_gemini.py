import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv('backend/.env')

api_key = os.getenv("GEMINI_API_KEY", "").strip()

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"

prompt = """You are an expert AI Fashion Designer and Stylist.
Design a complete outfit for:
Gender: Male
Occasion: Wedding Reception
Culture: South Asian
Budget: High
Season: Mild

Provide your output as a JSON object matching:
{
  "primary_outfit": {
    "clothing_type": "Silk Sherwani",
    "silhouette": "Fitted shoulder mandarin collar",
    "colors": ["Royal Navy Blue", "Champagne Gold"],
    "fabric": "Raw Silk",
    "embroidery_or_pattern": "Zardozi brocade weave",
    "accessories": ["Pocket square", "Beaded mala"],
    "footwear": "Handcrafted Mojris",
    "hairstyle": "Neat side part",
    "makeup": "Clean skin finish",
    "styling_tips": ["Keep jacket buttoned"],
    "rationale": "Regal formal outfit"
  },
  "alternatives": [
    {
      "clothing_type": "Indo-Western Tuxedo",
      "silhouette": "Structured blazer",
      "colors": ["Black", "Gold"],
      "fabric": "Velvet",
      "embroidery_or_pattern": "Satin lapel",
      "accessories": ["Bow tie"],
      "footwear": "Oxfords",
      "hairstyle": "Slicked back",
      "makeup": "Clean finish",
      "styling_tips": ["Formal gala look"],
      "rationale": "Contemporary formal alternative"
    },
    {
      "clothing_type": "Silk Modi Jacket Set",
      "silhouette": "Vest over kurta",
      "colors": ["Maroon", "Ivory"],
      "fabric": "Silk blend",
      "embroidery_or_pattern": "Jacquard weave",
      "accessories": ["Brooch"],
      "footwear": "Juttis",
      "hairstyle": "Short trim",
      "makeup": "Hydrated finish",
      "styling_tips": ["Layer vest over kurta"],
      "rationale": "Festive smart formal alternative"
    }
  ]
}
"""

payload = {
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {"responseMimeType": "application/json"}
}

with httpx.Client(timeout=20.0) as client:
    res = client.post(url, json=payload)
    print("Status Code:", res.status_code)
    if res.status_code == 200:
        data = res.json()
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        print("\n--- GEMINI FLASH LATEST FASHION RECOMMENDATION ---")
        print(raw_text[:400])
        parsed = json.loads(raw_text)
        print("\nParsed successfully!")
        print("Primary Outfit:", parsed["primary_outfit"]["clothing_type"])
    else:
        print("Error:", res.text)
