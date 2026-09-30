"""
Rule-based outfit designer (used when no OpenAI / Groq key is configured).

Every outfit is built from a garment catalogue so that it always matches what the
user asked for:
  * the garment they picked is the primary look (otherwise the best one for the occasion)
  * alternatives are the next best garments for that occasion and gender
  * fabric follows the season
  * every colour word comes from the user's palette ({c0} main, {c1} secondary, {c2} accent)
"""
from typing import Dict, List, Optional

try:
    from backend.palette import palette_from_preferences, outfit_colours
except ImportError:
    from palette import palette_from_preferences, outfit_colours

SEASONS = ("Summer", "Winter", "Monsoon", "Mild")


def _fab(summer: str, winter: str, monsoon: str, mild: str) -> Dict[str, str]:
    return dict(zip(SEASONS, (summer, winter, monsoon, mild)))


TRAD_FABRIC = _fab("Breathable raw silk with a cotton lining", "Rich brocade silk with velvet trims",
                   "Lightweight silk blend with a quick-dry lining", "Pure raw silk")
DRAPE_FABRIC = _fab("Airy chanderi silk with organza", "Heavy Banarasi silk with a velvet blouse",
                    "Georgette that dries quickly and resists creasing", "Soft Banarasi silk")
TAILOR_FABRIC = _fab("Tropical-weight wool blend", "Worsted wool with a hint of cashmere",
                     "Water-resistant wool blend", "Fine merino wool")
CASUAL_FABRIC = _fab("Breathable linen-cotton", "Brushed cotton twill with a light knit layer",
                     "Quick-dry cotton blend", "Soft cotton")

