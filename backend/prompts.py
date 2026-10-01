import os
import json
import base64
import time
import urllib.parse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import httpx

try:
    from backend.tryon_utils import mask_model_head, looks_like_failed_try_on
except ImportError:
    from tryon_utils import mask_model_head, looks_like_failed_try_on

try:
    from backend.designer import design_outfits
except ImportError:
    from designer import design_outfits

try:
    from backend.palette import apply_user_palette, image_colour_instruction, is_mono, palette_from_preferences
except ImportError:
    from palette import apply_user_palette, image_colour_instruction, is_mono, palette_from_preferences

# Load Knowledge Base for Garment Mapping
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KB_PATH = os.path.join(BASE_DIR, "knowledge_base.json")
try:
    with open(KB_PATH, "r", encoding="utf-8") as f:
        KNOWLEDGE_BASE = json.load(f)
except Exception:
    KNOWLEDGE_BASE = {}

def call_replicate_flux(prompt: str) -> Optional[str]:
    """Call Replicate Flux Schnell. Handles 202 polling, 429 rate-limit retries. Returns image URL or None."""
    token = os.getenv("REPLICATE_API_TOKEN", "").strip()
    if not token:
        print("[ERROR] REPLICATE_API_TOKEN not set in .env!")
        return None

    url = "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "wait=30"
    }
    payload = {
        "input": {
            "prompt": prompt,
            "aspect_ratio": "2:3",
            "output_format": "webp",
            "num_outputs": 1
        }
    }

    # Retry up to 5 times on 429 throttle
    max_retries = 5
    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=90.0) as client:
                res = client.post(url, headers=headers, json=payload)
                print(f"[INFO] Replicate POST status: {res.status_code}")

                # 429 rate-limited — wait and retry
                if res.status_code == 429:
                    try:
                        err_data = res.json()
                        retry_after = int(err_data.get("retry_after", 10))
                    except Exception:
                        retry_after = 10
                    wait = retry_after + 1  # Add 1s buffer
                    print(f"[WARN] Replicate 429 throttle — waiting {wait}s before retry (attempt {attempt+1}/{max_retries})...")
                    time.sleep(wait)
                    continue  # Retry

                # 200, 201, 202 are all valid — 202 means accepted and needs polling
                if res.status_code not in [200, 201, 202]:
                    print(f"[ERROR] Replicate API error: {res.text[:300]}")
                    return None

                data = res.json()
                poll_url = data.get("urls", {}).get("get")

                # Poll until succeeded or failed (up to 90 seconds)
                poll_attempts = 0
                while data.get("status") in ["starting", "processing"] and poll_url and poll_attempts < 90:
                    time.sleep(1)
                    poll_res = client.get(poll_url, headers={"Authorization": f"Bearer {token}"})
                    data = poll_res.json()
                    poll_attempts += 1
                    if poll_attempts % 5 == 0:
                        print(f"[INFO] Replicate poll attempt {poll_attempts}: {data.get('status')}")

                print(f"[INFO] Replicate final status: {data.get('status')}")
                output = data.get("output", [])
                if isinstance(output, list) and output:
                    print(f"[INFO] Replicate image generated: {output[0][:80]}")
                    return output[0]
                elif isinstance(output, str) and output:
                    return output
                else:
                    print(f"[WARN] Replicate returned no output. Status: {data.get('status')}")
                    return None

        except Exception as e:
            print(f"[ERROR] Replicate Flux API call failed (attempt {attempt+1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(3)

    print(f"[ERROR] Replicate failed after {max_retries} attempts.")
    return None

# ---------------------------------------------------------------------------
# Nano Banana (Google Gemini 2.5 Flash Image) — keeps the same model faces as
# the first-page photos by passing backend/reference_faces/* as references.
# ---------------------------------------------------------------------------
REFERENCE_FACES_DIR = os.path.join(BASE_DIR, "reference_faces")

FULL_BODY_FRAMING = (
    "Photorealistic full-length fashion catalogue photograph. The person stands upright facing the camera, arms "
    "relaxed. The ENTIRE body is in frame from the top of the head down to the soles of the shoes, with clear empty "
    "space above the head and below the feet; the footwear must be fully visible and not cropped. Plain seamless dark "
    "charcoal-grey studio backdrop and floor, soft even studio lighting, sharp focus. Single person, no text, no watermark."
)


def _reference_for(gender: str) -> List[str]:
    g = (gender or "").lower()
    name = "female" if "female" in g or "woman" in g else "male" if "male" in g or "man" in g else "other"
    path = os.path.join(REFERENCE_FACES_DIR, f"{name}.jpg")
    if not os.path.exists(path):
        return []
    with open(path, "rb") as f:
        return ["data:image/jpeg;base64," + base64.b64encode(f.read()).decode()]


def call_nano_banana(prompt: str, image_input: List[str]) -> Optional[str]:
    """Run google/nano-banana on Replicate. Returns an image URL or None."""
    token = os.getenv("REPLICATE_API_TOKEN", "").strip()
    if not token:
        return None
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json", "Prefer": "wait=60"}
    payload = {"input": {"prompt": prompt, "image_input": image_input, "aspect_ratio": "2:3", "output_format": "jpg"}}
    try:
        with httpx.Client(timeout=120.0) as client:
            for attempt in range(4):
                res = client.post("https://api.replicate.com/v1/models/google/nano-banana/predictions", headers=headers, json=payload)
                if res.status_code == 429:
                    wait = int(res.json().get("retry_after", 10)) + 1
                    print(f"[WARN] Nano Banana 429 — waiting {wait}s")
                    time.sleep(wait)
                    continue
                if res.status_code not in (200, 201, 202):
                    print(f"[ERROR] Nano Banana API error {res.status_code}: {res.text[:200]}")
                    return None
                data = res.json()
                polls = 0
                while data.get("status") in ("starting", "processing") and polls < 90:
                    time.sleep(1.5)
                    data = client.get(data["urls"]["get"], headers=headers).json()
                    polls += 1
                output = data.get("output")
                url = output[0] if isinstance(output, list) and output else output
                if data.get("status") == "succeeded" and isinstance(url, str) and url:
                    print(f"[INFO] Nano Banana image generated: {url[:80]}")
                    return url
                print(f"[WARN] Nano Banana finished with status {data.get('status')}: {data.get('error')}")
                return None
    except Exception as e:
        print(f"[ERROR] Nano Banana call failed: {e}")
    return None


GENERATED_DIR = os.path.join(BASE_DIR, "generated_images")


def _trim_white_bars(im):
    """Remove the white letterbox bars image models occasionally add around the photo."""
    g = im.convert("L")
    w, h = g.size
    px = g.load()

    def white_col(x):
        vals = [px[x, y] for y in range(0, h, 4)]
        return sum(v > 235 for v in vals) / len(vals) > 0.97

    def white_row(y):
        vals = [px[x, y] for x in range(0, w, 4)]
        return sum(v > 235 for v in vals) / len(vals) > 0.97

    left, right, top, bottom = 0, w, 0, h
    while left < w // 4 and white_col(left):
        left += 1
    while right > w * 3 // 4 and white_col(right - 1):
        right -= 1
    while top < h // 4 and white_row(top):
        top += 1
    while bottom > h * 3 // 4 and white_row(bottom - 1):
        bottom -= 1
    if (left, top, right, bottom) != (0, 0, w, h):
        print(f"[INFO] Trimmed white bars from generated image: {(left, top, w - right, h - bottom)}")
        return im.crop((left + 2 if left else 0, top + 2 if top else 0, right - 2 if right < w else w, bottom - 2 if bottom < h else h))
    return im


def store_image(url: Optional[str]) -> str:
    """Download a generated image, trim white bars and serve it from this backend.
    Replicate delivery links expire after ~1 hour, which would break saved wardrobe items."""
    if not url:
        return ""
    try:
        from PIL import Image
        import io
        import uuid
        raw = httpx.get(url, timeout=60.0).content
        im = _trim_white_bars(Image.open(io.BytesIO(raw)).convert("RGB"))
        os.makedirs(GENERATED_DIR, exist_ok=True)
        name = f"{uuid.uuid4().hex}.webp"
        im.save(os.path.join(GENERATED_DIR, name), "WEBP", quality=88)
        base = os.getenv("PUBLIC_BASE_URL", f"http://localhost:{os.getenv('PORT', '8000')}").rstrip("/")
        return f"{base}/generated-images/{name}"
    except Exception as e:
        print(f"[WARN] Could not store image locally ({e}); using the provider URL")
        return url


def generate_look_image(outfit_prompt: str, gender: str) -> str:
    """Full-body model photo for an outfit. IMAGE_ENGINE=nano-banana (default) or flux."""
    engine = os.getenv("IMAGE_ENGINE", "nano-banana").strip().lower()
    refs = _reference_for(gender)
    if engine != "flux":
        who = ("The model is the same person as in the reference photo — keep the face, skin tone and hair identical. "
               if refs else "")
        url = call_nano_banana(f"{FULL_BODY_FRAMING} {who}Outfit: {outfit_prompt}.", refs)
        if url:
            return store_image(url)
        print("[WARN] Falling back to Flux for this image")
    is_male = "male" in (gender or "").lower() and "female" not in (gender or "").lower()
    person = "handsome male model" if is_male else "elegant female model"
    flux_prompt = (f"Full body shot, head to toe, of a {person} standing on a studio floor, shoes and feet fully visible, "
                   f"wide framing with space below the feet, wearing {outfit_prompt}, dark charcoal studio backdrop, "
                   f"soft box lighting, photorealistic, 8k")
    return store_image(call_replicate_flux(flux_prompt))


# Strong color keywords that override the LLM-generated palette and enforce strict color in the image prompt
_STRICT_COLOR_KEYWORDS = {
    "all-white":   ["pure white", "ivory white"],
    "all white":   ["pure white", "ivory white"],
    "all-black":   ["jet black", "deep black"],
    "all black":   ["jet black", "deep black"],
    "monochrome":  ["monochrome", "single-tone"],
    "ivory & cream": ["ivory", "cream white"],
    "ivory and cream": ["ivory", "cream white"],
    "dusty rose":  ["dusty rose", "blush pink"],
    "sapphire blue": ["sapphire blue", "deep blue"],
    "burgundy & wine": ["burgundy", "wine red"],
    "burgundy and wine": ["burgundy", "wine red"],
    "forest green": ["forest green", "deep green"],
    "terracotta":  ["terracotta", "burnt orange-brown"],
    "gold & bronze": ["gold", "bronze"],
    "gold and bronze": ["gold", "bronze"],
}

def _extract_strict_colors(user_preferences: str) -> List[str]:
    """Parse user preference string and return enforced color list if strong color keywords exist."""
    if not user_preferences:
        return []
    lower = user_preferences.lower()
    found = []
    for keyword, colors in _STRICT_COLOR_KEYWORDS.items():
        if keyword in lower:
            found.extend(colors)
    return found

def resolve_garment_image(clothing_type: str, colors: List[str] = None, fabric: str = "", gender: str = "Male", card_index: int = 0, user_preferences: str = "") -> str:
    # Exclusive Replicate Flux AI 8k Studio Photography Generator — NO external fallbacks
    is_male = "male" in (gender or "").lower() and "female" not in (gender or "").lower()
    gender_str = "handsome male model" if is_male else "elegant female model"

    # outfit.colors already follows the user's palette (see palette.apply_user_palette),
    # so the photo uses exactly the colours printed on the card.
    color_instruction = image_colour_instruction(colors or [], is_mono(user_preferences))
    outfit_prompt = f"{clothing_type}, {fabric or 'luxury blend'} fabric, with matching footwear. {color_instruction}"
    return generate_look_image(outfit_prompt, gender)

def resolve_garment_images_list(clothing_type: str, colors: List[str] = None, fabric: str = "", gender: str = "Male", card_index: int = 0, user_preferences: str = "") -> List[str]:
    img = resolve_garment_image(clothing_type, colors, fabric, gender, card_index, user_preferences)
    return [img]

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
    image_urls: Optional[List[str]] = Field(default_factory=list, description="Array of fashion image URLs")

class RecommendationResponse(BaseModel):
    primary_outfit: OutfitDetail
    alternatives: List[OutfitDetail]
    image_job_id: Optional[str] = None   # Poll /image-status/{image_job_id} for alternative images
    engine: Optional[str] = None         # e.g. "openai:gpt-4o-mini" or "rules" — which engine wrote the text
    engine_note: Optional[str] = None    # Why the rule-based fallback was used, if it was


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
    color_str = ", ".join(req.colors) if req.colors else "harmonious luxury palette"
    is_male = "male" in (req.gender or "").lower() and "female" not in (req.gender or "").lower()
    gender_prefix = "handsome male model" if is_male else "elegant female model"

    prompt_text = f"{req.clothing_type} in {color_str}, {req.fabric or 'luxury blend'} fabric, {req.silhouette} silhouette, with matching footwear"
    img = generate_look_image(prompt_text, req.gender or "")
    return SketchResponse(sketch_url=img or "", prompt_used=prompt_text)


class PreviewLookRequest(BaseModel):
    image: str                      # data URI of the base model photo shown in the live preview
    garment: Optional[str] = ""
    colors: Optional[List[str]] = []
    fabric: Optional[str] = ""
    moods: Optional[List[str]] = []
    season: Optional[str] = ""


class PreviewLookResponse(BaseModel):
    image_url: str


def generate_preview_look(req: PreviewLookRequest) -> PreviewLookResponse:
    """Restyle the live-preview model photo in the user's chosen colours / fabric / mood with Nano Banana."""
    changes = []
    colours = palette_from_preferences(", ".join(req.colors or []))[:3]
    if colours:
        changes.append(image_colour_instruction(colours, is_mono(", ".join(req.colors or []))).rstrip("."))
    if req.fabric:
        changes.append(f"make the fabric look like {req.fabric.lower()}")
    if req.moods:
        changes.append(f"style it with a {', '.join(m.lower() for m in req.moods)} mood through small accessory details")
    season = (req.season or "").lower()
    if season == "winter":
        changes.append("add a matching warm shawl or stole for winter")
    elif season == "monsoon":
        changes.append("make it monsoon-ready with lighter layers and water-friendly footwear")
    elif season == "summer":
        changes.append("keep it light and breathable for summer")
    if not changes:
        changes.append("keep the outfit as it is but refine the lighting")
    prompt = (
        "Edit this photo. Keep exactly the same person, face, pose, camera framing, background and the same garment type"
        f"{f' ({req.garment})' if req.garment else ''}. Changes: " + "; ".join(changes) + ". "
        "The full body must remain visible from head to toe with the shoes fully in frame. Photorealistic."
    )
    url = store_image(call_nano_banana(prompt, [req.image]))
    return PreviewLookResponse(image_url=url or "")


# ---------------------------------------------------------------------------
# Virtual try-on: put the user (from a camera / uploaded photo) into the
# generated outfit. Nothing is written to disk except the final result image.
# ---------------------------------------------------------------------------
class TryOnRequest(BaseModel):
    person_image: str               # data URI of the user's photo (camera capture or upload)
    outfit_image: str               # data URI of the generated outfit photo shown on the card
    clothing_type: Optional[str] = ""
    colors: Optional[List[str]] = []
    fabric: Optional[str] = ""
    footwear: Optional[str] = ""


class TryOnResponse(BaseModel):
    image_url: str


def generate_virtual_try_on(req: TryOnRequest) -> TryOnResponse:
    """Nano Banana: image 1 = the user, image 2 = the outfit. Returns the user wearing that outfit, head to toe."""
    details = []
    if req.clothing_type:
        details.append(f"garment: {req.clothing_type}")
    if req.colors:
        details.append(f"colours: {', '.join(req.colors)}")
    if req.fabric:
        details.append(f"fabric: {req.fabric}")
    if req.footwear:
        details.append(f"footwear: {req.footwear}")
    prompt = (
        "Virtual try-on. Image 1 is a photo of a real person — this is the ONLY person who may appear in the result. "
        "Image 2 is a clothing reference only: the mannequin's head has been hidden, use it just for the clothes. "
        "Image 2 may still show strands of the mannequin's hair on the shoulders or back — ignore them completely; "
        "the hair in the result must have exactly the length and style shown in image 1 (short hair stays short). "
        "Create one photorealistic full-length photo of the person from image 1 wearing exactly the outfit from "
        "image 2 — the same garment, cut, colours, fabric, embroidery, accessories and footwear"
        + (f" ({'; '.join(details)})" if details else "") + ". "
        "The face, head, hair (length, colour and style), skin tone and body proportions must all come from image 1 "
        "and stay recognisably the same person. Never invent a different face or hairstyle. "
        "The person stands upright facing the camera with the ENTIRE body visible from the top of the head to the "
        "soles of the shoes, footwear fully in frame. Plain seamless dark charcoal-grey studio backdrop, soft even "
        "studio lighting, sharp focus. Single person, no text, no watermark."
    )
    try:
        outfit_ref = mask_model_head(req.outfit_image)
    except Exception as e:  # never block the try-on on the masking step
        print(f"[WARN] Could not mask outfit model head ({e}); sending the photo as-is")
        outfit_ref = req.outfit_image
    # The image model occasionally echoes the outfit photo back instead of dressing the user:
    # check every result and regenerate (max 3 attempts) before showing anything.
    from PIL import Image
    import io
    last_url = None
    for attempt in range(1, 4):
        url = call_nano_banana(prompt, [req.person_image, outfit_ref])
        if not url:
            continue
        last_url = url
        try:
            result = Image.open(io.BytesIO(httpx.get(url, timeout=60.0).content)).convert("RGB")
            problem = looks_like_failed_try_on(result, outfit_ref)
        except Exception as e:
            print(f"[WARN] Could not check try-on result ({e}); accepting it")
            problem = ""
        if not problem:
            return TryOnResponse(image_url=store_image(url))
        print(f"[WARN] Try-on attempt {attempt} rejected: {problem}; regenerating")
    # Every attempt looked wrong: better to report failure than show someone else's face
    if last_url:
        print("[WARN] All try-on attempts were rejected")
    return TryOnResponse(image_url="")


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
8. STRICT COLOR RULE: If the user's preferred colors contain terms like "All-white", "All-black", "Monochrome", or specific named colors (e.g. "Sapphire blue", "Burgundy", "Ivory"), you MUST use ONLY those exact colors in the outfit's 'colors' array. Do NOT introduce other colors not mentioned by the user. "All-white" means the entire outfit must be white/ivory tones ONLY. "All-black" means black tones ONLY.
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

def attach_ai_images(outfit: OutfitDetail, gender: str = "Male", card_index: int = 0, user_preferences: str = ""):
    images = resolve_garment_images_list(outfit.clothing_type, outfit.colors, outfit.fabric, gender, card_index, user_preferences)
    outfit.image_urls = images
    outfit.image_url = images[0]
    outfit.sketch_url = images[0]

def get_llm_config() -> Dict[str, str]:
    """Resolve provider, key and model from .env (AI_PROVIDER = openai | groq)."""
    provider = os.getenv("AI_PROVIDER", "openai").strip().lower() or "openai"
    if provider == "groq":
        return {
            "provider": "groq",
            "api_key": os.getenv("GROQ_API_KEY", "").strip(),
            "model": os.getenv("GROQ_MODEL", "").strip() or "llama-3.3-70b-versatile",
            "base_url": "https://api.groq.com/openai/v1",
        }
    return {
        "provider": "openai",
        "api_key": os.getenv("OPENAI_API_KEY", "").strip(),
        "model": os.getenv("OPENAI_MODEL", "").strip() or "gpt-4o-mini",
        "base_url": "",
    }


def call_llm_recommendation(context: Dict[str, Any]) -> RecommendationResponse:
    """Ask OpenAI / Groq for the outfit design. Raises on any failure so the caller can fall back."""
    cfg = get_llm_config()
    if not cfg["api_key"]:
        key_name = "GROQ_API_KEY" if cfg["provider"] == "groq" else "OPENAI_API_KEY"
        raise RuntimeError(f"{key_name} is empty in backend/.env")

    from openai import OpenAI
    client = OpenAI(api_key=cfg["api_key"], base_url=cfg["base_url"] or None, timeout=60.0, max_retries=1)
    completion = client.chat.completions.create(
        model=cfg["model"],
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(context)},
        ],
        response_format={"type": "json_object"},
        temperature=0.8,
    )
    raw = completion.choices[0].message.content or ""
    data = json.loads(raw)

    def _normalise(item: Dict[str, Any]) -> OutfitDetail:
        for list_key in ("colors", "accessories", "styling_tips"):
            val = item.get(list_key)
            if isinstance(val, str):
                item[list_key] = [v.strip() for v in val.split(",") if v.strip()]
        item.pop("image_url", None)
        item.pop("sketch_url", None)
        item.pop("image_urls", None)
        return OutfitDetail(**item)

    primary = _normalise(data["primary_outfit"])
    alternatives = [_normalise(a) for a in data.get("alternatives", [])][:2]
    if len(alternatives) < 2:
        raise ValueError(f"LLM returned {len(alternatives)} alternatives, expected 2")
    return RecommendationResponse(
        primary_outfit=primary,
        alternatives=alternatives,
        engine=f"{cfg['provider']}:{cfg['model']}",
    )


