"""
Helpers for virtual try-on.

The outfit photo shows a catalogue model. If the image model can see that model's face it
sometimes copies it instead of the user's, so we cover the head with backdrop colour first,
leaving only the clothes as reference.
"""
import base64
import io

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def _decode(data_uri: str) -> Image.Image:
    return Image.open(io.BytesIO(base64.b64decode(data_uri.split(",", 1)[1]))).convert("RGB")


def _encode(im: Image.Image) -> str:
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=90)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def find_head_box(im: Image.Image):
    """Locate the head of a single standing person on a plain studio backdrop.

    Pixels that differ clearly from the backdrop (sampled per row at the left/right edges)
    form the silhouette. Head height is estimated from the standing height (~1/7.5)."""
    a = np.asarray(im.convert("RGB"), dtype=np.int16)
    h, w, _ = a.shape
    edge = max(4, w // 25)
    backdrop = (a[:, :edge].mean(axis=1) + a[:, -edge:].mean(axis=1)) / 2  # (h, 3) per-row colour
    diff = np.abs(a - backdrop[:, None, :]).sum(axis=2)
    mask = diff > 60
    mask[:, :edge] = False
    mask[:, -edge:] = False
    rows = mask.sum(axis=1)
    person_rows = np.where(rows > max(3, w * 0.012))[0]
    if len(person_rows) < h * 0.3:
        return None
    top, bottom = int(person_rows[0]), int(person_rows[-1])
    head_h = (bottom - top) / 7.5
    head_rows = mask[top: int(top + head_h)]
    cols = np.where(head_rows.any(axis=0))[0]
    cx = int(cols.mean()) if len(cols) else w // 2
    half_w = int(head_h * 0.72)
    return (max(0, cx - half_w), max(0, top - int(head_h * 0.15)), min(w, cx + half_w), int(top + head_h * 1.08))


def mask_model_head(data_uri: str) -> str:
    """Return the outfit photo with the model's head replaced by backdrop colour."""
    return mask_model_head_with_box(data_uri)[0]


def mask_model_head_with_box(data_uri: str):
    """Like mask_model_head, but also return the (x0, y0, x1, y1) box that was covered (or None)."""
    im = _decode(data_uri)
    box = find_head_box(im)
    if not box:
        return data_uri, None
    x0, y0, x1, y1 = box
    a = np.asarray(im)
    sample = np.concatenate([a[y0:y1, : max(4, im.width // 25)].reshape(-1, 3), a[y0:y1, -max(4, im.width // 25):].reshape(-1, 3)])
    colour = tuple(int(v) for v in sample.mean(axis=0))
    cover = Image.new("L", im.size, 0)
    ImageDraw.Draw(cover).rounded_rectangle(box, radius=int((x1 - x0) * 0.35), fill=255)
    cover = cover.filter(ImageFilter.GaussianBlur(max(2, im.width // 200)))
    im.paste(Image.new("RGB", im.size, colour), (0, 0), cover)
    return _encode(im), box


def looks_like_failed_try_on(result: Image.Image, outfit_ref_uri: str, head_box=None, person_uri: str = "") -> str:
    """Return a reason if the image model echoed the head-masked outfit photo instead of dressing the user.

    A correct try-on keeps the same garment, pose and backdrop as the outfit photo, so the two images are
    very similar overall. The only reliable signal is the head: in an echo the masked area is still the
    flat backdrop-coloured blob; in a real try-on it contains a face and hair."""
    # Echo of the PERSON photo (still in their own clothes): measured ~0.8 for echoes vs 12-22 for real try-ons
    if person_uri:
        g = lambda im: np.asarray(im.convert("L").resize((128, 192)), dtype=np.int16)  # noqa: E731
        if np.abs(g(result) - g(_decode(person_uri))).mean() < 4:
            return "the person photo was returned unchanged (clothes not replaced)"
    ref = _decode(outfit_ref_uri)
    res = result.convert("RGB").resize(ref.size)
    if head_box:
        x0, y0, x1, y1 = head_box
        # inner part of the masked box (the blurred edge is excluded)
        mx, my = (x1 - x0) // 5, (y1 - y0) // 5
        inner = (x0 + mx, y0 + my, x1 - mx, y1 - my)
        r = np.asarray(res.convert("L").crop(inner), dtype=np.float32)
        m = np.asarray(ref.convert("L").crop(inner), dtype=np.float32)
        if r.size and np.abs(r - m).mean() < 12 and r.std() < 12:
            return "the head area is still the blank mask (outfit photo returned unchanged)"
        return ""
    # No mask was applied: only reject a near pixel-perfect copy of the outfit photo
    big = lambda im: np.asarray(im.convert("L").resize((256, 384)), dtype=np.int16)  # noqa: E731
    if np.abs(big(res) - big(ref)).mean() < 1.5:
        return "the outfit photo was returned unchanged"
    return ""
