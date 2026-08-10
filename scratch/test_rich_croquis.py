import urllib.parse
import base64

def generate_rich_fashion_croquis(clothing_type: str, colors: list, fabric: str, gender: str, card_index: int = 0) -> str:
    primary_color = colors[0] if colors and len(colors) > 0 else "Navy Blue"
    secondary_color = colors[1] if colors and len(colors) > 1 else "Gold"
    
    color_map = {
        "navy": "#1e3a8a", "blue": "#2563eb", "black": "#0f172a", "gold": "#d97706",
        "red": "#dc2626", "crimson": "#991b1b", "maroon": "#881337", "green": "#166534",
        "emerald": "#047857", "white": "#f8fafc", "ivory": "#fef3c7", "cream": "#fffbeb",
        "pink": "#ec4899", "blush": "#fbcfe8", "peach": "#fdba74", "purple": "#7e22ce",
        "gray": "#475569", "charcoal": "#1e293b", "olive": "#3f6212", "mustard": "#ca8a04",
        "khaki": "#a3e635", "amber": "#f59e0b", "burgundy": "#7f1d1d", "beige": "#fef08a"
    }
    
    c1_hex = "#1e3a8a"
    for k, v in color_map.items():
        if k in primary_color.lower():
            c1_hex = v
            break

    c2_hex = "#d97706"
    for k, v in color_map.items():
        if k in secondary_color.lower():
            c2_hex = v
            break

    is_male = "male" in (gender or "").lower() and "female" not in (gender or "").lower()
    lower = clothing_type.lower()

    # Determine Garment Category
    is_traditional_female = any(k in lower for k in ["saree", "lehenga", "anarkali", "sharara", "garara"])
    is_traditional_male = any(k in lower for k in ["sherwani", "bandhgala", "kurta", "veshti", "panche", "dhoti", "modi", "nehru"])
    is_suit_tuxedo = any(k in lower for k in ["suit", "tuxedo", "blazer", "jacket", "coat"])

    # 1. High Fashion Female Croquis SVG
    if not is_male or is_traditional_female:
        svg_xml = f'''<svg viewBox="0 0 600 850" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad_{card_index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#050811"/>
    </linearGradient>
    <linearGradient id="primaryGrad_{card_index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1_hex}"/>
      <stop offset="100%" stop-color="#0b1329"/>
    </linearGradient>
    <linearGradient id="accentGrad_{card_index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c2_hex}"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <filter id="glow_{card_index}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="600" height="850" fill="url(#bgGrad_{card_index})" rx="16"/>
  <circle cx="300" cy="340" r="230" fill="{c1_hex}" opacity="0.12" filter="url(#glow_{card_index})"/>

  <!-- High-Fashion Female Model Croquis Silhouette -->
  <!-- Head & Hair contour -->
  <path d="M 280 110 Q 300 70 320 110 Q 330 140 320 160 Q 300 170 280 160 Z" fill="#1e293b" stroke="{c2_hex}" stroke-width="1.5" opacity="0.8"/>
  <!-- Neck & Shoulders -->
  <path d="M 293 160 L 293 195 L 240 215 L 360 215 L 307 195 L 307 160 Z" fill="#1e293b" opacity="0.6"/>
  
  <!-- High Fashion Garment Silhouette (Saree / Lehenga / Gown Drape) -->
  <!-- Fitted Bodice / Choli -->
  <path d="M 250 215 Q 300 225 350 215 L 340 310 Q 300 325 260 310 Z" fill="url(#primaryGrad_{card_index})" stroke="{c2_hex}" stroke-width="2"/>
  <!-- Sweetheart Neckline Accent -->
  <path d="M 260 215 Q 300 245 340 215" fill="none" stroke="url(#accentGrad_{card_index})" stroke-width="3"/>

  <!-- Flared Skirt / Saree Drape -->
  <path d="M 260 310 Q 300 325 340 310 L 420 730 Q 300 760 180 730 Z" fill="url(#primaryGrad_{card_index})" stroke="{c2_hex}" stroke-width="2.5"/>
  <!-- Pleat Drape Lines -->
  <path d="M 300 325 Q 290 520 270 740 M 300 325 Q 310 520 330 740 M 300 325 Q 300 520 300 745" stroke="url(#accentGrad_{card_index})" stroke-width="2" opacity="0.8"/>

  <!-- Dupatta / Pallu Flow Contour -->
  <path d="M 250 215 Q 190 350 220 550 Q 240 680 230 740" fill="none" stroke="url(#accentGrad_{card_index})" stroke-width="3.5" stroke-dasharray="6,4"/>

  <!-- Embroidery Zari Border along Hem -->
  <path d="M 180 730 Q 300 760 420 730" fill="none" stroke="url(#accentGrad_{card_index})" stroke-width="8"/>
  <circle cx="300" cy="270" r="5" fill="{c2_hex}"/>
  <circle cx="300" cy="450" r="6" fill="{c2_hex}"/>

  <!-- Caption Badge -->
  <rect x="30" y="780" width="310" height="38" rx="8" fill="#1e293b" opacity="0.95" stroke="{c2_hex}" stroke-width="1"/>
  <text x="45" y="804" fill="#f59e0b" font-family="sans-serif" font-size="13" font-weight="bold">✨ High-Fashion Couture Illustration</text>
  <text x="300" y="830" text-anchor="middle" fill="#9ca3af" font-family="serif" font-size="14" font-style="italic">{clothing_type} • {fabric or 'Silk Blend'}</text>
</svg>'''

    # 2. High Fashion Male Croquis SVG (Tailored Suit / Sherwani / Modi Vest)
    else:
        svg_xml = f'''<svg viewBox="0 0 600 850" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad_{card_index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#050811"/>
    </linearGradient>
    <linearGradient id="primaryGrad_{card_index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1_hex}"/>
      <stop offset="100%" stop-color="#080e1c"/>
    </linearGradient>
    <linearGradient id="accentGrad_{card_index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c2_hex}"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <filter id="glow_{card_index}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="600" height="850" fill="url(#bgGrad_{card_index})" rx="16"/>
  <circle cx="300" cy="340" r="230" fill="{c1_hex}" opacity="0.12" filter="url(#glow_{card_index})"/>

  <!-- Male Model Fashion Head & Collar -->
  <ellipse cx="300" cy="130" rx="32" ry="45" fill="#1e293b" stroke="{c2_hex}" stroke-width="1.5"/>
  <path d="M 290 175 L 290 205 L 230 220 L 370 220 L 310 205 L 310 175 Z" fill="#1e293b" opacity="0.6"/>

  <!-- Inner Shirt & Tie Contour -->
  <polygon points="280,220 300,290 320,220" fill="#f8fafc"/>
  <polygon points="295,220 300,320 305,220" fill="url(#accentGrad_{card_index})"/>

  <!-- Tailored Jacket / Sherwani Main Body -->
  <path d="M 230 220 Q 300 210 370 220 L 395 500 Q 300 530 205 500 Z" fill="url(#primaryGrad_{card_index})" stroke="{c2_hex}" stroke-width="2.5"/>

  <!-- Satin Lapel Contour -->
  <path d="M 230 220 L 285 350 L 300 350 L 270 220" fill="url(#accentGrad_{card_index})" opacity="0.9"/>
  <path d="M 370 220 L 315 350 L 300 350 L 330 220" fill="url(#accentGrad_{card_index})" opacity="0.9"/>

  <!-- Sleeves contour -->
  <path d="M 230 220 L 190 480 L 220 490 L 250 270" fill="url(#primaryGrad_{card_index})" stroke="#374151" stroke-width="1.5"/>
  <path d="M 370 220 L 410 480 L 380 490 L 350 270" fill="url(#primaryGrad_{card_index})" stroke="#374151" stroke-width="1.5"/>

  <!-- Trouser Legs -->
  <path d="M 235 500 L 220 740 L 280 740 L 292 515" fill="url(#primaryGrad_{card_index})" stroke="#374151" stroke-width="1.5"/>
  <path d="M 365 500 L 380 740 L 320 740 L 308 515" fill="url(#primaryGrad_{card_index})" stroke="#374151" stroke-width="1.5"/>

  <!-- Oxford Shoes contour -->
  <path d="M 215 740 Q 250 735 285 740 L 280 765 L 210 765 Z" fill="#0f172a" stroke="{c2_hex}" stroke-width="1"/>
  <path d="M 385 740 Q 350 735 315 740 L 320 765 L 390 765 Z" fill="#0f172a" stroke="{c2_hex}" stroke-width="1"/>

  <!-- Metallic Buttons / Pocket Square -->
  <rect x="330" y="290" width="25" height="6" fill="{c2_hex}" rx="1"/>
  <circle cx="300" cy="380" r="4" fill="{c2_hex}"/>
  <circle cx="300" cy="420" r="4" fill="{c2_hex}"/>
  <circle cx="300" cy="460" r="4" fill="{c2_hex}"/>

  <!-- Caption Badge -->
  <rect x="30" y="780" width="310" height="38" rx="8" fill="#1e293b" opacity="0.95" stroke="{c2_hex}" stroke-width="1"/>
  <text x="45" y="804" fill="#f59e0b" font-family="sans-serif" font-size="13" font-weight="bold">✨ High-Fashion Couture Illustration</text>
  <text x="300" y="830" text-anchor="middle" fill="#9ca3af" font-family="serif" font-size="14" font-style="italic">{clothing_type} • {fabric or 'Luxury Wool Blend'}</text>
</svg>'''

    b64_str = base64.b64encode(svg_xml.encode("utf-8")).decode("utf-8")
    return f"data:image/svg+xml;base64,{b64_str}"

test_svg = generate_rich_fashion_croquis("Tailored Flannel Shirt with Dark Wash Raw Denim", ["Navy Blue", "Gold"], "Cashmere", "Male")
print("Length of rich croquis Base64:", len(test_svg))
