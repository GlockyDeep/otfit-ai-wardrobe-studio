"""
Saved try-ons ("My looks" / "What Others"), fabric-pattern restyling of try-on photos,
and the AI trend looks.

Privacy model (no user accounts in this MVP):
  * every browser has a random owner_id (kept in localStorage)
  * "private" saves are only listed for that owner_id
  * "shared" saves appear for everyone on the What Others page, only with explicit consent
  * "Don't save" deletes the generated try-on files from the server
"""
import base64
import json
import os
import re
import shutil
import threading
import time
import uuid
from typing import List, Optional

from pydantic import BaseModel, Field

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GENERATED_DIR = os.path.join(BASE_DIR, "generated_images")
GALLERY_DIR = os.path.join(BASE_DIR, "tryon_gallery")
GALLERY_INDEX = os.path.join(GALLERY_DIR, "index.json")
_lock = threading.Lock()

_NAME_RE = re.compile(r"^[0-9a-f]{32}\.webp$")
_OWNER_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")


def public_base() -> str:
    return os.getenv("PUBLIC_BASE_URL", f"http://localhost:{os.getenv('PORT', '8000')}").rstrip("/")


def generated_file_from_url(url: str) -> Optional[str]:
    """Map one of our /generated-images/<hex>.webp URLs to its file path (None for anything else)."""
    name = (url or "").rsplit("/generated-images/", 1)[-1].split("?")[0]
    if "/generated-images/" not in (url or "") or not _NAME_RE.match(name):
        return None
    path = os.path.join(GENERATED_DIR, name)
    return path if os.path.isfile(path) else None


def file_to_data_uri(path: str) -> str:
    with open(path, "rb") as f:
        return "data:image/webp;base64," + base64.b64encode(f.read()).decode()


# ---------------------------------------------------------------------------
# Gallery storage
# ---------------------------------------------------------------------------
class SaveTryOnRequest(BaseModel):
    image_url: str
    owner_id: str
    shared: bool = False
    consent: bool = False                 # required when shared
    display_name: Optional[str] = Field(default="", max_length=30)
    clothing_type: Optional[str] = Field(default="", max_length=160)
    colors: Optional[List[str]] = []
    pattern: Optional[str] = Field(default="", max_length=40)


class TryOnEntry(BaseModel):
    id: str
    image_url: str
    shared: bool
    display_name: str
    clothing_type: str
    colors: List[str]
    pattern: str
    created_at: float
    mine: bool = False


def _read_index() -> List[dict]:
    try:
        with open(GALLERY_INDEX, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _write_index(items: List[dict]) -> None:
    os.makedirs(GALLERY_DIR, exist_ok=True)
    tmp = GALLERY_INDEX + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=1)
    os.replace(tmp, GALLERY_INDEX)


def _entry(item: dict, owner_id: str) -> TryOnEntry:
    return TryOnEntry(
        id=item["id"], image_url=f"{public_base()}/gallery-images/{item['id']}.webp", shared=item["shared"],
        display_name=item.get("display_name") or "Anonymous", clothing_type=item.get("clothing_type", ""),
        colors=item.get("colors", []), pattern=item.get("pattern", ""), created_at=item["created_at"],
        mine=item["owner_id"] == owner_id,
    )


def valid_owner(owner_id: str) -> bool:
    return bool(_OWNER_RE.match(owner_id or ""))


def save_try_on(req: SaveTryOnRequest) -> TryOnEntry:
    src = generated_file_from_url(req.image_url)
    if not src:
        raise ValueError("This try-on image is no longer available. Generate it again and save.")
    if req.shared and not req.consent:
        raise ValueError("Please confirm you agree to share this photo before sharing it.")
    item_id = uuid.uuid4().hex
    os.makedirs(GALLERY_DIR, exist_ok=True)
    shutil.copyfile(src, os.path.join(GALLERY_DIR, f"{item_id}.webp"))
    item = dict(
        id=item_id, owner_id=req.owner_id, shared=bool(req.shared),
        display_name=(req.display_name or "").strip()[:30], clothing_type=(req.clothing_type or "")[:160],
        colors=[c[:40] for c in (req.colors or [])][:6], pattern=(req.pattern or "")[:40], created_at=time.time(),
    )
    with _lock:
        items = _read_index()
        items.insert(0, item)
        _write_index(items)
    return _entry(item, req.owner_id)


