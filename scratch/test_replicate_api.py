import os
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")

replicate_token = os.getenv("REPLICATE_API_TOKEN", "").strip()
print("Replicate Token found in env?:", bool(replicate_token))

if not replicate_token:
    print("Please add REPLICATE_API_TOKEN to backend/.env first!")
else:
    # Test Flux Schnell model prediction on Replicate
    url = "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions"
    headers = {
        "Authorization": f"Bearer {replicate_token}",
        "Content-Type": "application/json",
        "Prefer": "wait"
    }
    payload = {
        "input": {
            "prompt": "Full body professional studio fashion photography of a handsome male model wearing a Casual Short Kurta with Slim-Fit Denim Jeans, luxury editorial lighting, 8k resolution",
            "aspect_ratio": "3:4",
            "output_format": "webp"
        }
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            res = client.post(url, headers=headers, json=payload)
            print("Status code:", res.status_code)
            if res.status_code in [200, 201]:
                data = res.json()
                output = data.get("output", [])
                print("Generated Image URL(s):", output)
            else:
                print("Error response:", res.text)
    except Exception as e:
        print("Replicate API test failed:", e)
