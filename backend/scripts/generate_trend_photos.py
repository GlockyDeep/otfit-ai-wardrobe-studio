"""
Generate the AI trend-look photos for the "What Others" page with Google Nano Banana.

Output: frontend/public/trends/<trend id>.webp (existing files are skipped).
Usage:  python backend/scripts/generate_trend_photos.py
Cost:   ~US$0.04 per image (8 trends ≈ US$0.32).
"""
import io
import os
import sys

from PIL import Image

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)
sys.path.insert(0, os.path.join(BACKEND, "scripts"))

from community import TRENDS  # noqa: E402
from generate_model_photos import FACES, FRAMING, OUT_DIR, WHO, data_uri, run_nano_banana, save_webp  # noqa: E402

TREND_DIR = os.path.join(os.path.dirname(OUT_DIR), "trends")


def main() -> None:
    token = os.getenv("REPLICATE_API_TOKEN", "").strip()
    if not token:
        sys.exit("REPLICATE_API_TOKEN is empty in backend/.env")
    os.makedirs(TREND_DIR, exist_ok=True)
    done = failed = 0
    for t in TRENDS:
        path = os.path.join(TREND_DIR, f"{t['id']}.webp")
        if os.path.exists(path):
            continue
        g = t["gender"].lower()
        refs = [data_uri(os.path.join(FACES, f"{g}.jpg"))]
        print(f"[{t['id']}] generating ...", flush=True)
        try:
            save_webp(run_nano_banana(f"{FRAMING} {WHO[g]} Outfit: {t['outfit']}.", refs, token), path)
            done += 1
        except Exception as e:  # rerun to retry failures
            failed += 1
            print(f"    FAILED: {e}", flush=True)
    print(f"Done: {done} generated, {failed} failed.")


if __name__ == "__main__":
    main()