def generate_rule_based(context: Dict[str, Any]) -> RecommendationResponse:
    """Catalogue-based designer: honours the chosen garment, occasion, season and colours."""
    outfits = [OutfitDetail(**o) for o in design_outfits(context)]
    return RecommendationResponse(primary_outfit=outfits[0], alternatives=outfits[1:], engine="rules")


def generate_recommendation_ai(context: Dict[str, Any]) -> RecommendationResponse:
    gender = context.get("gender", "Male")
    user_preferences = context.get("user_preferences", "") or context.get("preferences", "") or ""

    # 1. Try the real LLM; 2. fall back to the deterministic rule-based designer
    try:
        recommendation = call_llm_recommendation(context)
        print(f"[INFO] Recommendation generated by {recommendation.engine}")
    except Exception as e:
        name = type(e).__name__
        safe = {
            "AuthenticationError": "API key was rejected by the provider (401). Check the key in backend/.env.",
            "PermissionDeniedError": "API key has no access to this model (403).",
            "RateLimitError": "Provider rate limit or quota exceeded (429). Check your billing / credits.",
            "NotFoundError": "Model not found. Check OPENAI_MODEL / GROQ_MODEL in backend/.env.",
            "APIConnectionError": "Could not reach the AI provider (network error).",
            "APITimeoutError": "AI provider timed out.",
        }
        reason = safe.get(name, f"{name}: {e}")
        print(f"[WARN] LLM unavailable ({reason}) — using rule-based fallback")
        recommendation = generate_rule_based(context)
        recommendation.engine_note = reason[:300]

    # The user's colour choice wins over whatever the LLM picked (the rule-based designer already uses it)
    if recommendation.engine != "rules":
        apply_user_palette(recommendation, user_preferences, rewrite_text=False)

    # Generate ONLY the primary outfit image here (fast ~10s)
    # Alternative images are handled by a background thread in main.py
    print(f"[INFO] Generating primary outfit image (user color prefs: '{user_preferences}')...")
    attach_ai_images(recommendation.primary_outfit, gender, 0, user_preferences)
    print("[INFO] Primary image done — returning response (alternatives generated in background)")

    # Store preferences on recommendation for background thread to use
    recommendation._user_preferences = user_preferences  # type: ignore[attr-defined]
    return recommendation


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

    # Images are attached by generate_recommendation_ai (primary) and the
    # background job in main.py (alternatives) — don't generate them here too.
    return RecommendationResponse(
        primary_outfit=primary,
        alternatives=[alt1, alt2]
    )
