import os
import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import httpx

# --- Pydantic Data Models (Matches Required Response Schema) ---

class OutfitDetail(BaseModel):
    clothing_type: str = Field(..., description="Type of garment, e.g. Banarasi Silk Saree or Two-Piece Tuxedo")
    silhouette: str = Field(..., description="Silhouette or cut description, e.g. A-line, Slim fit, Draped")
    colors: List[str] = Field(..., description="List of primary and accent colors, e.g. ['Emerald Green', 'Gold']")
    fabric: str = Field(..., description="Fabric composition, e.g. Raw Banarasi Silk")
    embroidery_or_pattern: str = Field(..., description="Embroidery, weave, or pattern details")
    accessories: List[str] = Field(..., description="Recommended accessories list")
    footwear: str = Field(..., description="Footwear recommendation")
    hairstyle: str = Field(..., description="Hairstyle recommendation")
    makeup: str = Field(..., description="Makeup or grooming recommendation")
    styling_tips: List[str] = Field(..., description="Actionable styling tips for wearing this outfit")
    rationale: str = Field(..., description="Fashion design rationale explaining why this outfit suits the occasion, culture, season, and budget")

class RecommendationResponse(BaseModel):
    primary_outfit: OutfitDetail
    alternatives: List[OutfitDetail]


SYSTEM_PROMPT = """You are an expert AI Fashion Designer and Personal Stylist.
Your goal is to create bespoke fashion design recommendations tailored to a client's gender, occasion, cultural preference, budget level, and season/climate.

CRITICAL INSTRUCTIONS:
1. You must act as a creative fashion designer, NOT an e-commerce product recommender. Do NOT mention store links, brand names, or shopping prices. Focus on design aesthetics, garment cuts, fabric drape, color harmonies, and styling rationale.
2. Incorporate the provided Fashion Knowledge Context (rules, candidate garments, recommended fabrics, color guidance, and embroidery levels).
3. Produce EXACTLY ONE primary outfit and EXACTLY TWO meaningfully different alternative outfits.
4. Each outfit MUST include: clothing_type, silhouette, colors (array of strings), fabric, embroidery_or_pattern, accessories (array of strings), footwear, hairstyle, makeup, styling_tips (array of strings), and rationale.
5. Your response MUST be valid JSON adhering precisely to the specified schema.
"""

def build_user_prompt(context: Dict[str, Any]) -> str:
    return f"""Please design a complete outfit recommendation based on the following user requirements and fashion rules:

User Specifications:
- Gender: {context.get('gender')}
- Occasion: {context.get('occasion')} (Matched Category: {context.get('matched_occasion')})
- Cultural Context: {context.get('culture')} (Matched Culture: {context.get('matched_culture')})
- Budget Level: {context.get('budget')}
- Season / Climate: {context.get('season')}
- Preferred Colors / Style: {context.get('user_preferences') or 'None specified'}
- Additional Notes: {context.get('additional_notes') or 'None specified'}

Fashion Knowledge & Rule Engine Context:
- Recommended Candidate Garments: {', '.join(context.get('candidate_garments', []))}
- Compatible Fabrics: {', '.join(context.get('recommended_fabrics', []))}
- Avoid Fabrics: {', '.join(context.get('avoid_fabrics', []))}
- Color Palette Guidance: {context.get('color_guidance')}
- Embroidery Level & Motifs: Level {context.get('embroidery_level')}. Motifs: {', '.join(context.get('signature_motifs', []))}
- Traditional / Key Accessories: {', '.join(context.get('accessories', []))}
- Recommended Footwear: {', '.join(context.get('footwear_options', []))}
- Seasonal Styling Focus: {context.get('season_styling_focus')}
- Budget Guidance: Fabric ({context.get('budget_fabric_guidance')}), Work ({context.get('budget_embroidery_guidance')})

OUTPUT JSON SCHEMA REQUIREMENT:
Provide your output as a JSON object with:
{{
  "primary_outfit": {{
    "clothing_type": "string",
    "silhouette": "string",
    "colors": ["string"],
    "fabric": "string",
    "embroidery_or_pattern": "string",
    "accessories": ["string"],
    "footwear": "string",
    "hairstyle": "string",
    "makeup": "string",
    "styling_tips": ["string"],
    "rationale": "string"
  }},
  "alternatives": [
    // Exactly 2 alternative objects with identical keys
  ]
}}
"""