# (gender, label) -> design. Text may use {c0} {c1} {c2} colour slots.
CATALOGUE: Dict[tuple, dict] = {
    # ---------------- Male ----------------
    ("Male", "Sherwani"): dict(
        type="{c0} Silk Sherwani with {c1} Churidar and {c2} Dupatta", default=["Ivory", "Maroon", "Antique Gold"],
        silhouette="Knee-length structured sherwani with mandarin collar and slim churidar", fabric=TRAD_FABRIC,
        motif="Tonal zardozi on the collar, cuffs and placket with {c2} highlights",
        acc=["Kundan or pearl mala", "{c2} brooch on the dupatta", "Classic analogue watch"], shoes="{c2} embroidered mojaris",
        hair="Neat side part, short trimmed beard", groom="Clean, well-moisturised skin",
        tips=["Drape the {c2} dupatta over the left shoulder so the embroidery shows.", "Let the churidar gather softly at the ankle."]),
    ("Male", "Bandhgala Suit"): dict(
        type="{c0} Bandhgala (Jodhpuri) Suit with {c1} Trousers", default=["Navy Blue", "Navy Blue", "Antique Gold"],
        silhouette="Tailored closed-neck jacket with mandarin collar and straight trousers", fabric=TAILOR_FABRIC,
        motif="Minimal self-textured weave with {c2} buttons", acc=["{c2} pocket square", "Cufflinks", "Leather watch"],
        shoes="Polished black leather oxfords", hair="Short textured crop", groom="Neat stubble or clean shave",
        tips=["Keep all buttons closed for a sharp line.", "Add a {c2} pocket square for a festive touch."]),
    ("Male", "3-Piece Vest Suit"): dict(
        type="{c0} Three-Piece Suit with {c1} Waistcoat", default=["Charcoal Grey", "Charcoal Grey", "Burgundy"],
        silhouette="Slim-fit single-breasted jacket, matching waistcoat and tapered trousers", fabric=TAILOR_FABRIC,
        motif="Subtle herringbone texture", acc=["{c2} silk tie", "White pocket square", "Tie bar"],
        shoes="Black cap-toe oxfords", hair="Classic side part", groom="Clean shave or trimmed beard",
        tips=["Leave the bottom waistcoat button undone.", "Match the tie to the {c2} accent."]),
    ("Male", "2-Piece Suit"): dict(
        type="{c0} Two-Piece Slim Suit", default=["Navy Blue", "White", "Burgundy"],
        silhouette="Slim single-breasted jacket with tapered trousers", fabric=TAILOR_FABRIC,
        motif="Clean solid finish", acc=["{c2} tie", "{c1} dress shirt", "Silver watch"],
        shoes="Brown leather derby shoes", hair="Short side-swept style", groom="Trimmed beard",
        tips=["Show about 1 cm of shirt cuff below the sleeve.", "Keep the jacket buttoned when standing."]),
    ("Male", "Tuxedo"): dict(
        type="{c0} Satin-Lapel Tuxedo with {c1} Dress Shirt", default=["Jet Black", "White", "Jet Black"],
        silhouette="Peak-lapel dinner jacket with slim trousers and satin side stripe", fabric=TAILOR_FABRIC,
        motif="Satin peak lapels and covered buttons", acc=["{c2} bow tie", "Onyx cufflinks", "Pocket square"],
        shoes="Black patent leather shoes", hair="Slicked-back or neat side part", groom="Clean shave",
        tips=["Choose a bow tie that matches the lapel sheen.", "Skip the belt; use side adjusters."]),
    ("Male", "Panche / Veshti & Angavastram"): dict(
        type="{c0} Silk Veshti with {c2} Zari Border and {c1} Shirt", default=["Ivory", "White", "Gold"],
        silhouette="Traditional wrapped veshti with a matching angavastram over one shoulder", fabric=TRAD_FABRIC,
        motif="Temple-pattern {c2} zari border", acc=["Gold chain", "Angavastram with {c2} border", "Traditional watch"],
        shoes="Tan leather sandals", hair="Neatly combed back", groom="Natural, clean look",
        tips=["Fold the angavastram neatly over the left shoulder.", "Keep the veshti hem just above the ankle."]),
    ("Male", "Modi Jacket / Nehru Vest"): dict(
        type="{c0} Nehru Jacket over a {c1} Kurta with Churidar", default=["Maroon", "Cream", "Antique Gold"],
        silhouette="Sleeveless mandarin-collar jacket over a straight knee-length kurta", fabric=TRAD_FABRIC,
        motif="Jacquard weave with {c2} buttons", acc=["{c2} pocket square", "Leather strap watch"],
        shoes="Tan leather mojaris", hair="Short textured style", groom="Trimmed beard",
        tips=["Leave the top button of the jacket open for ease.", "Keep the kurta hem just above the knee."]),
    ("Male", "Kurta Set"): dict(
        type="{c0} Straight Kurta with {c1} Churidar", default=["Ivory", "White", "Antique Gold"],
        silhouette="Straight knee-length kurta with mandarin collar and slim churidar", fabric=CASUAL_FABRIC,
        motif="Subtle {c2} thread embroidery on the placket", acc=["Kolhapuri-style belt pouch", "Leather watch"],
        shoes="{c2} mojaris", hair="Neat side part", groom="Well-groomed stubble",
        tips=["Roll the sleeves once for a relaxed look.", "Keep accessories minimal."]),
    ("Male", "Shirt & Chinos / Denim"): dict(
        type="{c0} Oxford Shirt with {c1} Chinos", default=["Light Blue", "Khaki", "Brown"],
        silhouette="Tailored button-down shirt tucked into slim chinos", fabric=CASUAL_FABRIC,
        motif="Fine oxford weave", acc=["{c2} leather belt", "Minimal watch"], shoes="{c2} suede loafers",
        hair="Textured quiff", groom="Light stubble", tips=["Match the belt and shoes.", "Roll sleeves to the forearm."]),
    ("Male", "Polo & Chinos"): dict(
        type="{c0} Polo Shirt with {c1} Chinos", default=["Forest Green", "Beige", "White"],
        silhouette="Fitted polo with slim chinos", fabric=CASUAL_FABRIC, motif="Piqué knit texture",
        acc=["Canvas belt", "Sport watch"], shoes="{c2} leather sneakers", hair="Short crop", groom="Clean shave",
        tips=["Keep the polo untucked for a relaxed look.", "Choose sneakers in the {c2} accent."]),
    ("Male", "Co-ord Set"): dict(
        type="{c0} Camp-Collar Co-ord Set", default=["Terracotta", "Terracotta", "White"],
        silhouette="Relaxed short-sleeve camp-collar shirt with matching trousers", fabric=CASUAL_FABRIC,
        motif="Solid texture", acc=["Minimal chain", "Sunglasses"], shoes="{c2} sneakers", hair="Messy textured crop",
        groom="Light stubble", tips=["Keep the shirt open at the collar.", "Roll trouser hems once."]),
    # ---------------- Female ----------------
    ("Female", "Lehenga Choli"): dict(
        type="{c0} Lehenga with {c1} Choli and {c2} Dupatta", default=["Emerald Green", "Ruby Red", "Gold"],
        silhouette="Flared A-line lehenga with fitted blouse and draped sheer dupatta", fabric=DRAPE_FABRIC,
        motif="Zardozi and sequin florals with a {c2} border", acc=["Kundan choker", "Maang tikka", "Bangles"],
        shoes="{c2} embellished juttis", hair="Low bun with fresh flowers", groom="Soft glam with defined eyes",
        tips=["Pin the dupatta on one shoulder so you can move freely.", "Keep jewellery in {c2} tones."]),
    ("Female", "Banarasi Silk Saree"): dict(
        type="{c0} Banarasi Silk Saree with {c1} Blouse", default=["Ruby Red", "Gold", "Gold"],
        silhouette="Classic pleated drape with the pallu over the left shoulder", fabric=DRAPE_FABRIC,
        motif="Woven {c2} zari border and pallu", acc=["Temple jhumkas", "Gold bangles", "Potli bag"],
        shoes="{c2} block-heel sandals", hair="Sleek bun with a gajra", groom="Classic kohl and bold lip",
        tips=["Keep the pleats crisp and tucked at the navel.", "Let the pallu fall to knee length."]),
    ("Female", "Anarkali Suit"): dict(
        type="{c0} Floor-Length Anarkali with {c1} Dupatta", default=["Royal Purple", "Gold", "Gold"],
        silhouette="Fitted bodice flaring into a floor-grazing Anarkali with churidar", fabric=DRAPE_FABRIC,
        motif="{c2} gota border and panelled flare", acc=["Chandbali earrings", "Stacked bangles"],
        shoes="{c2} juttis", hair="Soft side-swept waves", groom="Dewy base with berry lip",
        tips=["Belt the waist lightly to define the silhouette.", "Drape the dupatta across both arms."]),
    ("Female", "Sharara Set"): dict(
        type="{c0} Kurti with Flared {c1} Sharara", default=["Blush Pink", "Blush Pink", "Gold"],
        silhouette="Short kurti with wide flared sharara pants and dupatta", fabric=DRAPE_FABRIC,
        motif="{c2} gota patti on the hem", acc=["Jhumkas", "Hand bracelet"], shoes="{c2} juttis",
        hair="Braid with accessories", groom="Rosy cheeks and glossy lip",
        tips=["Choose a mid-length kurti to show the sharara flare.", "Keep the dupatta light."]),
    ("Female", "Kurta Set"): dict(
        type="{c0} Straight Kurta with {c1} Palazzo and Dupatta", default=["Teal", "Ivory", "Gold"],
        silhouette="Straight kurta with wide palazzo pants and a light dupatta", fabric=CASUAL_FABRIC,
        motif="{c2} thread embroidery on the yoke", acc=["Silver jhumkas", "Tote bag"], shoes="Tan kolhapuri sandals",
        hair="Loose waves", groom="Natural makeup", tips=["Layer the dupatta over one shoulder.", "Keep jewellery light."]),
    ("Female", "Tailored Pant Suit / Skirt Suit"): dict(
        type="{c0} Tailored Pant Suit with {c1} Blouse", default=["Charcoal Grey", "Ivory", "Gold"],
        silhouette="Single-breasted blazer with high-waist straight trousers", fabric=TAILOR_FABRIC,
        motif="Clean lines with {c2} buttons", acc=["Structured tote", "Stud earrings", "Slim watch"],
        shoes="Black pointed-toe heels", hair="Sleek low ponytail", groom="Polished neutral makeup",
        tips=["Tuck the blouse for a clean waistline.", "Trousers should just graze the shoes."]),
    ("Female", "Casual Dress / Shirt Dress"): dict(
        type="{c0} Belted Shirt Dress", default=["Cobalt Blue", "Cobalt Blue", "Nude"],
        silhouette="Knee-length shirt dress with a tie belt", fabric=CASUAL_FABRIC, motif="Solid colour",
        acc=["Hoop earrings", "Crossbody bag"], shoes="{c2} block-heel sandals", hair="Loose curls",
        groom="Fresh natural glow", tips=["Cinch the belt at the natural waist.", "Roll sleeves to the elbow."]),
    ("Female", "Co-ord Set"): dict(
        type="{c0} Cropped Shirt and Wide-Leg Trouser Co-ord", default=["Terracotta", "Terracotta", "White"],
        silhouette="Cropped camp-collar shirt with high-waist wide-leg trousers", fabric=CASUAL_FABRIC,
        motif="Solid texture", acc=["Gold hoops", "Mini bag"], shoes="{c2} sneakers", hair="High ponytail",
        groom="Minimal makeup", tips=["Keep the waistline visible.", "Add a structured bag."]),
    # ---------------- Other ----------------
    ("Other", "Co-ord Set"): dict(
        type="{c0} Relaxed Co-ord Set", default=["Sage Green", "Sage Green", "White"],
        silhouette="Boxy shirt with matching wide trousers", fabric=CASUAL_FABRIC, motif="Solid texture",
        acc=["Minimal rings", "Canvas tote"], shoes="{c2} sneakers", hair="Short tousled cut", groom="Natural look",
        tips=["Leave the shirt untucked for an easy line.", "Keep accessories minimal."]),
    ("Other", "Bandhgala Suit"): dict(
        type="{c0} Relaxed Bandhgala with {c1} Trousers", default=["Navy Blue", "Navy Blue", "Antique Gold"],
        silhouette="Relaxed closed-neck jacket with straight trousers", fabric=TAILOR_FABRIC,
        motif="{c2} buttons", acc=["Brooch", "Watch"], shoes="Black leather loafers", hair="Short tousled cut",
        groom="Natural look", tips=["Leave the top button open for comfort.", "Add a {c2} brooch."]),
    ("Other", "Modi Jacket / Nehru Vest"): dict(
        type="{c0} Nehru Vest over a Long {c1} Kurta", default=["Maroon", "Ivory", "Antique Gold"],
        silhouette="Sleeveless vest over a long straight kurta with trousers", fabric=TRAD_FABRIC,
        motif="Jacquard weave with {c2} buttons", acc=["Silver ring", "Watch"], shoes="Tan leather loafers",
        hair="Short tousled cut", groom="Natural look", tips=["Keep the vest buttoned.", "Choose a long kurta for drama."]),
    ("Other", "2-Piece Suit"): dict(
        type="{c0} Oversized Two-Piece Suit", default=["Sand Beige", "Black", "White"],
        silhouette="Relaxed oversized blazer with wide trousers over a {c1} tee", fabric=TAILOR_FABRIC,
        motif="Clean solid finish", acc=["Chain necklace", "Rings"], shoes="{c2} sneakers", hair="Short tousled cut",
        groom="Natural look", tips=["Push the sleeves up slightly.", "Keep the tee tucked for shape."]),
    ("Other", "Shirt & Chinos / Denim"): dict(
        type="Oversized {c0} Shirt with {c1} Chinos", default=["White", "Olive Green", "White"],
        silhouette="Oversized relaxed shirt with straight chinos", fabric=CASUAL_FABRIC, motif="Solid texture",
        acc=["Tote bag", "Watch"], shoes="{c2} sneakers", hair="Short tousled cut", groom="Natural look",
        tips=["Half-tuck the shirt.", "Roll the chinos once."]),
    ("Other", "Kurta Set"): dict(
        type="{c0} Straight Kurta with {c1} Trousers", default=["Mustard Yellow", "White", "Brown"],
        silhouette="Straight kurta with slim straight trousers", fabric=CASUAL_FABRIC,
        motif="{c2} thread detailing on the placket", acc=["Silver cuff", "Cloth bag"], shoes="{c2} leather sandals",
        hair="Short tousled cut", groom="Natural look", tips=["Keep it unfussy.", "Roll the sleeves once."]),
}

