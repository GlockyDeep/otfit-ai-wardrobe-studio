import urllib.parse
import httpx

prompt = "Full body professional studio fashion photography of a handsome male model wearing a Casual Short Kurta with Slim-Fit Denim Jeans, luxury background, 8k resolution"
encoded_prompt = urllib.parse.quote(prompt)

url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=1000&nologo=true&model=flux"

print("Generated Pollinations AI Image URL:\n", url)

try:
    with httpx.Client(timeout=15.0) as client:
        res = client.get(url)
        print("Status code:", res.status_code)
        print("Content type:", res.headers.get("content-type"))
        print("Bytes received:", len(res.content))
except Exception as e:
    print("Fetch error:", e)
