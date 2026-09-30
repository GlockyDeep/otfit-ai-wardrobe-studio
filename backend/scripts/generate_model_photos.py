"""
Generate the real-human model photos used on the first page (gender cards,
garment picker, hero and live preview) with Google Nano Banana on Replicate.

- Female / male photos use backend/reference_faces/{female,male}.jpg so every
  outfit shows the same person.
- "Other" first generates one neutral model, then reuses it as the reference.
- Output: frontend/public/models/{gender}-{slug}.webp  (existing files are skipped,
  delete one to regenerate it).

Usage:  python backend/scripts/generate_model_photos.py [--only male-tuxedo ...]
Cost:   ~US$0.04 per image (25 images ≈ US$1).
"""
import base64
import io
import os
import re
import sys
import time

import httpx
from dotenv import load_dotenv
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND = os.path.join(ROOT, "backend")
OUT_DIR = os.path.join(ROOT, "frontend", "public", "models")
FACES = os.path.join(BACKEND, "reference_faces")
load_dotenv(os.path.join(BACKEND, ".env"))

MODEL_URL = "https://api.replicate.com/v1/models/google/nano-banana/predictions"

# Keep in sync with frontend/src/data/modelPhotos.ts
GARMENTS = {
    "male": {
        "3-Piece Vest Suit": "a tailored charcoal-grey three-piece suit with a matching buttoned waistcoat, crisp white shirt and burgundy silk tie, polished black oxford shoes",
        "2-Piece Suit": "a slim-fit navy blue two-piece suit, white shirt and navy tie, brown leather derby shoes",
        "Tuxedo": "a classic black tuxedo with satin peak lapels, white dress shirt, black bow tie, black patent leather shoes",
        "Panche / Veshti & Angavastram": "a traditional South Indian ivory silk veshti (dhoti) with a gold zari border reaching the ankles, a white silk shirt and a matching gold-bordered angavastram draped over one shoulder, brown leather sandals",
        "Sherwani": "an ivory and gold embroidered knee-length wedding sherwani with ivory churidar, a maroon silk dupatta over one shoulder, gold embroidered mojari shoes",
        "Bandhgala Suit": "a navy blue bandhgala (Jodhpuri) suit with mandarin collar and gold buttons with matching trousers, black leather shoes",
        "Modi Jacket / Nehru Vest": "a maroon silk Nehru (Modi) jacket over a cream straight kurta with white churidar pants, tan leather mojari shoes",
        "Shirt & Chinos / Denim": "a light-blue oxford button-down shirt tucked into khaki chinos with a brown belt, brown suede loafers",
        "Polo & Chinos": "a forest-green polo shirt with beige chinos, white leather sneakers",
        "Co-ord Set": "a terracotta linen co-ord set: short-sleeve camp-collar shirt with matching relaxed trousers, white sneakers",
        "Kurta Set": "an ivory cotton-silk straight kurta with subtle gold embroidery and white churidar pants, gold mojari shoes",
    },
    "female": {
        "Banarasi Silk Saree": "a deep red Banarasi silk saree with a wide gold zari border, the pallu draped over the left shoulder, matching gold silk blouse, gold jhumka earrings; the saree hem ends at the ankles so gold sandals are clearly visible",
        "Lehenga Choli": "an emerald-green lehenga skirt with gold embroidery, a crimson blouse and a sheer gold dupatta; ankle-length hem with embellished gold juttis clearly visible",
        "Anarkali Suit": "a royal purple Anarkali suit with a gold border, flaring to the ankles, with churidar and a sheer dupatta; gold juttis clearly visible",
        "Sharara Set": "a blush-pink short kurti with flared sharara pants with gold gota border and an ivory dupatta; gold juttis clearly visible",
        "Kurta Set": "a teal straight kurta with gold embroidery, ivory palazzo pants and a light dupatta, tan kolhapuri sandals",
        "Tailored Pant Suit / Skirt Suit": "a tailored charcoal pant suit with a single-breasted blazer and ivory silk blouse, black pointed-toe heels",
        "Casual Dress / Shirt Dress": "a cobalt-blue knee-length belted shirt dress, nude block-heel sandals",
        "Co-ord Set": "a terracotta linen co-ord set: cropped camp-collar shirt with wide-leg trousers, white sneakers",
    },
    "other": {
        "Co-ord Set": "a relaxed sage-green linen co-ord set: boxy shirt with matching wide trousers, white sneakers",
        "Bandhgala Suit": "a relaxed-fit navy bandhgala jacket with mandarin collar and matching straight trousers, black leather loafers",
        "Modi Jacket / Nehru Vest": "a maroon Nehru vest over a long ivory kurta with straight trousers, tan leather loafers",
        "2-Piece Suit": "an oversized sand-beige two-piece suit over a plain black t-shirt, white sneakers",
        "Shirt & Chinos / Denim": "an oversized white linen shirt with olive chinos, white sneakers",
        "Kurta Set": "a mustard-yellow straight kurta with white straight trousers, brown leather sandals",
    },
}

