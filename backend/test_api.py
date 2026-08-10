import os
import sys
from fastapi.testclient import TestClient

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json.get("status") == "ok"
    print("Health check endpoint test PASSED!")

def test_recommend_endpoint():
    payload = {
        "gender": "Female",
        "occasion": "Diwali celebration",
        "culture": "South Asian",
        "budget": "Medium",
        "season": "Mild",
        "preferences": "Jewel tones, elegant traditional style",
        "additional_notes": "First time attending a big family Diwali party."
    }
    response = client.post("/recommend", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "primary_outfit" in data
    assert "alternatives" in data
    assert len(data["alternatives"]) == 2
    
    primary = data["primary_outfit"]
    assert "clothing_type" in primary
    assert "silhouette" in primary
    assert "colors" in primary
    assert "fabric" in primary
    assert "embroidery_or_pattern" in primary
    assert "accessories" in primary
    assert "footwear" in primary
    assert "hairstyle" in primary
    assert "makeup" in primary
    assert "styling_tips" in primary
    assert "rationale" in primary
    
    print("Recommend endpoint test PASSED!")

def test_sketch_endpoint():
    payload = {
        "clothing_type": "Banarasi Silk Saree",
        "silhouette": "Classic Drape",
        "colors": ["Emerald Green", "Gold"],
        "fabric": "Banarasi Silk",
        "embroidery": "Zari Weave"
    }
    response = client.post("/generate-sketch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "sketch_url" in data
    assert "prompt_used" in data
    print("Generate sketch endpoint test PASSED!")

if __name__ == "__main__":
    test_health_endpoint()
    test_recommend_endpoint()
    test_sketch_endpoint()
