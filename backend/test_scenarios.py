import os
import sys
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import app

client = TestClient(app)

SCENARIOS = [
    {
        "name": "Scenario 1: Female / Diwali / South Asian / Medium / Mild",
        "payload": {
            "gender": "Female",
            "occasion": "Diwali celebration",
            "culture": "South Asian",
            "budget": "Medium",
            "season": "Mild",
            "preferences": "Jewel tones, elegant traditional style",
            "additional_notes": "Family gathering"
        }
    },
    {
        "name": "Scenario 2: Male / Business meeting / Western / Medium / Summer",
        "payload": {
            "gender": "Male",
            "occasion": "Business meeting",
            "culture": "Western",
            "budget": "Medium",
            "season": "Summer",
            "preferences": "Professional and minimal",
            "additional_notes": "Client presentation"
        }
    },
    {
        "name": "Scenario 3: Female / Wedding guest / Indo-Western / High / Winter",
        "payload": {
            "gender": "Female",
            "occasion": "Wedding guest",
            "culture": "Indo-Western",
            "budget": "High",
            "season": "Winter",
            "preferences": "Contemporary but culturally inspired",
            "additional_notes": "Evening reception"
        }
    },
    {
        "name": "Scenario 4: Male / College / Western / Low / Summer",
        "payload": {
            "gender": "Male",
            "occasion": "College",
            "culture": "Western",
            "budget": "Low",
            "season": "Summer",
            "preferences": "Casual and comfortable",
            "additional_notes": "Campus everyday wear"
        }
    },
    {
        "name": "Scenario 5: Female / Cocktail party / Western / High / Mild",
        "payload": {
            "gender": "Female",
            "occasion": "Cocktail party",
            "culture": "Western",
            "budget": "High",
            "season": "Mild",
            "preferences": "Elegant and modern",
            "additional_notes": "Rooftop lounge event"
        }
    }
]

REQUIRED_KEYS = [
    "clothing_type", "silhouette", "colors", "fabric",
    "embroidery_or_pattern", "accessories", "footwear",
    "hairstyle", "makeup", "styling_tips", "rationale"
]

def validate_outfit(outfit: dict, label: str):
    for key in REQUIRED_KEYS:
        assert key in outfit, f"Missing key '{key}' in {label}"
        val = outfit[key]
        if isinstance(val, list):
            assert len(val) > 0, f"Array '{key}' is empty in {label}"
        else:
            assert isinstance(val, str) and len(val.strip()) > 0, f"Field '{key}' is empty in {label}"

def run_all_scenarios():
    print("=" * 60)
    print("RUNNING END-TO-END SCENARIO VERIFICATION")
    print("=" * 60)

    for scenario in SCENARIOS:
        print(f"\n[TESTING] {scenario['name']}...")
        response = client.post("/recommend", json=scenario["payload"])
        assert response.status_code == 200, f"Request failed with status {response.status_code}"
        
        data = response.json()
        assert "primary_outfit" in data, "Missing primary_outfit"
        assert "alternatives" in data, "Missing alternatives"
        assert len(data["alternatives"]) == 2, f"Expected 2 alternatives, got {len(data['alternatives'])}"

        # Validate Primary Outfit
        validate_outfit(data["primary_outfit"], f"{scenario['name']} -> Primary Outfit")

        # Validate Alternatives
        for i, alt in enumerate(data["alternatives"]):
            validate_outfit(alt, f"{scenario['name']} -> Alternative {i+1}")

        print(f"  |- Primary: {data['primary_outfit']['clothing_type']}")
        print(f"  |- Alt 1:   {data['alternatives'][0]['clothing_type']}")
        print(f"  |- Alt 2:   {data['alternatives'][1]['clothing_type']}")
        print(f"  |- PASSED!")

    print("\n" + "=" * 60)
    print("ALL 5 TEST SCENARIOS PASSED SUCCESSFULLY WITH VALID STRUCTURE!")
    print("=" * 60)

if __name__ == "__main__":
    run_all_scenarios()