WHO = {
    "female": "The model is the same young woman as in the reference photo — keep her face, skin tone and long dark wavy hair identical.",
    "male": "The model is the same man as in the reference photo — keep his face, skin tone, hairstyle and short beard identical.",
    "other": "The model is the same androgynous, gender-neutral young adult as in the reference photo — keep the face and short tousled haircut identical.",
}
OTHER_BASE_WHO = "The model is an androgynous, gender-neutral young adult with a warm medium skin tone, a short tousled haircut and no makeup."

FRAMING = (
    "Photorealistic full-length fashion catalogue photograph. The person stands upright facing the camera in a relaxed "
    "natural pose with arms at the sides. The ENTIRE body is in frame from the top of the head down to the soles of the "
    "shoes, with clear empty space above the head and below the feet — the shoes must be fully visible and not cropped. "
    "Plain seamless dark charcoal-grey studio backdrop and floor, soft even studio lighting, sharp focus, natural skin "
    "texture. No text, no watermark, no props, single person only."
)


def slug(label: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")


def data_uri(path: str) -> str:
    with open(path, "rb") as f:
        return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()


def run_nano_banana(prompt: str, refs: list, token: str) -> bytes:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json", "Prefer": "wait=60"}
    payload = {"input": {"prompt": prompt, "image_input": refs, "aspect_ratio": "2:3", "output_format": "jpg"}}
    with httpx.Client(timeout=120.0) as client:
        for attempt in range(6):
            res = client.post(MODEL_URL, headers=headers, json=payload)
            if res.status_code == 429:
                wait = int(res.json().get("retry_after", 10)) + 2
                print(f"    rate limited, waiting {wait}s")
                time.sleep(wait)
                continue
            res.raise_for_status()
            pred = res.json()
            while pred.get("status") not in ("succeeded", "failed", "canceled"):
                time.sleep(2)
                pred = client.get(pred["urls"]["get"], headers=headers).json()
            if pred["status"] != "succeeded":
                raise RuntimeError(f"prediction {pred['status']}: {pred.get('error')}")
            out = pred["output"]
            url = out[0] if isinstance(out, list) else out
            return client.get(url).content
    raise RuntimeError("gave up after repeated rate limits")


def save_webp(raw: bytes, path: str) -> None:
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    im.thumbnail((720, 1080), Image.LANCZOS)
    im.save(path, "WEBP", quality=84)


def main() -> None:
    token = os.getenv("REPLICATE_API_TOKEN", "").strip()
    if not token:
        sys.exit("REPLICATE_API_TOKEN is empty in backend/.env")
    only = set(sys.argv[sys.argv.index("--only") + 1:]) if "--only" in sys.argv else None
    os.makedirs(OUT_DIR, exist_ok=True)

    refs = {
        "female": [data_uri(os.path.join(FACES, "female.jpg"))],
        "male": [data_uri(os.path.join(FACES, "male.jpg"))],
    }

    # "Other" needs a consistent person too: create the base model once and reuse it
    other_base = os.path.join(FACES, "other.jpg")
    if not os.path.exists(other_base):
        print("[other] creating base model ...")
        raw = run_nano_banana(f"{FRAMING} {OTHER_BASE_WHO} Outfit: {GARMENTS['other']['Co-ord Set']}.", [], token)
        Image.open(io.BytesIO(raw)).convert("RGB").save(other_base, quality=92)
    refs["other"] = [data_uri(other_base)]

    done = failed = 0
    for gender, garments in GARMENTS.items():
        for label, outfit in garments.items():
            name = f"{gender}-{slug(label)}"
            path = os.path.join(OUT_DIR, f"{name}.webp")
            if (only and name not in only) or (not only and os.path.exists(path)):
                continue
            print(f"[{name}] generating ...", flush=True)
            try:
                raw = run_nano_banana(f"{FRAMING} {WHO[gender]} Outfit: {outfit}.", refs[gender], token)
                save_webp(raw, path)
                done += 1
                print(f"    saved {os.path.relpath(path, ROOT)}", flush=True)
            except Exception as e:  # keep going; rerun the script to retry failures
                failed += 1
                print(f"    FAILED: {e}", flush=True)
    print(f"\nDone: {done} generated, {failed} failed.")


if __name__ == "__main__":
    main()