# Best garments per occasion, most suitable first
OCCASION_ORDER = {
    "wedding": {"Female": ["Lehenga Choli", "Banarasi Silk Saree", "Anarkali Suit", "Sharara Set"],
                "Male": ["Sherwani", "Bandhgala Suit", "Panche / Veshti & Angavastram", "3-Piece Vest Suit", "Modi Jacket / Nehru Vest"],
                "Other": ["Bandhgala Suit", "Modi Jacket / Nehru Vest", "2-Piece Suit", "Kurta Set"]},
    "diwali": {"Female": ["Banarasi Silk Saree", "Lehenga Choli", "Anarkali Suit", "Sharara Set", "Kurta Set"],
               "Male": ["Modi Jacket / Nehru Vest", "Kurta Set", "Sherwani", "Bandhgala Suit", "Panche / Veshti & Angavastram"],
               "Other": ["Modi Jacket / Nehru Vest", "Kurta Set", "Bandhgala Suit", "Co-ord Set"]},
    "festival": {"Female": ["Anarkali Suit", "Sharara Set", "Banarasi Silk Saree", "Kurta Set"],
                 "Male": ["Kurta Set", "Modi Jacket / Nehru Vest", "Panche / Veshti & Angavastram", "Sherwani"],
                 "Other": ["Kurta Set", "Modi Jacket / Nehru Vest", "Co-ord Set"]},
    "business": {"Female": ["Tailored Pant Suit / Skirt Suit", "Kurta Set", "Co-ord Set"],
                 "Male": ["2-Piece Suit", "3-Piece Vest Suit", "Bandhgala Suit", "Shirt & Chinos / Denim"],
                 "Other": ["2-Piece Suit", "Bandhgala Suit", "Shirt & Chinos / Denim"]},
    "cocktail": {"Female": ["Casual Dress / Shirt Dress", "Anarkali Suit", "Tailored Pant Suit / Skirt Suit", "Co-ord Set"],
                 "Male": ["Tuxedo", "2-Piece Suit", "Bandhgala Suit", "3-Piece Vest Suit"],
                 "Other": ["2-Piece Suit", "Bandhgala Suit", "Co-ord Set"]},
    "date": {"Female": ["Casual Dress / Shirt Dress", "Anarkali Suit", "Co-ord Set", "Sharara Set"],
             "Male": ["2-Piece Suit", "Shirt & Chinos / Denim", "Bandhgala Suit", "Modi Jacket / Nehru Vest"],
             "Other": ["Co-ord Set", "2-Piece Suit", "Shirt & Chinos / Denim"]},
    "formal": {"Female": ["Banarasi Silk Saree", "Tailored Pant Suit / Skirt Suit", "Anarkali Suit"],
               "Male": ["Tuxedo", "3-Piece Vest Suit", "Bandhgala Suit", "Sherwani"],
               "Other": ["2-Piece Suit", "Bandhgala Suit", "Modi Jacket / Nehru Vest"]},
    "college": {"Female": ["Co-ord Set", "Kurta Set", "Casual Dress / Shirt Dress"],
                "Male": ["Shirt & Chinos / Denim", "Polo & Chinos", "Co-ord Set", "Kurta Set"],
                "Other": ["Co-ord Set", "Shirt & Chinos / Denim", "Kurta Set"]},
    "casual": {"Female": ["Casual Dress / Shirt Dress", "Co-ord Set", "Kurta Set"],
               "Male": ["Shirt & Chinos / Denim", "Polo & Chinos", "Co-ord Set", "Kurta Set"],
               "Other": ["Co-ord Set", "Shirt & Chinos / Denim", "Kurta Set"]},
}
OCCASION_KEYS = [("wedding", "wedding"), ("sangeet", "wedding"), ("reception", "wedding"), ("diwali", "diwali"),
                 ("festiv", "festival"), ("eid", "festival"), ("puja", "festival"), ("business", "business"),
                 ("meeting", "business"), ("office", "business"), ("interview", "business"), ("cocktail", "cocktail"),
                 ("party", "cocktail"), ("date", "date"), ("dinner", "date"), ("formal", "formal"), ("gala", "formal"),
                 ("college", "college"), ("campus", "college"), ("casual", "casual")]


