"""
Single source of truth for outfit colours.

The user's colour choices (palette chips such as "Terracotta" or colours typed in
their own words) are turned into concrete colour names. Those names are written
into every outfit's `colors` list AND used verbatim in the image prompt, so the
text on the card and the generated photo always show the same colours.
"""
import re
from typing import List

# Palette chip (lower-case) -> concrete colours, ordered main -> secondary -> accent
PALETTE_TAGS = {
    "jewel tones": ["Emerald Green", "Sapphire Blue", "Ruby Red", "Amethyst Purple"],
    "pastels": ["Blush Pink", "Mint Green", "Powder Blue", "Butter Yellow"],
    "earthy tones": ["Terracotta", "Camel Brown", "Olive Green", "Chocolate Brown"],
    "monochrome": ["Charcoal Grey", "Slate Grey", "Pearl Grey"],
    "all-black": ["Jet Black", "Charcoal Black"],
    "all black": ["Jet Black", "Charcoal Black"],
    "all-white": ["Pure White", "Ivory White"],
    "all white": ["Pure White", "Ivory White"],
    "ivory & cream": ["Ivory", "Cream", "Champagne Beige"],
    "ivory and cream": ["Ivory", "Cream", "Champagne Beige"],
    "bold neons": ["Neon Green", "Hot Pink", "Electric Yellow", "Cyan"],
    "dusty rose": ["Dusty Rose", "Blush Pink", "Mauve"],
    "sapphire blue": ["Sapphire Blue", "Navy Blue", "Cornflower Blue"],
    "burgundy & wine": ["Burgundy", "Wine Red", "Deep Maroon"],
    "burgundy and wine": ["Burgundy", "Wine Red", "Deep Maroon"],
    "forest green": ["Forest Green", "Bottle Green", "Sage Green"],
    "terracotta": ["Terracotta", "Burnt Orange", "Rust"],
    "gold & bronze": ["Gold", "Bronze", "Antique Gold"],
    "gold and bronze": ["Gold", "Bronze", "Antique Gold"],
}

# Palettes where every piece must stay inside one colour family
MONO_TAGS = {"monochrome", "all-black", "all black", "all-white", "all white"}

# Colours a user might type in their own words ("emerald green, gold")
_TYPED_COLOURS = [
    # multi-word names first so "emerald green" stays one colour
    "emerald green", "forest green", "bottle green", "olive green", "sage green", "mint green", "ruby red",
    "wine red", "cherry red", "sapphire blue", "cobalt blue", "midnight blue", "peacock green", "mustard yellow",
    "burnt orange", "hot pink", "baby pink", "blush pink", "off white", "off-white", "jet black", "charcoal grey",
    "navy blue", "royal blue", "sky blue", "powder blue", "baby blue", "sapphire", "cobalt", "teal", "turquoise",
    "peacock blue", "emerald", "forest green", "bottle green", "olive", "sage", "mint", "lime", "ruby", "crimson",
    "scarlet", "maroon", "burgundy", "wine", "coral", "peach", "blush", "dusty rose", "rose", "pink", "fuchsia",
    "magenta", "rani pink", "lavender", "lilac", "mauve", "purple", "violet", "plum", "saffron", "marigold",
    "mustard", "orange", "rust", "terracotta", "copper", "bronze", "gold", "silver", "champagne", "beige", "camel",
    "tan", "khaki", "brown", "ivory", "cream", "white", "black", "charcoal", "grey", "gray", "red", "blue",
    "green", "yellow",
]

# Hue words that may appear in template text and must follow the user's palette.
# Metallics (gold, silver, bronze, copper, zari) are left alone — they pair with any palette.
_HUE_WORDS = re.compile(
    r"\b(royal navy blue|royal blue|navy blue|midnight blue|sky blue|powder blue|sapphire blue|cobalt blue|"
    r"emerald green|forest green|bottle green|olive green|sage green|mint green|deep crimson|crimson|ruby red|"
    r"deep maroon|maroon|burgundy|wine red|dusty rose|blush pink|rani pink|hot pink|fuchsia|magenta|"
    r"lavender|lilac|mauve|amethyst|purple|violet|plum|saffron|marigold|mustard|terracotta|burnt orange|"
    r"rust|coral|peach|teal|turquoise|navy|emerald|sapphire|ruby|red|blue|green|pink|orange|yellow)\b",
    re.IGNORECASE,
)