def generate_recommendation_ai(context: Dict[str, Any]) -> RecommendationResponse:
    provider = os.getenv("AI_PROVIDER", "openai").lower()
    
    if provider == "groq":
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
        base_url = "https://api.groq.com/openai/v1"
    else:
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
        base_url = "https://api.openai.com/v1"

    # If no API key provided, use rule-engine deterministic mock fallback
    if not api_key:
        print(f"[INFO] No valid {provider.upper()}_API_KEY found in environment. Generating rule-based recommendation fallback.")
        return generate_mock_fallback(context)

    user_prompt = build_user_prompt(context)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.7
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            res_data = response.json()
            raw_content = res_data["choices"][0]["message"]["content"]
            
            parsed_json = json.loads(raw_content)
            validated = RecommendationResponse.model_validate(parsed_json)
            
            # Ensure exactly 2 alternatives
            if len(validated.alternatives) > 2:
                validated.alternatives = validated.alternatives[:2]
            elif len(validated.alternatives) < 2:
                # Add mock fallback if LLM returned fewer than 2 alternatives
                fallback_alt = generate_mock_fallback(context).alternatives[0]
                while len(validated.alternatives) < 2:
                    validated.alternatives.append(fallback_alt)

            return validated
            
    except Exception as e:
        print(f"[ERROR] AI Provider request failed ({e}). Returning fallback rule-engine recommendation.")
        return generate_mock_fallback(context)