def _gender_key(gender: str) -> str:
    g = (gender or "").lower()
    return "Female" if "female" in g or "woman" in g else "Male" if "male" in g or "man" in g else "Other"


def _occasion_key(occasion: str) -> str:
    o = (occasion or "").lower()
    for word, key in OCCASION_KEYS:
        if word in o:
            return key
    return "casual"


def _match_garment(desired: str, gender: str) -> Optional[str]:
    """Map the user's garment choice (chip label or free text) to a catalogue entry."""
    if not desired:
        return None
    d = desired.lower()
    labels = [label for (g, label) in CATALOGUE if g == gender]
    for label in labels:
        if label.lower() == d:
            return label
    keywords = {
        "sherwani": "Sherwani", "bandhgala": "Bandhgala Suit", "jodhpuri": "Bandhgala Suit", "tuxedo": "Tuxedo",
        "3-piece": "3-Piece Vest Suit", "three piece": "3-Piece Vest Suit", "waistcoat": "3-Piece Vest Suit",
        "suit": "2-Piece Suit", "veshti": "Panche / Veshti & Angavastram", "panche": "Panche / Veshti & Angavastram",
        "dhoti": "Panche / Veshti & Angavastram", "nehru": "Modi Jacket / Nehru Vest", "modi": "Modi Jacket / Nehru Vest",
        "kurta": "Kurta Set", "polo": "Polo & Chinos", "shirt": "Shirt & Chinos / Denim", "chino": "Shirt & Chinos / Denim",
        "co-ord": "Co-ord Set", "coord": "Co-ord Set", "lehenga": "Lehenga Choli", "saree": "Banarasi Silk Saree",
        "sari": "Banarasi Silk Saree", "anarkali": "Anarkali Suit", "gown": "Anarkali Suit", "sharara": "Sharara Set",
        "pant suit": "Tailored Pant Suit / Skirt Suit", "blazer": "Tailored Pant Suit / Skirt Suit",
        "dress": "Casual Dress / Shirt Dress",
    }
    for word, label in keywords.items():
        if word in d and label in labels:
            return label
    return None