def list_try_ons(owner_id: str, scope: str) -> List[TryOnEntry]:
    with _lock:
        items = _read_index()
    if scope == "mine":
        items = [i for i in items if i["owner_id"] == owner_id]
    else:
        items = [i for i in items if i["shared"]]
    return [_entry(i, owner_id) for i in items[:200]]


def delete_try_on(item_id: str, owner_id: str) -> bool:
    with _lock:
        items = _read_index()
        keep = [i for i in items if not (i["id"] == item_id and i["owner_id"] == owner_id)]
        if len(keep) == len(items):
            return False
        _write_index(keep)
    try:
        os.remove(os.path.join(GALLERY_DIR, f"{item_id}.webp"))
    except FileNotFoundError:
        pass
    return True


def discard_generated(urls: List[str]) -> int:
    """'Don't save': delete try-on images we generated for this session."""
    removed = 0
    for url in urls[:20]:
        path = generated_file_from_url(url)
        if path:
            try:
                os.remove(path)
                removed += 1
            except OSError:
                pass
    return removed


# ---------------------------------------------------------------------------
# Fabric pattern restyling of a try-on photo
# ---------------------------------------------------------------------------
PATTERNS = {
    "Paisley": "classic Indian paisley (mango/kairi) motifs",
    "Floral": "elegant woven floral motifs",
    "Geometric": "fine modern geometric motifs",
    "Stripes": "neat vertical stripes",
    "Checks": "subtle check / plaid weave",
    "Polka dots": "small evenly spaced polka dots",
    "Bandhani": "traditional Rajasthani bandhani tie-dye dots",
    "Leheriya": "diagonal leheriya wave tie-dye stripes",
    "Ikat": "hand-woven ikat motifs with soft feathered edges",
    "Block print": "hand block-printed Indian motifs",
    "Brocade": "rich woven zari brocade with metallic thread motifs",
    "Chikankari": "delicate tone-on-tone chikankari white-thread embroidery",
    "Mirror work": "scattered small mirror-work (shisha) embroidery",
}


class PatternRequest(BaseModel):
    image_url: str                   # a try-on image we generated (/generated-images/...)
    pattern: str
    colors: Optional[List[str]] = []


class PatternResponse(BaseModel):
    image_url: str
    error: Optional[str] = None


def apply_pattern(req: PatternRequest, call_nano_banana, store_image) -> PatternResponse:
    import io

    import httpx
    import numpy as np
    from PIL import Image

    if req.pattern not in PATTERNS:
        return PatternResponse(image_url="", error="Unknown pattern.")
    src = generated_file_from_url(req.image_url)
    if not src:
        return PatternResponse(image_url="", error="This try-on image is no longer available. Generate it again.")
    colours = ", ".join(c for c in (req.colors or []) if c)[:120]
    prompt = (
        "Edit this photo. Change ONLY the fabric surface design of the main statement garment (the jacket, "
        "sherwani, kurta, saree, lehenga, dress or co-ord) so it shows "
        f"{PATTERNS[req.pattern]}"
        + (f", drawn in the outfit's existing colours ({colours})" if colours else ", in the outfit's existing colours")
        + ". Plain trousers, shirts, inner layers and shoes keep their original colour and look. "
        "Keep the person's face, hair, skin, body, pose, the garment cut and silhouette, accessories, footwear, "
        "camera framing and background exactly the same. The full body stays visible from head to toe with the "
        "shoes in frame. Photorealistic fabric texture."
    )
    base = Image.open(src).convert("L").resize((256, 384))
    for attempt in range(2):
        url = call_nano_banana(prompt, [file_to_data_uri(src)])
        if not url:
            continue
        try:
            out = Image.open(io.BytesIO(httpx.get(url, timeout=60).content)).convert("L").resize((256, 384))
            unchanged = np.abs(np.asarray(out, np.int16) - np.asarray(base, np.int16)).mean() < 1.5
        except Exception:
            unchanged = False
        if not unchanged:
            return PatternResponse(image_url=store_image(url))
        print(f"[WARN] Pattern attempt {attempt + 1} returned the photo unchanged; retrying")
    return PatternResponse(image_url="", error="The pattern couldn't be applied this time. Please try again.")


