"""
Colour-accuracy check: for every palette chip, run the real recommendation pipeline
(rule engine -> outfit -> user palette -> image prompt -> Nano Banana) and measure
whether the dominant clothing colour in the photo matches the colour printed on the card.

Usage:  python backend/scripts/test_palette_images.py [--only "Terracotta" "Pastels"]
Output: a contact sheet + report in the folder given by --out (default: backend/scripts/palette_test_output)
Cost:   ~US$0.04 per palette tested.
"""
import io
import math
import os
import sys

import httpx
from dotenv import load_dotenv
from PIL import Image, ImageDraw

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)
load_dotenv(os.path.join(BACKEND, ".env"))

from prompts import generate_rule_based, resolve_garment_image  # noqa: E402
from rules import FashionRuleEngine  # noqa: E402

CHIPS = ["Jewel tones", "Pastels", "Earthy tones", "Monochrome", "All-black", "All-white", "Ivory & cream",
         "Bold neons", "Dusty rose", "Sapphire blue", "Burgundy & wine", "Forest green", "Terracotta", "Gold & bronze"]
CASES = [("Male", "Wedding", "Sherwani"), ("Female", "Wedding", "Lehenga Choli")]

# Hex for the colour names produced by palette.py
HEX = {
    "Emerald Green": "#047857", "Sapphire Blue": "#1f4fb8", "Ruby Red": "#9b111e", "Amethyst Purple": "#7b4fa0",
    "Blush Pink": "#f2c4c9", "Mint Green": "#a7e3c4", "Powder Blue": "#a9c6e8", "Butter Yellow": "#f6e27a",
    "Terracotta": "#c05a3c", "Camel Brown": "#b88a55", "Olive Green": "#6b7333", "Chocolate Brown": "#4a2c1a",
    "Charcoal Grey": "#3f4247", "Slate Grey": "#6b737c", "Pearl Grey": "#d9d9d6", "Jet Black": "#121214",
    "Charcoal Black": "#1c1d21", "Pure White": "#f7f7f5", "Ivory White": "#f4ecd8", "Ivory": "#f4ecd8",
    "Cream": "#efe3c6", "Champagne Beige": "#e3d3ae", "Neon Green": "#7fff00", "Hot Pink": "#ff2fb3",
    "Electric Yellow": "#fff200", "Cyan": "#00e5ff", "Dusty Rose": "#c98b93", "Mauve": "#a77a98",
    "Navy Blue": "#1e2a5a", "Cornflower Blue": "#6495ed", "Burgundy": "#6d1a36", "Wine Red": "#6b1e3b",
    "Deep Maroon": "#5a0f1a", "Forest Green": "#1f5135", "Bottle Green": "#0f4a32", "Sage Green": "#9caf88",
    "Burnt Orange": "#cc5500", "Rust": "#b0521f", "Gold": "#d4a73a", "Bronze": "#a8753a", "Antique Gold": "#b08d3c",
}


def _lab(rgb):
    def lin(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(float(v)) for v in rgb)
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116  # noqa: E731
    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))


def delta_e(a, b):
    return math.dist(_lab(a), _lab(b))


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def clothing_colours(img: Image.Image):
    """Dominant colours of the clothing: torso/legs area, ignoring the grey studio backdrop and skin."""
    w, h = img.size
    region = img.crop((int(w * 0.3), int(h * 0.22), int(w * 0.7), int(h * 0.82))).convert("RGB")
    q = region.quantize(colors=8, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()
    counts = sorted(q.getcolors(), reverse=True)
    backdrop = img.getpixel((int(w * 0.05), int(h * 0.5)))
    skin_like = [(190, 140, 110), (220, 170, 140), (160, 110, 80)]
    out = []
    for count, idx in counts:
        rgb = tuple(pal[idx * 3: idx * 3 + 3])
        if delta_e(rgb, backdrop) < 10 or min(delta_e(rgb, s) for s in skin_like) < 9:
            continue
        out.append((count, rgb))
    total = sum(c for c, _ in out) or 1
    return [(c / total, rgb) for c, rgb in out]


def main():
    args = sys.argv[1:]
    only = args[args.index("--only") + 1:] if "--only" in args else None
    out_dir = args[args.index("--out") + 1] if "--out" in args else os.path.join(BACKEND, "scripts", "palette_test_output")
    os.makedirs(out_dir, exist_ok=True)
    engine = FashionRuleEngine()
    rows = []
    for i, chip in enumerate(CHIPS):
        if only and chip not in only:
            continue
        gender, occasion, garment = CASES[(i + (1 if "--swap" in args else 0)) % len(CASES)]
        ctx = engine.evaluate(gender, occasion, "South Asian", "Medium", "Mild", garment, chip, "")
        rec = generate_rule_based(ctx)
        o = rec.primary_outfit
        print(f"[{chip}] {gender} {o.clothing_type} -> {o.colors}", flush=True)
        url = resolve_garment_image(o.clothing_type, o.colors, o.fabric, gender, 0, chip)
        if not url:
            print("    image generation FAILED")
            rows.append((chip, gender, o.colors, None, None, "FAIL"))
            continue
        img = Image.open(io.BytesIO(httpx.get(url, timeout=60).content)).convert("RGB")
        img.save(os.path.join(out_dir, f"{chip.replace(' ', '_').replace('&', 'and')}.jpg"), quality=88)
        found = clothing_colours(img)
        # best match of the main/secondary colour against clothing colours covering >=10% of the garment area
        # (embroidery, dupattas and lighting shift individual pixels, so the two leading colours are compared)
        expected = [hex_rgb(HEX.get(c, "#888888")) for c in o.colors[:2]]
        main_de = min((delta_e(rgb, e) for share, rgb in found if share >= 0.10 for e in expected), default=99)
        verdict = "PASS" if main_de <= 22 else "CHECK"
        print(f"    main colour {o.colors[0]}: best dE={main_de:.1f} -> {verdict}", flush=True)
        rows.append((chip, gender, o.colors, img, main_de, verdict))

    # contact sheet: photo + expected swatches + verdict
    W, H = 200, 300
    sheet = Image.new("RGB", (W * min(7, len(rows)), (H + 60) * math.ceil(len(rows) / 7)), (18, 18, 22))
    d = ImageDraw.Draw(sheet)
    for n, (chip, gender, colours, img, de, verdict) in enumerate(rows):
        x, y = (n % 7) * W, (n // 7) * (H + 60)
        if img:
            sheet.paste(img.resize((W, H)), (x, y))
        for k, c in enumerate(colours):
            d.rectangle((x + 4 + k * 22, y + H + 4, x + 22 + k * 22, y + H + 22), fill=HEX.get(c, "#888888"))
        d.text((x + 4, y + H + 26), f"{chip}", fill=(235, 235, 235))
        d.text((x + 4, y + H + 40), f"{verdict} dE={de:.0f}" if de is not None else verdict,
               fill=(120, 230, 140) if verdict == "PASS" else (250, 190, 90))
    sheet_path = os.path.join(out_dir, "contact_sheet.jpg")
    sheet.save(sheet_path, quality=88)
    passed = sum(1 for r in rows if r[5] == "PASS")
    print(f"\n{passed}/{len(rows)} palettes matched automatically. Sheet: {sheet_path}")


if __name__ == "__main__":
    main()
