import os
import json
import base64
import time
import urllib.parse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import httpx

# Load Knowledge Base for Garment Mapping
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KB_PATH = os.path.join(BASE_DIR, "knowledge_base.json")
try:
    with open(KB_PATH, "r", encoding="utf-8") as f:
        KNOWLEDGE_BASE = json.load(f)
except Exception:
    KNOWLEDGE_BASE = {}

def resolve_garment_images_list(clothing_type: str, colors: List[str] = None, fabric: str = "", gender: str = "Male", card_index: int = 0) -> List[str]:
    color_str = " ".join(colors) if colors else ""
    lower = clothing_type.lower()
    
    if any(k in lower for k in ["panche", "veshti", "dhoti", "mundu", "lungi"]):
        base_prompt = f"South Indian male model wearing traditional white silk Veshti Panche dhoti with gold border and shirt in {color_str}"
    elif "modi" in lower or "nehru" in lower:
        base_prompt = f"Indian male model wearing traditional sleeveless Modi jacket Nehru vest over silk kurta in {color_str}"
    elif "saree" in lower:
        base_prompt = f"Indian female model wearing traditional draped silk saree in {color_str}"
    elif "lehenga" in lower:
        base_prompt = f"Indian female model wearing traditional flared lehenga choli in {color_str}"
    elif "sharara" in lower or "garara" in lower:
        base_prompt = f"Indian female model wearing traditional flared sharara suit set in {color_str}"
    elif "anarkali" in lower or "salwar" in lower:
        base_prompt = f"Indian female model wearing floor length flared anarkali suit in {color_str}"
    elif "sherwani" in lower or "bandhgala" in lower:
        base_prompt = f"Indian male model wearing traditional silk sherwani jacket in {color_str}"
    elif "tuxedo" in lower or "suit" in lower or "blazer" in lower:
        base_prompt = f"handsome male model wearing tailored formal tuxedo suit in {color_str}"
    else:
        gender_prefix = "male model" if "male" in gender.lower() and "female" not in gender.lower() else "female model"
        base_prompt = f"{gender_prefix} wearing {clothing_type} in {fabric} {color_str}"

    base_seed = (abs(hash(clothing_type + (gender or ""))) + (card_index * 1337)) % 10000

    # Image 1: FLUX Engine Model Concept
    prompt_1 = f"fashion studio photograph of {base_prompt}, full length portrait"
    encoded_1 = urllib.parse.quote(prompt_1)
    url_1 = f"https://image.pollinations.ai/prompt/{encoded_1}?width=800&height=1000&nologo=true&seed={base_seed}&model=flux"

    # Image 2: TURBO Engine Model Concept (Distinct rendering engine & artistic sketch style)
    prompt_2 = f"artistic haute couture fashion croquis illustration of {base_prompt}, dramatic runway lighting"
    encoded_2 = urllib.parse.quote(prompt_2)
    url_2 = f"https://image.pollinations.ai/prompt/{encoded_2}?width=800&height=1000&nologo=true&seed={base_seed + 777}&model=turbo"

    return [url_1, url_2]

def resolve_garment_image(clothing_type: str, colors: List[str] = None, fabric: str = "", gender: str = "Male") -> str:
    return resolve_garment_images_list(clothing_type, colors, fabric, gender)[0]

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
    image_url: Optional[str] = Field(default="", description="High-resolution AI fashion illustration reference URL")
    sketch_url: Optional[str] = Field(default="", description="Bespoke AI fashion sketch URL")
    image_urls: Optional[List[str]] = Field(default_factory=list, description="Array of 2 unique AI image URLs")

class RecommendationResponse(BaseModel):
    primary_outfit: OutfitDetail
    alternatives: List[OutfitDetail]

class SketchRequest(BaseModel):
    clothing_type: str
    silhouette: Optional[str] = ""
    colors: Optional[List[str]] = []
    fabric: Optional[str] = ""
    embroidery: Optional[str] = ""
    gender: Optional[str] = "Male"

class SketchResponse(BaseModel):
    sketch_url: str
    prompt_used: str