def _fill(text: str, colours: List[str]) -> str:
    c = (colours + colours[-1:] * 3)[:3] if colours else ["", "", ""]
    return text.format(c0=c[0], c1=c[1], c2=c[2]).replace("  ", " ").strip()


def design_outfits(context: Dict) -> List[Dict]:
    """Return three outfit dicts (primary + 2 alternatives) matching OutfitDetail's fields."""
    gender = _gender_key(context.get("gender", ""))
    occ_key = _occasion_key(context.get("occasion", ""))
    season = context.get("season") if context.get("season") in SEASONS else "Mild"
    prefs = context.get("user_preferences") or context.get("preferences") or ""
    palette = palette_from_preferences(prefs)

    order = list(OCCASION_ORDER[occ_key][gender])
    chosen = _match_garment(context.get("desired_garment") or "", gender)
    if chosen:
        order = [chosen] + [g for g in order if g != chosen]
    for label in [label for (g, label) in CATALOGUE if g == gender]:  # top up if an occasion has < 3 options
        if label not in order:
            order.append(label)

    outfits = []
    for i, label in enumerate(order[:3]):
        spec = CATALOGUE[(gender, label)]
        colours = outfit_colours(palette, i) if palette else list(spec["default"])
        fabric = spec["fabric"][season]
        outfits.append(dict(
            clothing_type=_fill(spec["type"], colours),
            silhouette=_fill(spec["silhouette"], colours),
            colors=colours,
            fabric=fabric,
            embroidery_or_pattern=_fill(spec["motif"], colours),
            accessories=[_fill(a, colours) for a in spec["acc"]],
            footwear=_fill(spec["shoes"], colours),
            hairstyle=spec["hair"],
            makeup=spec["groom"],
            styling_tips=[_fill(t, colours) for t in spec["tips"]],
            rationale=(f"A {label.lower()} suits a {context.get('occasion', 'special')} occasion. "
                       f"{fabric} keeps it comfortable for {season.lower()} weather"
                       + (f", and the {' and '.join(colours[:2]).lower()} palette follows your colour choice."
                          if palette else f", finished in classic {' and '.join(colours[:2]).lower()}.")),
        ))
    return outfits