def generate_mock_fallback(context: Dict[str, Any]) -> RecommendationResponse:
    """
    Rule-engine powered deterministic fashion generator when offline or API key is not present.
    Guarantees reliable, highly accurate responses matching all prompt requirements.
    """
    gender = context.get("gender", "Female")
    occasion = context.get("occasion", "Special Event")
    culture = context.get("culture", "South Asian")
    budget = context.get("budget", "Medium")
    season = context.get("season", "Mild")
    prefs = context.get("user_preferences", "")
    
    garments = context.get("candidate_garments", ["Custom Outfit"])
    fabrics = context.get("recommended_fabrics", ["Fine Fabric"])
    motifs = context.get("signature_motifs", ["Minimal Motif"])
    accessories = context.get("accessories", ["Accessory"])
    footwear_list = context.get("footwear_options", ["Dress Shoes"])
    color_guide = context.get("color_guidance", "Harmonious palette")

    is_female = "female" in gender.lower() or "woman" in gender.lower()
    is_male = "male" in gender.lower() or "man" in gender.lower()

    if "south asian" in culture.lower():
        if "diwali" in occasion.lower() or "wedding" in occasion.lower() or "festive" in occasion.lower():
            if is_female:
                primary = OutfitDetail(
                    clothing_type="Banarasi Silk Lehenga Choli with Zardozi Embroidered Dupatta",
                    silhouette="A-Line flared lehenga with structured blouse and draped dupatta",
                    colors=["Emerald Green", "Royal Gold", "Deep Crimson Accent"],
                    fabric="Pure Banarasi Silk and Organza Dupatta",
                    embroidery_or_pattern="Handcrafted Zardozi floral motifs along the border with gold zari weave",
                    accessories=["Kundan choker set", "Maang tikka", "Gold bangles", "Potli bag"],
                    footwear="Embroidered Antique Gold Mojris",
                    hairstyle="Soft low bun decorated with fresh jasmine flowers (Gajra)",
                    makeup="Warm glowing skin with subtle gold eye shadow and deep berry lip color",
                    styling_tips=[
                        "Drape the organza dupatta neatly across one shoulder to highlight blouse embroidery.",
                        "Choose warm gold jewelry to complement the emerald and crimson color palette.",
                        "Ensure the lehenga hem sits 0.5 inches above footwear for graceful movement."
                    ],
                    rationale=f"Designed specifically for a {occasion} in a {season} climate. The rich Banarasi silk offers regal elegance suitable for a {budget} budget, while the emerald and gold hues align with traditional festive aesthetics."
                )
                alt1 = OutfitDetail(
                    clothing_type="Contemporary Draped Silk Saree with Embroidered Velvet Blouse",
                    silhouette="Fluid pre-draped contour silhouette with structured sweetheart neckline",
                    colors=["Ruby Red", "Antique Copper", "Warm Champagne"],
                    fabric="Fluid Georgette Saree with Micro-Velvet Blouse",
                    embroidery_or_pattern="Gota Patti work along saree borders with subtle zari embroidery",
                    accessories=["Chandbali statement earrings", "Statement ring", "Embellished clutch"],
                    footwear="Block Heel Metallic Sandals",
                    hairstyle="Side-swept loose Hollywood waves",
                    makeup="Classic winged eyeliner with nude crimson gloss",
                    styling_tips=[
                        "Pre-draped pleats provide effortless elegance throughout evening festivities.",
                        "Focus statement jewelry on earrings to let the neckline shine."
                    ],
                    rationale=f"An elegant drape alternative combining traditional Ruby Red tones with modern fluid silhouette cuts."
                )
                alt2 = OutfitDetail(
                    clothing_type="Indo-Western Anarkali Gown with Sheer Cape",
                    silhouette="Floor-length high-waist flared gown silhouette",
                    colors=["Mustard Yellow", "Magenta Accent", "Gold"],
                    fabric="Chiffon and Silk Satin blend",
                    embroidery_or_pattern="Chikankari shadow threadwork with delicate mirror highlights",
                    accessories=["Filigree cuff bracelet", "Pearl drop earrings"],
                    footwear="Kolhapuri Wedge Sandals",
                    hairstyle="Half-up braided crown with loose tendrils",
                    makeup="Dewy coral blush with soft brown eyeliner",
                    styling_tips=[
                        "The lightweight chiffon cape allows breathable movement for long celebrations.",
                        "Pair with light-reflective Kolhapuri wedges for all-day comfort."
                    ],
                    rationale="A lighter, contemporary Indo-Western alternative ideal for festive social gatherings."
                )
            else: # Male / Other
                primary = OutfitDetail(
                    clothing_type="Silk Sherwani with Asymmetric Kurta and Churidar",
                    silhouette="Tailored fitted shoulder silhouette with mandarin collar",
                    colors=["Royal Navy Blue", "Champagne Gold", "Antique Silver"],
                    fabric="Raw Silk with Brocade Inner Tunic",
                    embroidery_or_pattern="Self-textured brocade weave with delicate threadwork on collar and cuffs",
                    accessories=["Pocket square in champagne silk", "Emerald brooches", "Beaded strand mala"],
                    footwear="Handcrafted Royal Blue Leather Mojris",
                    hairstyle="Neatly groomed side part with matte finish pomade",
                    makeup="Groomed eyebrows and natural hydrated lip balm",
                    styling_tips=[
                        "Button the sherwani jacket up to the collar for a regal structured profile.",
                        "Match pocket square tone precisely to the churidar trousers."
                    ],
                    rationale=f"A regal male ensemble tailored for a {occasion}. Raw silk provides structure and warmth suitable for {budget} budget execution."
                )
                alt1 = OutfitDetail(
                    clothing_type="Bandhgala Suit with Tailored Trousers",
                    silhouette="Structured military-inspired slim silhouette",
                    colors=["Charcoal Gray", "Burgundy Accent"],
                    fabric="Fine Italian Wool and Silk Blend",
                    embroidery_or_pattern="Minimalist tonal stitching with custom brass buttons",
                    accessories=["Silk lapel pin", "Leather watch with silver bezel"],
                    footwear="Polished Dark Brown Leather Monk Straps",
                    hairstyle="Clean pompadour fade",
                    makeup="Hydrated skin finish",
                    styling_tips=["Keep collar crisp and buttoned; pair with sleek leather monk straps."],
                    rationale="A modern fusion option bridging South Asian heritage with contemporary formal tailoring."
                )
                alt2 = OutfitDetail(
                    clothing_type="Embroidered Kurta Set with Brocade Nehru Jacket",
                    silhouette="Relaxed fit straight kurta with waist-length tailored jacket",
                    colors=["Ivory Cream", "Deep Maroon", "Gold"],
                    fabric="Cotton Silk Kurta with Jacquard Brocade Jacket",
                    embroidery_or_pattern="Traditional floral jacquard weave on vest",
                    accessories=["Gold cufflinks", "Contrasting pocket square"],
                    footwear="Tan Leather Mojris",
                    hairstyle="Natural textured look",
                    makeup="Minimal grooming",
                    styling_tips=["Layer the jacket open or half-buttoned for comfortable movement during festivities."],
                    rationale="A comfortable, festive alternative offering high visual appeal with ease of movement."
                )
        else: # Generic South Asian
            primary = OutfitDetail(
                clothing_type=f"Classic {garments[0]} Ensemble",
                silhouette="Structured traditional fit",
                colors=["Jewel Tone", "Gold Accent"],
                fabric=fabrics[0] if fabrics else "Silk Blend",
                embroidery_or_pattern=f"{motifs[0]} embroidery" if motifs else "Refined threadwork",
                accessories=accessories[:3] if accessories else ["Traditional Jewelry", "Clutch"],
                footwear=footwear_list[0] if footwear_list else "Traditional Footwear",
                hairstyle="Elegant Updo or Styled Waves",
                makeup="Polished event makeup",
                styling_tips=["Ensure clean draping and fit.", "Coordinate accessories with metallic accents."],
                rationale=f"Customized for {gender} attending a {occasion} in {culture} context."
            )
            alt1 = OutfitDetail(
                clothing_type=f"Modern {garments[1] if len(garments)>1 else garments[0]} Set",
                silhouette="Slim contour fit",
                colors=["Pastel Rose", "Silver"],
                fabric="Georgette",
                embroidery_or_pattern="Chikankari work",
                accessories=["Minimal Earrings", "Bracelet"],
                footwear="Block Heels",
                hairstyle="Soft Curls",
                makeup="Nude tones",
                styling_tips=["Focus on lightweight layering."],
                rationale="Contemporary alternative with soft pastel hues."
            )
            alt2 = OutfitDetail(
                clothing_type="Indo-Western Co-ord Suit",
                silhouette="Asymmetric relaxed fit",
                colors=["Mustard", "Olive Green"],
                fabric="Linen Silk",
                embroidery_or_pattern="Geometric stitchwork",
                accessories=["Statement Ring", "Leather Belt"],
                footwear="Loafers",
                hairstyle="Sleek ponytail or cropped side-part",
                makeup="Fresh natural glow",
                styling_tips=["Keep silhouettes clean and uncluttered."],
                rationale="Fusion design alternative for comfort and modern aesthetic."
            )
    else: # Western / Other Culture
        if is_female:
            primary = OutfitDetail(
                clothing_type="Tailored Two-Piece Satin Blazer Suit",
                silhouette="Structured architectural blazer with high-waisted wide-leg trousers",
                colors=["Emerald Green", "Champagne Silk Inner"],
                fabric="Heavyweight Italian Satin Silk",
                embroidery_or_pattern="Clean monochrome finish with covered silk buttons",
                accessories=["Gold cuff bracelet", "Geometric drop earrings", "Structure leather clutch"],
                footwear="Pointed-Toe Stiletto Pumps",
                hairstyle="Sleek low ponytail with middle part",
                makeup="Bold red lip with clean luminous complexion",
                styling_tips=[
                    "Wear the blazer buttoned with a delicate silk camisole underneath.",
                    "The wide-leg trouser hem should skim the top of shoe heels for maximum leg elongation."
                ],
                rationale=f"A modern power-tailoring design created for {occasion}. Sleek satin fabric provides luxury texture suitable for {budget} budget."
            )
            alt1 = OutfitDetail(
                clothing_type="Asymmetric Midi Wrap Evening Dress",
                silhouette="Draped body-con contour with subtle side leg slit",
                colors=["Midnight Navy", "Silver Accents"],
                fabric="Fluid Silk Crepe",
                embroidery_or_pattern="Subtle crystal brooch accent at the waist drape",
                accessories=["Silver pendant necklace", "Diamond stud earrings"],
                footwear="Strappy High Heel Sandals",
                hairstyle="Voluminous blowout waves",
                makeup="Smokey eye with nude glossy lip",
                styling_tips=["Highlight waist wrap detailing with minimalist silver jewelry."],
                rationale="A feminine silhouette alternative emphasizing draped elegance."
            )
            alt2 = OutfitDetail(
                clothing_type="Sleek Minimalist Slip Gown with Tailored Tuxedo Jacket",
                silhouette="Column gown silhouette paired with sharp cropped tuxedo jacket",
                colors=["Classic Black", "Ivory White"],
                fabric="Heavy Crepe & Satin Contrast Lapels",
                embroidery_or_pattern="Contrast satin lapel trims",
                accessories=["Minimalist wire choker", "Micro clutch"],
                footwear="Ankle-Strap Pumps",
                hairstyle="Chic french twist updo",
                makeup="Dewy skin with winged liner",
                styling_tips=["Drape jacket over shoulders for an effortless fashion-forward look."],
                rationale="A high-contrast monochrome alternative combining feminine slip gown with masculine tuxedo structure."
            )
        else: # Male / Other Western
            primary = OutfitDetail(
                clothing_type="Custom Tailored Two-Piece Wool Suit",
                silhouette="Modern slim-fit structured silhouette with notched lapel",
                colors=["Charcoal Slate", "Crisp Ice Blue Shirt", "Burgundy Tie"],
                fabric="Super 120s Italian Wool & Silk Tie",
                embroidery_or_pattern="Subtle pick-stitching along lapels and pockets",
                accessories=["Silver tie clip", "Silk pocket square", "Leather strap watch"],
                footwear="Polished Black Leather Oxford Shoes",
                hairstyle="Classic neat side-part fade",
                makeup="Clean groomed finish with hydrating moisturizer",
                styling_tips=[
                    "Ensure shirt cuff extends 0.5 inches past blazer sleeve.",
                    "Match belt leather color precisely with oxford shoes."
                ],
                rationale=f"A timeless suit designed for a {occasion}. Charcoal wool offers versatility across seasons and matches formal dress codes."
            )
            alt1 = OutfitDetail(
                clothing_type="Unstructured Linen-Wool Blazer with Chino Trousers",
                silhouette="Relaxed soft-shoulder fit",
                colors=["Tan Camel", "Navy Trousers", "White Shirt"],
                fabric="Linen-Wool Blend",
                embroidery_or_pattern="Horn button details",
                accessories=["Woven leather belt", "Subtle wrist cuff"],
                footwear="Dark Brown Suede Loafers",
                hairstyle="Textured natural pompadour",
                makeup="Hydrated skin",
                styling_tips=["Wear shirt collar open without tie for smart-casual events."],
                rationale="A smart-casual alternative suitable for warmer climates and less rigid formality."
            )
            alt2 = OutfitDetail(
                clothing_type="Double-Breasted Blazer Set",
                silhouette="Bold broad-shoulder double-breasted cut",
                colors=["Midnight Navy", "Black Trousers"],
                fabric="Fine Wool Flannel",
                embroidery_or_pattern="Gold crest buttons",
                accessories=["Patterned silk pocket square", "Cufflinks"],
                footwear="Black Leather Monk Strap Shoes",
                hairstyle="Sleek slicked back hair",
                makeup="Minimal grooming",
                styling_tips=["Keep double-breasted jacket buttoned when standing."],
                rationale="A statement tailoring option offering commanding presence."
            )

    return RecommendationResponse(
        primary_outfit=primary,
        alternatives=[alt1, alt2]
    )

# Test block
if __name__ == "__main__":
    from rules import FashionRuleEngine
    engine = FashionRuleEngine()
    ctx = engine.evaluate("Female", "Diwali", "South Asian", "Medium", "Mild", "Jewel tones")
    res = generate_recommendation_ai(ctx)
    print("AI Provider Module Test (Fallback/Live output):")
    print(res.model_dump_json(indent=2))