def generate_fashion_sketch(req: SketchRequest) -> SketchResponse:
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    color_str = ", ".join(req.colors) if req.colors else "harmonious luxury palette"
    lower = req.clothing_type.lower()

    if any(k in lower for k in ["panche", "veshti", "dhoti", "mundu", "lungi"]):
        prompt = f"Bespoke fashion sketch illustration of South Indian male model wearing white silk Veshti Panche dhoti with gold border and shirt in {color_str}, studio lighting."
    elif "modi" in lower or "nehru" in lower:
        prompt = f"Bespoke fashion sketch illustration of Indian male model wearing sleeveless Modi jacket Nehru vest over silk kurta in {color_str}, studio lighting."
    elif "polo" in lower or "chino" in lower:
        prompt = f"Bespoke fashion sketch illustration of handsome male model wearing stylish polo shirt and tailored chinos in {color_str}, studio portrait."
    else:
        gender_prefix = "male model" if "male" in (req.gender or "").lower() and "female" not in (req.gender or "").lower() else "female model"
        prompt = f"Bespoke fashion sketch illustration of {gender_prefix} wearing {req.clothing_type} in {color_str}, full length studio portrait."

    # Option A: OpenAI DALL-E 3
    if openai_key:
        try:
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "dall-e-3",
                "prompt": prompt,
                "n": 1,
                "size": "1024x1024"
            }
            with httpx.Client(timeout=30.0) as client:
                res = client.post("https://api.openai.com/v1/images/generations", headers=headers, json=payload)
                res.raise_for_status()
                data = res.json()
                sketch_url = data["data"][0]["url"]
                return SketchResponse(sketch_url=sketch_url, prompt_used=prompt)
        except Exception as e:
            print(f"[WARN] DALL-E 3 sketch generation failed ({e}). Fallback to Pollinations AI generation.")

    # Option B: High-resolution FLUX Generation with dynamic seed (Guarantees unique new image every click)
    encoded = urllib.parse.quote(prompt)
    dynamic_seed = int(time.time() * 1000) % 1000000
    sketch_url = f"https://image.pollinations.ai/prompt/{encoded}?width=800&height=1000&nologo=true&seed={dynamic_seed}&model=flux"
    return SketchResponse(sketch_url=sketch_url, prompt_used=prompt)


SYSTEM_PROMPT = """You are an expert AI Fashion Designer and Personal Stylist.
Your goal is to create bespoke fashion design recommendations tailored to a client's gender, occasion, cultural preference, budget level, season/climate, and preferred clothing type.

CRITICAL INSTRUCTIONS:
1. You must act as a creative fashion designer, NOT an e-commerce product recommender. Do NOT mention store links, brand names, or shopping prices. Focus on design aesthetics, garment cuts, fabric drape, color harmonies, and styling rationale.
2. Incorporate the provided Fashion Knowledge Context (rules, candidate garments, recommended fabrics, color guidance, and embroidery levels).
3. If the user explicitly requests a specific garment type (e.g. Tuxedo, Modi Jacket, Sherwani, Bandhgala, Saree, Lehenga, Blazer, Veshti, Panche, Dhoti), prioritize that garment type as the Primary Outfit!
4. Ensure garments match event formality: Business Meetings REQUIRE formal suits, tuxedos, blazers, bandhgalas, or tailored kurtas/Modi jackets (NEVER heavy lehengas or wedding sherwanis unless appropriate).
5. Produce EXACTLY ONE primary outfit and EXACTLY TWO meaningfully different alternative outfits.
6. Each outfit MUST include: clothing_type, silhouette, colors (array of strings), fabric, embroidery_or_pattern, accessories (array of strings), footwear, hairstyle, makeup, styling_tips (array of strings), and rationale.
7. Your response MUST be valid JSON adhering precisely to the specified schema.
"""