# ---------------------------------------------------------------------------
# AI trend looks (photos generated once by scripts/generate_trend_photos.py)
# ---------------------------------------------------------------------------
TRENDS = [
    dict(id="pastel-organza-lehenga", title="Pastel Organza Lehenga", gender="Female", garment="Lehenga Choli",
         colors=["Powder Blue", "Blush Pink", "Silver"], season="Festive & wedding",
         why="Light organza, pastel tones and delicate mirror work are replacing heavy, dark bridal wear.",
         outfit="a powder-blue organza lehenga with blush-pink choli, delicate mirror work and a sheer silver-edged dupatta, embellished silver juttis"),
    dict(id="emerald-velvet-bandhgala", title="Emerald Velvet Bandhgala", gender="Male", garment="Bandhgala Suit",
         colors=["Emerald Green", "Black", "Antique Gold"], season="Winter weddings",
         why="Jewel-tone velvet brings warmth and richness to winter receptions without a full sherwani.",
         outfit="an emerald-green velvet bandhgala jacket with antique-gold buttons, black slim trousers and black velvet loafers"),
    dict(id="sage-relaxed-coord", title="Sage Relaxed Co-ord", gender="Other", garment="Co-ord Set",
         colors=["Sage Green", "Ivory"], season="Everyday & travel",
         why="Soft, gender-fluid co-ords in calm earthy colours are the go-to for comfort with polish.",
         outfit="a relaxed sage-green linen co-ord set with an ivory tank underneath, white minimal sneakers"),
    dict(id="ivory-chikankari-kurta", title="Ivory Chikankari Kurta", gender="Male", garment="Kurta Set",
         colors=["Ivory", "White"], season="Summer festivals",
         why="Hand-embroidered chikankari in breathable cotton is the summer festive staple.",
         outfit="an ivory cotton kurta with tone-on-tone chikankari embroidery, white straight pyjama trousers and tan kolhapuri sandals"),
    dict(id="pre-draped-belted-saree", title="Pre-draped Belted Saree", gender="Female", garment="Banarasi Silk Saree",
         colors=["Wine Red", "Antique Gold"], season="Cocktail & sangeet",
         why="Ready-to-wear drapes with a statement belt give the saree a modern, easy-to-move silhouette.",
         outfit="a wine-red pre-draped satin saree with a structured antique-gold waist belt and a matching blouse, gold strappy heels"),
    dict(id="oversized-power-suit", title="Oversized Power Suit", gender="Female", garment="Tailored Pant Suit / Skirt Suit",
         colors=["Camel Brown", "Ivory"], season="Work & evenings",
         why="Relaxed shoulders and wide trousers make tailoring comfortable without losing authority.",
         outfit="an oversized camel-brown double-breasted blazer with matching wide-leg trousers and an ivory silk camisole, black pointed loafers"),
    dict(id="bandhani-sharara", title="Bandhani Sharara Set", gender="Female", garment="Sharara Set",
         colors=["Mustard Yellow", "Magenta"], season="Haldi & mehendi",
         why="Craft prints like bandhani are back in bright, celebratory colours for daytime functions.",
         outfit="a mustard-yellow bandhani-print kurti with flared magenta sharara pants and a bandhani dupatta, gold juttis"),
    dict(id="ivory-indo-western", title="Ivory Indo-Western Jacket", gender="Male", garment="Modi Jacket / Nehru Vest",
         colors=["Ivory", "Champagne Gold"], season="Engagements & receptions",
         why="Monochrome ivory with subtle gold detailing is the clean alternative to heavy groom-wear.",
         outfit="an ivory long Indo-western jacket with subtle champagne-gold embroidery over a matching kurta and ivory trousers, ivory mojaris"),
]


def trends_payload() -> List[dict]:
    return [dict(t, image="/trends/" + t["id"] + ".webp") for t in TRENDS]
