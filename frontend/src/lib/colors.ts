// Maps free-text fashion colour names (from the AI response or preference tags) to hex values
// so we can render real swatches instead of generic dots.

const COLOR_KEYWORDS: [string, string][] = [
  // Multi-word first so they win over single words
  ['neon green', '#39ff88'], ['hot pink', '#ff2fb3'], ['electric yellow', '#fff200'], ['cyan', '#00e5ff'],
  ['cornflower', '#6495ed'], ['burnt orange', '#cc5500'], ['butter yellow', '#f6e27a'], ['charcoal black', '#1c1d21'],
  ['charcoal grey', '#3f4247'], ['pure white', '#fafafa'], ['champagne beige', '#e3d3ae'],
  ['navy blue', '#1e2a5a'], ['royal blue', '#2743a6'], ['sapphire', '#1f4fb8'], ['cobalt', '#1f4ed8'],
  ['powder blue', '#a9c6e8'], ['sky blue', '#7fb8e6'], ['midnight blue', '#141b3a'], ['teal', '#0f766e'],
  ['turquoise', '#1ab5b0'], ['peacock', '#0e6f77'], ['aqua', '#5fd3d0'], ['indigo', '#3b3b98'],
  ['emerald', '#047857'], ['forest', '#1f5135'], ['bottle green', '#0f4a32'], ['olive', '#6b7333'],
  ['sage', '#9caf88'], ['mint', '#a7e3c4'], ['pista', '#b5d99c'], ['green', '#15803d'],
  ['ruby', '#9b111e'], ['crimson', '#b0142c'], ['scarlet', '#d7263d'], ['cherry', '#b3143a'],
  ['maroon', '#6b0f1a'], ['burgundy', '#6d1a36'], ['wine', '#6b1e3b'], ['oxblood', '#4a0e12'],
  ['red', '#c81e3a'], ['coral', '#f27c6b'], ['peach', '#f6b99a'], ['salmon', '#f08f7e'],
  ['blush', '#f2c4c9'], ['dusty rose', '#c98b93'], ['rose gold', '#c7897a'], ['rose', '#d9728a'],
  ['pink', '#e37fa4'], ['fuchsia', '#c0267a'], ['magenta', '#b0206f'], ['rani', '#c2185b'],
  ['amethyst', '#7b4fa0'], ['purple', '#6b2fa0'], ['plum', '#6b2d5c'], ['violet', '#7c4dbd'],
  ['lavender', '#b9a4dc'], ['lilac', '#c8a8d8'], ['mauve', '#a77a98'], ['orchid', '#b56db6'],
  ['saffron', '#f09a1a'], ['marigold', '#f2a516'], ['mustard', '#d4a017'], ['turmeric', '#e3a611'],
  ['orange', '#e8761c'], ['rust', '#b0521f'], ['terracotta', '#c05a3c'], ['copper', '#b86a3c'],
  ['bronze', '#a8753a'], ['antique gold', '#b08d3c'], ['gold', '#d4a73a'], ['mustard yellow', '#d4a017'],
  ['yellow', '#eac435'], ['lemon', '#f2e46b'], ['champagne', '#e8d3a8'], ['beige', '#d8c3a0'],
  ['sand', '#d6bf94'], ['camel', '#b88a55'], ['tan', '#b88f62'], ['khaki', '#b8a67a'],
  ['taupe', '#8b7d6b'], ['brown', '#6b4428'], ['chocolate', '#4a2c1a'], ['coffee', '#5a3a24'],
  ['ivory', '#f4ecd8'], ['cream', '#efe3c6'], ['off-white', '#f1ece1'], ['off white', '#f1ece1'],
  ['pearl', '#eae6dc'], ['white', '#f5f5f2'], ['silver', '#bfc3c9'], ['platinum', '#d8d8d4'],
  ['grey', '#7a7f87'], ['gray', '#7a7f87'], ['charcoal', '#33363b'], ['slate', '#56606b'],
  ['black', '#15151a'], ['onyx', '#111114'], ['ebony', '#1a1714'], ['denim', '#3d5a80'],
  ['navy', '#1e2a5a'], ['blue', '#2f5bb7'], ['neon', '#39ff88'], ['pastel', '#c9d6f2'],
];

export function colorNameToHex(name: string, fallback = '#b08d3c'): string {
  const n = name.toLowerCase();
  for (const [key, hex] of COLOR_KEYWORDS) {
    if (n.includes(key)) return hex;
  }
  return fallback;
}

/** Pick readable foreground (dark/light) for a background hex */
export function isLight(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export function shade(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(parseInt(h.slice(0, 2), 16) * (1 + amount));
  const g = clamp(parseInt(h.slice(2, 4), 16) * (1 + amount));
  const b = clamp(parseInt(h.slice(4, 6), 16) * (1 + amount));
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
