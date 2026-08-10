import base64

svg_xml = '''<svg viewBox="0 0 600 800" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="garmentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#090d16"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  
  <rect width="600" height="800" fill="url(#bgGrad)" rx="16"/>
  <circle cx="300" cy="300" r="220" fill="#1e3a8a" opacity="0.15"/>
  
  <g stroke="#d97706" stroke-width="2" fill="none" opacity="0.4">
    <ellipse cx="300" cy="140" rx="35" ry="48"/>
    <path d="M 300 188 L 300 230"/>
  </g>
  
  <path d="M 230 230 Q 300 210 370 230 L 390 480 Q 300 520 210 480 Z" fill="url(#garmentGrad)" stroke="#d97706" stroke-width="2.5"/>
  <path d="M 270 230 L 300 320 L 330 230" fill="none" stroke="url(#accentGrad)" stroke-width="4"/>
  <path d="M 230 230 L 270 320 M 370 230 L 330 320" stroke="url(#accentGrad)" stroke-width="3"/>
  
  <path d="M 245 480 L 230 720 L 285 720 L 295 490" fill="url(#garmentGrad)" stroke="#374151" stroke-width="1.5"/>
  <path d="M 305 490 L 315 720 L 370 720 L 355 480" fill="url(#garmentGrad)" stroke="#374151" stroke-width="1.5"/>
  
  <circle cx="300" cy="350" r="4" fill="#d97706"/>
  <circle cx="300" cy="390" r="4" fill="#d97706"/>
  <circle cx="300" cy="430" r="4" fill="#d97706"/>
  
  <rect x="30" y="730" width="280" height="36" rx="8" fill="#1e293b" opacity="0.95" stroke="#d97706" stroke-width="1"/>
  <text x="45" y="753" fill="#f59e0b" font-family="sans-serif" font-size="13" font-weight="bold">✨ Gemini AI Fashion Illustration</text>
</svg>'''

b64_str = base64.b64encode(svg_xml.encode('utf-8')).decode('utf-8')
data_url = f"data:image/svg+xml;base64,{b64_str}"

print("Generated Base64 Data URL length:", len(data_url))
print("Starts with data:image/svg+xml;base64,?:", data_url.startswith("data:image/svg+xml;base64,"))
