import os
import time
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")

token = os.getenv("REPLICATE_API_TOKEN", "").strip()
print("Token:", token[:10] + "...")

url = "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
    "Prefer": "wait=5"
}
payload = {
    "input": {
        "prompt": "Full body studio fashion photography of a handsome male model wearing a Casual Short Kurta with Slim-Fit Denim Jeans, 8k editorial studio",
        "aspect_ratio": "3:4",
        "output_format": "webp"
    }
}

with httpx.Client(timeout=30.0) as client:
    res = client.post(url, headers=headers, json=payload)
    print("Initial Status:", res.status_code)
    data = res.json()
    
    # If not completed immediately, poll status url
    poll_url = data.get("urls", {}).get("get")
    while data.get("status") in ["starting", "processing"] and poll_url:
        print("Polling...", data.get("status"))
        time.sleep(1)
        res = client.get(poll_url, headers={"Authorization": f"Bearer {token}"})
        data = res.json()
        
    print("Final Status:", data.get("status"))
    output = data.get("output", [])
    print("Generated WebP Image URL:", output)