def build_user_prompt(context: Dict[str, Any]) -> str:
    return f"""Please design a complete outfit recommendation based on the following user requirements and fashion rules:

User Specifications:
- Gender: {context.get('gender')}
- Occasion: {context.get('occasion')} (Matched Category: {context.get('matched_occasion')})
- Cultural Context: {context.get('culture')} (Matched Culture: {context.get('matched_culture')})
- Budget Level: {context.get('budget')}
- Season / Climate: {context.get('season')}
- Preferred Clothing Type: {context.get('desired_garment') or 'None specified'}
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

def attach_ai_images(outfit: OutfitDetail, gender: str = "Male", card_index: int = 0):
    images = resolve_garment_images_list(outfit.clothing_type, outfit.colors, outfit.fabric, gender, card_index)
    outfit.image_urls = images
    outfit.image_url = images[0]
    outfit.sketch_url = images[0]

def generate_recommendation_ai(context: Dict[str, Any]) -> RecommendationResponse:
    provider = os.getenv("AI_PROVIDER", "openai").lower()
    gender = context.get("gender", "Male")
    
    if provider == "groq":
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
        base_url = "https://api.groq.com/openai/v1"
    else:
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
        base_url = "https://api.openai.com/v1"

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
            
            if len(validated.alternatives) > 2:
                validated.alternatives = validated.alternatives[:2]
            elif len(validated.alternatives) < 2:
                fallback_alt = generate_mock_fallback(context).alternatives[0]
                while len(validated.alternatives) < 2:
                    validated.alternatives.append(fallback_alt)

            # Attach high-resolution custom AI fashion sketch images matching exact specs and gender
            attach_ai_images(validated.primary_outfit, gender, 0)
            for idx, alt in enumerate(validated.alternatives):
                attach_ai_images(alt, gender, idx + 1)

            return validated
            
    except Exception as e:
        print(f"[ERROR] AI Provider request failed ({e}). Returning fallback rule-engine recommendation.")
        return generate_mock_fallback(context)


def generate_mock_fallback(context: Dict[str, Any]) -> RecommendationResponse:
    gender = context.get("gender", "Female")
    occasion = context.get("occasion", "Business Meeting")
    culture = context.get("culture", "South Asian")
    budget = context.get("budget", "Medium")
    season = context.get("season", "Mild")
    desired_garment = (context.get("desired_garment") or "").lower()
    
    occ_lower = occasion.lower()
    is_female = "female" in gender.lower() or "woman" in gender.lower()
    is_male = "male" in gender.lower() or "man" in gender.lower()

    # --- SPECIFIC DESIRED GARMENT OVERRIDES ---
    if "panche" in desired_garment or "veshti" in desired_garment or "dhoti" in desired_garment:
        primary = OutfitDetail(
            clothing_type="Panche / Veshti & Angavastram",
            silhouette="Traditional South Indian unstitched silk dhoti wrapped around waist with folded shoulder Angavastram stole",
            colors=["Ivory Silk", "Saffron Gold Zari Border", "Cream White"],
            fabric="Pure Mulberry Silk with Pure Gold Zari Weave",
            embroidery_or_pattern="Traditional Temple Zari border motif along the hem and Angavastram",
            accessories=["Gold chain", "Traditional wrist watch", "Silk Angavastram stole"],
            footwear="Handcrafted Leather Kolhapuri Sandals or Leather Chappals",
            hairstyle="Neatly groomed classic comb-over side part",
            makeup="Clean hydrated skin finish",
            styling_tips=["Pleat and tuck the Veshti / Panche waist securely at the center, letting the gold zari border shine at the hem."],
            rationale="Authentic South Indian traditional drape ensemble for auspicious festivals and weddings."
        )
        alt1 = OutfitDetail(
            clothing_type="Silk Modi Jacket over Kurta Set",
            silhouette="Structured Modi vest over a knee-length silk kurta",
            colors=["Deep Maroon Vest", "Ivory Kurta"],
            fabric="Raw Silk Vest",
            embroidery_or_pattern="Brocade jacquard weave",
            accessories=["Pocket square", "Silver brooch"],
            footwear="Tan Leather Mojris",
            hairstyle="Neat hair side part",
            makeup="Clean finish",
            styling_tips=["A modern Indo-Western celebration alternative."],
            rationale="Festive smart-formal alternative."
        )
        alt2 = OutfitDetail(
            clothing_type="Silk Sherwani with Churidar",
            silhouette="Structured fitted sherwani jacket",
            colors=["Navy Blue", "Gold Churidar"],
            fabric="Raw Silk",
            embroidery_or_pattern="Tonal neck embroidery",
            accessories=["Silk pocket square"],
            footwear="Royal Blue Juttis",
            hairstyle="Classic trim",
            makeup="Hydrated skin",
            styling_tips=["Formal wedding reception option."],
            rationale="Regal formal South Asian evening option."
        )
    elif "tuxedo" in desired_garment:
        primary = OutfitDetail(
            clothing_type="Classic Black Tie Satin Lapel Tuxedo",
            silhouette="Single-breasted structured jacket with satin peak lapel and slim trousers with satin side stripe",
            colors=["Midnight Black", "Crisp White Tuxedo Shirt", "Black Satin Bow Tie"],
            fabric="Super 130s Wool & Silk Satin Lapels",
            embroidery_or_pattern="Clean monochrome finish with satin facing on lapels and buttons",
            accessories=["Black silk cummerbund or waistcoat", "Mother-of-pearl cufflinks", "Silver dress watch"],
            footwear="Patent Leather Black Oxfords",
            hairstyle="Sleek slicked back side-part",
            makeup="Groomed eyebrows and clean hydrated finish",
            styling_tips=["Keep bow tie hand-tied for authentic black-tie elegance."],
            rationale=f"Requested specifically by client for a {occasion}. Offers timeless black-tie sophistication."
        )
        alt1 = OutfitDetail(
            clothing_type="Velvet Dinner Jacket Tuxedo Ensemble",
            silhouette="Structured shawl collar velvet blazer with black trousers",
            colors=["Deep Burgundy Velvet", "Midnight Black Trousers"],
            fabric="Plush Micro-Velvet & Wool",
            embroidery_or_pattern="Satin shawl collar",
            accessories=["Black silk pocket square", "Gold cufflinks"],
            footwear="Black Velvet Loafers",
            hairstyle="Neat executive trim",
            makeup="Clean skin finish",
            styling_tips=["Pair velvet dinner jacket with unadorned black trousers."],
            rationale="An opulent evening tuxedo alternative for formal galas."
        )
        alt2 = OutfitDetail(
            clothing_type="Tailored Double-Breasted Black Tuxedo",
            silhouette="Six-button peak lapel double-breasted tuxedo silhouette",
            colors=["Charcoal Black", "White Shirt"],
            fabric="Fine Italian Wool & Silk",
            embroidery_or_pattern="Satin covered buttons",
            accessories=["Black satin bow tie", "Silver studs"],
            footwear="Patent Oxfords",
            hairstyle="Classic side part",
            makeup="Hydrated lip balm",
            styling_tips=["Keep jacket buttoned when standing."],
            rationale="A sharp alternative for formal evening attire."
        )
    elif "modi" in desired_garment or "nehru" in desired_garment:
        primary = OutfitDetail(
            clothing_type="Silk Modi Jacket (Nehru Vest) with Kurta & Trousers",
            silhouette="Structured sleeveless Modi jacket with mandarin collar over straight kurta and slim trousers",
            colors=["Royal Navy Jacket", "Ivory Silk Kurta", "Brass Buttons"],
            fabric="Raw Silk Vest with Fine Cotton-Silk Kurta",
            embroidery_or_pattern="Subtle tonal texture with custom metallic brass buttons",
            accessories=["Silk pocket square in deep maroon", "Silver lapel pin", "Leather strap watch"],
            footwear="Handcrafted Leather Monk Straps or Mojris",
            hairstyle="Neatly groomed side-part fade",
            makeup="Groomed eyebrows and hydrated natural lip balm",
            styling_tips=["Ensure Modi jacket fits snugly across chest without pulling at buttons."],
            rationale=f"Requested specifically by client. The Modi Jacket (Nehru Vest) combines regal South Asian heritage with clean executive structure."
        )
        alt1 = OutfitDetail(
            clothing_type="Embroidered Jacquard Modi Jacket Set",
            silhouette="Tailored jacquard vest layered over a knee-length kurta",
            colors=["Mustard Gold Vest", "Cream Kurta"],
            fabric="Brocade Silk Vest & Silk Blend Kurta",
            embroidery_or_pattern="Intricate geometric jacquard weave",
            accessories=["Pocket square", "Brass brooch"],
            footwear="Tan Leather Mojris",
            hairstyle="Classic executive look",
            makeup="Clean skin finish",
            styling_tips=["Contrast the jacket hue against a neutral ivory or cream kurta."],
            rationale="A festive Modi jacket alternative suitable for celebrations."
        )
        alt2 = OutfitDetail(
            clothing_type="Linen Modi Jacket with Straight Trouser Set",
            silhouette="Breathable sleeveless jacket over short linen kurta and trousers",
            colors=["Olive Green Vest", "White Shirt", "Khaki Trousers"],
            fabric="100% Organic Linen",
            embroidery_or_pattern="Minimalist horn buttons",
            accessories=["Leather belt", "Watch"],
            footwear="Brown Leather Loafers",
            hairstyle="Textured crop",
            makeup="Hydrated finish",
            styling_tips=["Ideal for warm daytime formal or semi-formal events."],
            rationale="A lightweight linen Modi jacket alternative for summer weather."
        )

    # --- 1. BUSINESS MEETING / FORMAL CORPORATE ---
    elif "business" in occ_lower or "meeting" in occ_lower or "corporate" in occ_lower or "work" in occ_lower:
        if is_female:
            primary = OutfitDetail(
                clothing_type="Tailored Two-Piece Blazer Suit with Silk Camisole",
                silhouette="Structured single-breasted blazer with sharp shoulders and ankle-length cigarette trousers",
                colors=["Navy Blue", "Ivory Silk Inner", "Silver Accents"],
                fabric="Fine Italian Wool & Silk Blend",
                embroidery_or_pattern="Monochrome crisp finish with clean pick-stitching on lapels",
                accessories=["Minimalist leather tote bag", "Silver analog watch", "Pearl stud earrings"],
                footwear="Pointed-Toe Black Leather Pumps",
                hairstyle="Sleek low bun or polished blow-dry with side part",
                makeup="Clean professional nude lip with subtle eyeshadow and even complexion",
                styling_tips=[
                    "Keep blazer buttoned during formal presentations; unbutton when seated.",
                    "Ensure trouser hem rests precisely at the ankle bone for a modern executive profile."
                ],
                rationale=f"Designed specifically for a {occasion}. Provides an executive, professional presence suitable for a {budget} budget during {season} weather."
            )
            alt1 = OutfitDetail(
                clothing_type="Formal Silk Kurta Set with Tailored Straight Trousers",
                silhouette="Structured knee-length straight kurta with mandarin collar and slim trousers",
                colors=["Muted Olive Green", "Cream Trousers", "Gold Accents"],
                fabric="Raw Silk & Linen Blend",
                embroidery_or_pattern="Minimalist tonal threadwork along neck placket",
                accessories=["Structure leather handbag", "Subtle wrist cuff"],
                footwear="Leather Block-Heel Mules",
                hairstyle="Neat half-up hair arrangement",
                makeup="Fresh natural makeup with matte finish",
                styling_tips=["Pair with minimalist jewelry to maintain a professional boardroom aesthetic."],
                rationale="A refined South Asian formal alternative offering executive authority with cultural nuance."
            )
            alt2 = OutfitDetail(
                clothing_type="Structured Solid Silk Saree with High-Neck Blouse",
                silhouette="Crisp neatly pleated saree contour with high-neck elbow-sleeve blouse",
                colors=["Slate Gray", "Charcoal Accent"],
                fabric="Handloom Linen-Silk Saree",
                embroidery_or_pattern="Minimalist contrast selvedge border",
                accessories=["Executive briefcase leather bag", "Silver stud earrings"],
                footwear="Closed-Toe Mid-Heel Pumps",
                hairstyle="Low neat hair bun",
                makeup="Neutral professional tones",
                styling_tips=["Pin saree pleats securely at shoulder for a sleek, hands-free corporate drape."],
                rationale="A classic corporate saree option balancing traditional Indian drape with modern professional rigor."
            )
        else: # Male / Other Business
            if "south asian" in culture.lower() or "indo-western" in culture.lower():
                primary = OutfitDetail(
                    clothing_type="Tailored Bandhgala Suit with Slim Trousers",
                    silhouette="Structured military-inspired fitted shoulder silhouette with mandarin collar",
                    colors=["Charcoal Slate", "Midnight Navy", "Black Accents"],
                    fabric="Fine Italian Wool and Silk Blend",
                    embroidery_or_pattern="Minimalist tonal edge stitching with custom brass metal buttons",
                    accessories=["Silk pocket square in muted burgundy", "Classic leather strap watch"],
                    footwear="Polished Black Leather Oxfords",
                    hairstyle="Clean side-part fade with matte pomade",
                    makeup="Groomed eyebrows and natural hydrated lip balm",
                    styling_tips=[
                        "Keep Bandhgala jacket buttoned up to the neck for a sharp corporate posture.",
                        "Select a contrasting silk pocket square to add subtle personal flair without violating dress codes."
                    ],
                    rationale=f"A distinguished South Asian formal option ideal for a {occasion}. Unlike festive sherwanis, the Bandhgala suit is strictly tailored for corporate leadership and formal meetings."
                )
                alt1 = OutfitDetail(
                    clothing_type="Silk Modi Jacket (Nehru Vest) with Kurta & Trousers",
                    silhouette="Knee-length straight kurta layered with a sharp waist-length Modi vest",
                    colors=["Royal Navy", "Ivory Kurta", "Silver Pin"],
                    fabric="Raw Silk Vest with Fine Cotton Kurta",
                    embroidery_or_pattern="Clean solid weave with subtle lapel stitching",
                    accessories=["Leather briefcase", "Silver cuff watch"],
                    footwear="Dark Brown Leather Monk Strap Shoes",
                    hairstyle="Neat short trim",
                    makeup="Clean groomed finish",
                    styling_tips=["Ensure Nehru vest fits snugly around the chest for a streamlined appearance."],
                    rationale="A smart-formal Indo-Western corporate alternative offering warmth and elegance."
                )
                alt2 = OutfitDetail(
                    clothing_type="Custom Tailored Two-Piece Wool Suit",
                    silhouette="Modern slim-fit two-button jacket with notched lapel and flat-front trousers",
                    colors=["Dark Charcoal", "Crisp Light Blue Shirt", "Navy Silk Tie"],
                    fabric="Super 120s Italian Wool",
                    embroidery_or_pattern="Clean solid weave with pick-stitch detailing",
                    accessories=["Silver tie clip", "White linen pocket square"],
                    footwear="Black Calfskin Derby Shoes",
                    hairstyle="Classic executive side part",
                    makeup="Minimal grooming",
                    styling_tips=["Tie knot should fit snugly against the collar band."],
                    rationale="A universal Western executive suit tailored for executive business meetings."
                )
            else: # Western Male Business
                primary = OutfitDetail(
                    clothing_type="Custom Tailored Two-Piece Wool Suit",
                    silhouette="Modern slim-fit two-button jacket with notched lapel and flat-front trousers",
                    colors=["Charcoal Gray", "Crisp Ice Blue Shirt", "Burgundy Silk Tie"],
                    fabric="Super 120s Italian Wool & Silk Tie",
                    embroidery_or_pattern="Subtle pick-stitching along lapels",
                    accessories=["Silver tie bar", "Silk pocket square", "Leather strap watch"],
                    footwear="Polished Black Leather Oxford Shoes",
                    hairstyle="Classic neat side-part fade",
                    makeup="Clean groomed finish with hydrating moisturizer",
                    styling_tips=[
                        "Ensure shirt cuff extends 0.5 inches past blazer sleeve.",
                        "Match belt leather color precisely with oxford shoes."
                    ],
                    rationale=f"A timeless executive suit designed for a {occasion}. Charcoal wool offers professional authority suitable for a {budget} budget during {season} climate."
                )
                alt1 = OutfitDetail(
                    clothing_type="Classic Black Tie Satin Lapel Tuxedo",
                    silhouette="Structured single-breasted tuxedo with satin lapel",
                    colors=["Midnight Black", "White Shirt", "Black Bow Tie"],
                    fabric="Fine Italian Wool & Satin",
                    embroidery_or_pattern="Satin peak lapel",
                    accessories=["Black cummerbund", "Cufflinks"],
                    footwear="Patent Leather Oxfords",
                    hairstyle="Clean executive side part",
                    makeup="Clean grooming",
                    styling_tips=["Pair with black satin bow tie for formal executive dinners."],
                    rationale="An elevated black-tie tuxedo option for formal corporate galas."
                )
                alt2 = OutfitDetail(
                    clothing_type="Double-Breasted Corporate Suit",
                    silhouette="Broad-shoulder six-button double-breasted silhouette",
                    colors=["Midnight Navy", "Crisp White Shirt", "Dark Gray Tie"],
                    fabric="Fine Wool Flannel",
                    embroidery_or_pattern="Solid weave",
                    accessories=["Patterned silk pocket square", "Cufflinks"],
                    footwear="Black Leather Monk Strap Shoes",
                    hairstyle="Sleek slicked back hair",
                    makeup="Minimal grooming",
                    styling_tips=["Keep double-breasted jacket buttoned when standing."],
                    rationale="A commanding executive tailoring option for high-stakes business presentations."
                )

    # --- 2. WEDDING / DIWALI / FESTIVE / FORMAL EVENT ---
    elif "wedding" in occ_lower or "diwali" in occ_lower or "festive" in occ_lower or "gala" in occ_lower:
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
                    "Choose warm gold jewelry to complement the emerald and crimson color palette."
                ],
                rationale=f"Designed specifically for a {occasion} in a {season} climate. The rich Banarasi silk offers regal elegance suitable for a {budget} budget."
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
                styling_tips=["Pre-draped pleats provide effortless elegance throughout evening festivities."],
                rationale="An elegant drape alternative combining traditional Ruby Red tones with modern fluid silhouette cuts."
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
                styling_tips=["The lightweight chiffon cape allows breathable movement for long celebrations."],
                rationale="A lighter, contemporary Indo-Western alternative ideal for festive social gatherings."
            )
        else: # Male Festive
            primary = OutfitDetail(
                clothing_type="Silk Sherwani with Asymmetric Kurta and Churidar",
                silhouette="Tailored fitted shoulder silhouette with mandarin collar and churidar",
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
                rationale=f"A regal male festive ensemble tailored for a {occasion}. Raw silk provides structure and elegance suitable for a {budget} budget."
            )
            alt1 = OutfitDetail(
                clothing_type="Silk Modi Jacket (Nehru Vest) with Kurta Set",
                silhouette="Structured Modi jacket over a straight knee-length kurta",
                colors=["Maroon Vest", "Cream Kurta"],
                fabric="Raw Silk & Cotton Silk",
                embroidery_or_pattern="Brocade jacquard vest with brass buttons",
                accessories=["Silk pocket square", "Brooch"],
                footwear="Embroidered Juttis",
                hairstyle="Clean pompadour fade",
                makeup="Hydrated skin finish",
                styling_tips=["Keep vest buttoned over cream kurta for a refined festive look."],
                rationale="A popular Modi jacket alternative combining festive flair with light layering."
            )
            alt2 = OutfitDetail(
                clothing_type="Classic Black Tie Satin Lapel Tuxedo",
                silhouette="Structured black-tie tuxedo silhouette",
                colors=["Midnight Black", "White Shirt", "Black Bow Tie"],
                fabric="Fine Italian Wool & Satin",
                embroidery_or_pattern="Satin peak lapel",
                accessories=["Silk bow tie", "Cufflinks"],
                footwear="Patent Leather Oxfords",
                hairstyle="Classic executive side part",
                makeup="Clean grooming",
                styling_tips=["Wear for high-end black-tie wedding receptions."],
                rationale="A formal Western tuxedo alternative for black-tie wedding receptions."
            )

    # --- 3. CASUAL / COLLEGE / EVERYDAY ---
    else:
        if is_female:
            primary = OutfitDetail(
                clothing_type="Breathable Linen-Cotton Kurta with Cropped Straight Trousers",
                silhouette="Relaxed straight-cut knee-length kurta with cropped trousers",
                colors=["Peach Pastel", "White Trousers", "Terracotta Accent"],
                fabric="100% Organic Linen-Cotton Blend",
                embroidery_or_pattern="Subtle Chikankari threadwork along collar and sleeve hem",
                accessories=["Handcrafted wooden bangles", "Canvas tote bag", "Minimalist pendant"],
                footwear="Flat Leather Kolhapuri Sandals",
                hairstyle="Natural loose curls or casual high ponytail",
                makeup="Minimal dewy tint with lip balm",
                styling_tips=[
                    "Roll up sleeve cuffs slightly for an easygoing, casual campus vibe.",
                    "Pair with flat breathable sandals for comfortable all-day walking."
                ],
                rationale=f"Ideal for a casual {occasion}. Breathable linen fabric keeps you cool during {season} weather."
            )
            alt1 = OutfitDetail(
                clothing_type="Casual Shirt Dress with Fabric Belt",
                silhouette="A-line shirt dress silhouette cinched at waist",
                colors=["Sky Blue", "Tan Belt"],
                fabric="Lightweight Cotton Poplin",
                embroidery_or_pattern="Clean pinstripes",
                accessories=["Crossbody canvas bag", "Sunglasses"],
                footwear="Clean White Sneakers",
                hairstyle="Messy top knot",
                makeup="Fresh tint",
                styling_tips=["Tie the fabric belt loosely to define silhouette without constricting."],
                rationale="A modern casual alternative prioritizing mobility and contemporary style."
            )
            alt2 = OutfitDetail(
                clothing_type="Monochrome Co-ord Linen Set",
                silhouette="Relaxed button-down shirt paired with wide-leg cropped trousers",
                colors=["Sage Green", "Ivory Buttons"],
                fabric="Pure Linen",
                embroidery_or_pattern="Minimalist tonal stitching",
                accessories=["Straw tote bag", "Hoop earrings"],
                footwear="Leather Slides",
                hairstyle="Soft natural waves",
                makeup="Nude lip gloss",
                styling_tips=["Tuck front hem of shirt loosely into trousers for an effortless look."],
                rationale="A trendy, effortless co-ord set for everyday comfort."
            )
        else: # Male Casual / College
            primary = OutfitDetail(
                clothing_type="Linen-Cotton Button-Down Shirt with Tailored Chinos",
                silhouette="Relaxed slim-fit shirt with flat-front chino trousers",
                colors=["Olive Green", "Beige Chinos", "White Inner Tee"],
                fabric="Linen-Cotton Blend",
                embroidery_or_pattern="Clean solid texture",
                accessories=["Minimalist leather wristband", "Canvas backpack", "Sunglasses"],
                footwear="White Minimalist Leather Sneakers",
                hairstyle="Casual textured crop with matte clay",
                makeup="Hydrated skin finish",
                styling_tips=[
                    "Leave top two shirt buttons open for a relaxed, approachable look.",
                    "Pair with clean white sneakers for everyday campus or casual outings."
                ],
                rationale=f"A smart casual ensemble tailored for a {occasion}. Linen fabric provides breathability for {season} weather."
            )
            alt1 = OutfitDetail(
                clothing_type="Short Cotton Kurta with Slim Denim Jeans",
                silhouette="Hip-length straight kurta paired with dark wash denim",
                colors=["Navy Blue Kurta", "Dark Indigo Jeans"],
                fabric="100% Breathable Khadi Cotton",
                embroidery_or_pattern="Minimalist wooden button placket",
                accessories=["Leather strap watch", "Messenger bag"],
                footwear="Tan Suede Loafers",
                hairstyle="Natural side sweep",
                makeup="Clean grooming",
                styling_tips=["Roll sleeves up to forearms for an active smart-casual appearance."],
                rationale="A comfortable Indo-Western fusion alternative ideal for college or informal gatherings."
            )
            alt2 = OutfitDetail(
                clothing_type="Smart Polo Shirt with Stretch Trousers",
                silhouette="Fitted knit polo shirt with tapered trousers",
                colors=["Charcoal Gray", "Black Trousers"],
                fabric="Pique Cotton Knit",
                embroidery_or_pattern="Tonal collar tipping",
                accessories=["Canvas belt", "Minimalist watch"],
                footwear="Canvas Slip-On Shoes",
                hairstyle="Neat trim",
                makeup="Hydrated lip balm",
                styling_tips=["Keep polo un-tucked for a casual, sporty silhouette."],
                rationale="A versatile casual option offering low-maintenance comfort."
            )

    # Attach custom high-res AI sketch images to primary and all alternatives
    attach_ai_images(primary, gender, 0)
    attach_ai_images(alt1, gender, 1)
    attach_ai_images(alt2, gender, 2)

    return RecommendationResponse(
        primary_outfit=primary,
        alternatives=[alt1, alt2]
    )