def _title(s: str) -> str:
    return " ".join(w.capitalize() for w in s.split())


def palette_from_preferences(preferences: str) -> List[str]:
    """Concrete colour names from the user's chips / free text, in priority order."""
    if not preferences:
        return []
    lower = preferences.lower()
    # Palettes in the order the user listed them; interleave so every chosen palette appears in the main look
    tags = sorted((lower.find(t), t) for t in PALETTE_TAGS if t in lower)
    groups: List[List[str]] = []
    for _, tag in tags:
        if PALETTE_TAGS[tag] not in groups:
            groups.append(PALETTE_TAGS[tag])
    found: List[str] = []
    for i in range(max((len(g) for g in groups), default=0)):
        for g in groups:
            if i < len(g) and g[i] not in found:
                found.append(g[i])
    if found:
        return found
    # No chips: pick up colours typed in their own words
    typed: List[str] = []
    for word in _TYPED_COLOURS:
        if re.search(rf"\b{re.escape(word)}\b", lower) and not any(word in t.lower() for t in typed):
            typed.append(_title(word))
    return typed


def is_mono(preferences: str) -> bool:
    lower = (preferences or "").lower()
    return any(tag in lower for tag in MONO_TAGS)


def outfit_colours(palette: List[str], index: int) -> List[str]:
    """Colours for outfit #index (0 = primary). Alternatives rotate the palette so looks differ."""
    if not palette:
        return []
    n = len(palette)
    start = index % n
    rotated = palette[start:] + palette[:start]
    return rotated[: min(3, n)]


def image_colour_instruction(colours: List[str], mono: bool = False) -> str:
    """Exact colour directions for the image model."""
    if not colours:
        return ""
    if mono:
        return (f"COLOUR REQUIREMENT: the entire outfit, including footwear, is in {' and '.join(colours)} tones only. "
                f"No other colours anywhere on the clothing.")
    parts = [f"main garment colour {colours[0]}"]
    if len(colours) > 1:
        parts.append(f"secondary colour {colours[1]}")
    if len(colours) > 2:
        parts.append(f"accent / trim colour {colours[2]}")
    return ("COLOUR REQUIREMENT: " + "; ".join(parts) + ". The dominant colour of the outfit must clearly be "
            f"{colours[0]}. Use only these colours on the clothing and footwear (metallic embroidery allowed); "
            "do not introduce any other colour.")


def recolour_text(text: str, replacement: str) -> str:
    """Swap template hue words for the user's colour (used only for the rule-based fallback text)."""
    return _HUE_WORDS.sub(replacement, text) if text else text


def apply_user_palette(recommendation, preferences: str, rewrite_text: bool) -> None:
    """Make every outfit's colours (and, for template text, its colour words) follow the user's palette."""
    palette = palette_from_preferences(preferences)
    if not palette:
        return
    outfits = [recommendation.primary_outfit] + list(recommendation.alternatives)
    for i, outfit in enumerate(outfits):
        colours = outfit_colours(palette, i)
        outfit.colors = colours
        if rewrite_text:
            accent = colours[-1]
            main = colours[0]
            outfit.footwear = recolour_text(outfit.footwear, accent)
            outfit.fabric = recolour_text(outfit.fabric, main)
            outfit.embroidery_or_pattern = recolour_text(outfit.embroidery_or_pattern, accent)
            outfit.accessories = [recolour_text(a, accent) for a in outfit.accessories]
            outfit.styling_tips = [recolour_text(t, accent) for t in outfit.styling_tips]
            outfit.silhouette = recolour_text(outfit.silhouette, main)
            outfit.clothing_type = recolour_text(outfit.clothing_type, main)
