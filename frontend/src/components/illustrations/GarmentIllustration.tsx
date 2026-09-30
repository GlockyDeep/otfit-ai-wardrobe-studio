import React, { useId } from 'react';
import { shade } from '../../lib/colors';
import { HumanBody, HumanDefs, HumanHairBack, HumanHead } from './HumanFigure';

/**
 * Flat fashion-croquis illustrations drawn in pure SVG.
 * No network images → nothing can break, and every garment can be recoloured
 * with the palette the AI recommends.
 */

export type GarmentKind =
  | 'saree' | 'lehenga' | 'anarkali' | 'sharara' | 'kurta-f' | 'dress' | 'pantsuit-f'
  | 'suit' | 'tuxedo' | 'vestsuit' | 'sherwani' | 'bandhgala' | 'nehru' | 'veshti'
  | 'kurta-m' | 'shirt' | 'polo' | 'coord';

export type Figure = 'female' | 'male' | 'neutral';

export type Climate = 'Summer' | 'Winter' | 'Monsoon' | 'Mild';
export type Texture = 'silk' | 'cotton' | 'light' | 'velvet' | 'linen' | 'embroidered' | 'zari' | 'sheer';

/** Map the fabric preference chips to a texture overlay */
export const TEXTURE_FROM_TAG: Record<string, Texture> = {
  'Silk preferred': 'silk', 'Cotton only': 'cotton', 'Lightweight fabrics': 'light',
  'Velvet & rich textures': 'velvet', 'Linen & breathable': 'linen', 'Embroidered details': 'embroidered',
  'Zari work': 'zari', 'Sheer overlays': 'sheer',
};

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
}


export const DEFAULT_PALETTES: Record<GarmentKind, Palette> = {
  saree: { primary: '#9b111e', secondary: '#d4a73a', accent: '#e8c36a' },
  lehenga: { primary: '#047857', secondary: '#9b111e', accent: '#d4a73a' },
  anarkali: { primary: '#6b2fa0', secondary: '#f2c4c9', accent: '#d4a73a' },
  sharara: { primary: '#d9728a', secondary: '#f4ecd8', accent: '#d4a73a' },
  'kurta-f': { primary: '#0f766e', secondary: '#f4ecd8', accent: '#e8c36a' },
  dress: { primary: '#1f4fb8', secondary: '#f5f5f2', accent: '#e8c36a' },
  'pantsuit-f': { primary: '#33363b', secondary: '#f4ecd8', accent: '#d4a73a' },
  suit: { primary: '#1e2a5a', secondary: '#f5f5f2', accent: '#9b111e' },
  tuxedo: { primary: '#15151a', secondary: '#f5f5f2', accent: '#15151a' },
  vestsuit: { primary: '#56606b', secondary: '#6d1a36', accent: '#d4a73a' },
  sherwani: { primary: '#efe3c6', secondary: '#9b111e', accent: '#d4a73a' },
  bandhgala: { primary: '#1e2a5a', secondary: '#f4ecd8', accent: '#d4a73a' },
  nehru: { primary: '#6d1a36', secondary: '#f4ecd8', accent: '#d4a73a' },
  veshti: { primary: '#f5f5f2', secondary: '#f1ece1', accent: '#d4a73a' },
  'kurta-m': { primary: '#efe3c6', secondary: '#f5f5f2', accent: '#d4a73a' },
  shirt: { primary: '#7fb8e6', secondary: '#b8a67a', accent: '#6b4428' },
  polo: { primary: '#1f5135', secondary: '#d8c3a0', accent: '#f5f5f2' },
  coord: { primary: '#c05a3c', secondary: '#c05a3c', accent: '#f4ecd8' },
};

export const DEFAULT_FIGURE: Record<GarmentKind, Figure> = {
  saree: 'female', lehenga: 'female', anarkali: 'female', sharara: 'female', 'kurta-f': 'female',
  dress: 'female', 'pantsuit-f': 'female', suit: 'male', tuxedo: 'male', vestsuit: 'male',
  sherwani: 'male', bandhgala: 'male', nehru: 'male', veshti: 'male', 'kurta-m': 'male',
  shirt: 'male', polo: 'male', coord: 'neutral',
};

/** Resolve free text ("Banarasi Silk Lehenga Choli with ...") to an illustration kind */
export function garmentKindFromText(text: string, gender: string = 'Female'): GarmentKind {
  const t = text.toLowerCase();
  const female = gender === 'Female';
  const rules: [RegExp, GarmentKind][] = [
    [/sherwani|achkan/, 'sherwani'],
    [/tuxedo|dinner jacket/, 'tuxedo'],
    [/3-piece|three[- ]piece|vest suit|waistcoat/, 'vestsuit'],
    [/bandhgala|jodhpuri|prince coat/, 'bandhgala'],
    [/nehru|modi jacket|bundi/, 'nehru'],
    [/veshti|panche|dhoti|mundu|angavastram|lungi/, 'veshti'],
    [/anarkali|gown|frock/, 'anarkali'],
    [/sharara|gharara|palazzo/, 'sharara'],
    [/lehenga|ghagra|chaniya/, 'lehenga'],
    [/saree|sari\b/, 'saree'],
    [/pant suit|pantsuit|skirt suit|pant-suit/, 'pantsuit-f'],
    [/co-ord|coord|co ord|matching set/, 'coord'],
    [/kurta|kurti|salwar|pathani/, female ? 'kurta-f' : 'kurta-m'],
    [/suit|blazer|jacket/, female ? 'pantsuit-f' : 'suit'],
    [/polo|t-shirt|tee/, 'polo'],
    [/dress|midi|maxi|slip/, 'dress'],
    [/shirt|chino|denim|jeans|trouser/, 'shirt'],
  ];
  for (const [re, kind] of rules) if (re.test(t)) return kind;
  return female ? 'anarkali' : gender === 'Male' ? 'kurta-m' : 'coord';
}

interface Props {
  kind: GarmentKind;
  palette?: Partial<Palette>;
  figure?: Figure;
  className?: string;
  /** Draw soft backdrop halo + floor shadow */
  backdrop?: boolean;
  /** Decorative outline around the whole figure */
  outline?: boolean;
  /** Adds weather layers: sun, winter shawl + snow, umbrella + rain, petals */
  climate?: Climate;
  /** Fabric texture drawn over the main garment colour */
  texture?: Texture;
  /** Style moods, e.g. 'Regal' adds a necklace, 'Glamorous' adds sparkles */
  moods?: string[];
}

export const GarmentIllustration: React.FC<Props> = ({
  kind, palette, figure, className, backdrop = true, outline = true, climate, texture, moods = [],
}) => {
  const uid = useId().replace(/:/g, '');
  const pal: Palette = { ...DEFAULT_PALETTES[kind], ...palette };
  const fig = figure ?? DEFAULT_FIGURE[kind];
  const { primary: p, secondary: s, accent: a } = pal;
  const pD = shade(p, -0.28);
  const sD = shade(s, -0.22);
  const gP = `gp-${uid}`;
  const gS = `gs-${uid}`;
  const halo = `halo-${uid}`;
  const gBase = `gb-${uid}`;
  const tex = `tx-${uid}`;
  const ol = `ol-${uid}`;
  const haloColor = climate === 'Summer' ? '#f59e0b' : climate === 'Winter' ? '#7dd3fc' : climate === 'Monsoon' ? '#2dd4bf' : climate === 'Mild' ? '#a3e635' : p;
  const hasMood = (...m: string[]) => m.some(x => moods.includes(x));

  // ---------- reusable parts ----------
  const body = <HumanBody fig={fig} uid={uid} />;
  const head = <HumanHead fig={fig} uid={uid} accent={a} />;

  const longSleeves = (fill: string) => (
    <>
      <path d="M34,27 L28,31 L23.5,69 L30,71 L36,42 Z" fill={fill} />
      <path d="M66,27 L72,31 L76.5,69 L70,71 L64,42 Z" fill={fill} />
    </>
  );
  const shortSleeves = (fill: string) => (
    <>
      <path d="M34,27 L27.5,32 L29.5,41 L36,37 Z" fill={fill} />
      <path d="M66,27 L72.5,32 L70.5,41 L64,37 Z" fill={fill} />
    </>
  );
  const torso = (bottom: number, fill: string, flare = 0) => (
    <path d={`M45,24 Q50,28 55,24 L66,27 L64,44 L${63 + flare},${bottom} L${37 - flare},${bottom} L36,44 L34,27 Z`} fill={fill} />
  );
  const blouse = (fill: string) => (
    <path d="M45,24 Q50,30 55,24 L66,27 L64,40 Q62,47 60,48 L40,48 Q38,47 36,40 L34,27 Z" fill={fill} />
  );
  const trousers = (fill: string, top = 60) => (
    <>
      <path d={`M39,${top} L61,${top} L63,132 L53.5,132 L50,76 L46.5,132 L37,132 Z`} fill={fill} />
      <path d="M50,76 L50,68" stroke={shade(fill, -0.3)} strokeWidth="0.6" />
    </>
  );
  const churidar = (fill: string, top = 60) => (
    <>
      <path d={`M40,${top} L60,${top} L57,132 L51.5,132 L50,82 L48.5,132 L43,132 Z`} fill={fill} />
      {[122, 125, 128].map(y => (
        <g key={y} stroke={shade(fill, -0.25)} strokeWidth="0.5">
          <path d={`M43.3,${y} L48.7,${y + 0.6}`} />
          <path d={`M51.3,${y + 0.6} L56.7,${y}`} />
        </g>
      ))}
    </>
  );
  const shoes = (fill: string) => (
    <>
      <path d="M37,132 L46.5,132 L47,135 L35,135 Q35,133 37,132 Z" fill={fill} />
      <path d="M53.5,132 L63,132 Q65,133 65,135 L53,135 Z" fill={fill} />
    </>
  );
  const juttis = (fill: string) => (
    <>
      <path d="M42,132 L48.5,132 L49,134.5 L40,134.5 Q40,132.8 42,132 Z" fill={fill} />
      <path d="M51.5,132 L58,132 Q60,132.8 60,134.5 L51,134.5 Z" fill={fill} />
    </>
  );
  const buttons = (ys: number[], fill: string, x = 50) => ys.map(y => <circle key={y} cx={x} cy={y} r="0.9" fill={fill} />);
  const mandarin = (fill: string) => <path d="M45,21.5 L55,21.5 L55.5,25 Q50,27 44.5,25 Z" fill={fill} />;
  const shirtV = (fill: string) => <path d="M45,24 L50,40 L55,24 Q50,26.5 45,24 Z" fill={fill} />;
  const necktie = (fill: string) => <path d="M49,26 L51,26 L52,37 L50,41 L48,37 Z" fill={fill} />;
  const bowtie = (fill: string) => <path d="M46.5,26 L50,27.6 L53.5,26 L53.5,29.4 L50,27.8 L46.5,29.4 Z" fill={fill} />;

  // ---------- climate layers ----------
  const climateBack = (() => {
    switch (climate) {
      case 'Summer':
        return (
          <g>
            <circle cx="86" cy="16" r="11" fill="#fbbf24" opacity="0.18" />
            <circle cx="86" cy="16" r="5.5" fill="#fbbf24" opacity="0.9" />
            {Array.from({ length: 8 }, (_, i) => {
              const ang = (i * Math.PI) / 4;
              return <path key={i} d={`M${86 + Math.cos(ang) * 7.5},${16 + Math.sin(ang) * 7.5} L${86 + Math.cos(ang) * 10},${16 + Math.sin(ang) * 10}`} stroke="#fbbf24" strokeWidth="0.9" strokeLinecap="round" />;
            })}
          </g>
        );
      case 'Winter':
        return (
          <g fill="#e0f2fe">
            {[[8, 20], [16, 48], [6, 80], [14, 108], [90, 34], [84, 62], [93, 92], [86, 118], [22, 8], [78, 10]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.3 : 0.8} opacity={0.55 + (i % 3) * 0.15} />
            ))}
          </g>
        );
      case 'Monsoon':
        return (
          <g>
            <path d="M4,14 Q4,7 11,8 Q13,2 20,5 Q26,3 27,10 Q32,11 30,15 Z" fill="#94a3b8" opacity="0.55" />
            <g stroke="#7dd3fc" strokeWidth="0.45" strokeLinecap="round" opacity="0.6">
              {[[8, 22], [15, 34], [6, 50], [13, 66], [9, 88], [16, 104], [88, 60], [94, 76], [86, 92], [93, 110], [20, 20], [4, 118]].map(([x, y], i) => (
                <path key={i} d={`M${x},${y} L${x - 1.6},${y + 5}`} />
              ))}
            </g>
            <ellipse cx="50" cy="136.5" rx="28" ry="2.2" fill="#38bdf8" opacity="0.25" />
          </g>
        );
      case 'Mild':
        return (
          <g>
            {([[10, 30, '#a3e635', 30], [88, 46, '#f9a8d4', -20], [14, 76, '#f9a8d4', 60], [90, 100, '#a3e635', -40], [20, 112, '#bef264', 15]] as const).map(([x, y, c, r], i) => (
              <ellipse key={i} cx={x} cy={y} rx="2.4" ry="1.1" fill={c} opacity="0.75" transform={`rotate(${r} ${x} ${y})`} />
            ))}
          </g>
        );
      default:
        return null;
    }
  })();

  const climateFront = (() => {
    if (climate === 'Winter') {
      const shawl = shade(s === p ? a : s, -0.35);
      return (
        <g>
          <path d="M33,25.5 Q50,41 67,25.5 L71,30 L68,84 L61.5,84 L63,35 Q50,47 37,35 L38.5,84 L32,84 L29,30 Z" fill={shawl} opacity="0.95" />
          <path d="M37,35 Q50,47 63,35" stroke={a} strokeWidth="0.8" fill="none" />
          <g stroke={a} strokeWidth="0.5">
            {[32.8, 34.4, 36, 37.6, 62.3, 63.9, 65.5, 67.1].map(x => <path key={x} d={`M${x},84 L${x},87`} />)}
          </g>
        </g>
      );
    }
    if (climate === 'Monsoon') {
      return (
        <g>
          <path d="M84.5,42 L75.5,72.5 Q74.8,75 72.8,74" stroke="#3a2416" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          <path d="M70,42 Q84.5,24 99,42 Q95.4,39 91.8,42 Q88.2,39 84.5,42 Q80.8,39 77.2,42 Q73.6,39 70,42 Z" fill={a} />
          <path d="M84.5,42 L84.5,28.5 M77.2,42 Q80,32 84.5,28.5 M91.8,42 Q89,32 84.5,28.5" stroke={shade(a, -0.3)} strokeWidth="0.4" fill="none" />
        </g>
      );
    }
    return null;
  })();

  const moodFront = (
    <g>
      {hasMood('Regal', 'Old-money', 'Glamorous') && (
        <g>
          <path d="M45.5,24.6 Q50,32 54.5,24.6" stroke={a} strokeWidth="0.8" fill="none" />
          <circle cx="50" cy="29.8" r="1.2" fill={a} stroke={shade(a, -0.3)} strokeWidth="0.3" />
        </g>
      )}
      {hasMood('Glamorous', 'Maximalist', 'Romantic') &&
        [[22, 26, 1.6], [80, 58, 1.2], [18, 96, 1.1], [83, 110, 1.5], [76, 22, 0.9]].map(([x, y, r], i) => (
          <path key={i} d={`M${x},${y - 3 * r} L${x + r * 0.6},${y - r * 0.6} L${x + 3 * r},${y} L${x + r * 0.6},${y + r * 0.6} L${x},${y + 3 * r} L${x - r * 0.6},${y + r * 0.6} L${x - 3 * r},${y} L${x - r * 0.6},${y - r * 0.6} Z`} fill="#fde68a" opacity="0.85" />
        ))}
    </g>
  );

  const textureTile = (() => {
    switch (texture) {
      case 'silk': return <path d="M-1,7 L7,-1 M-1,3 L3,-1" stroke="#fff" strokeOpacity="0.16" strokeWidth="0.6" />;
      case 'velvet': return <rect width="6" height="6" fill="#000" opacity="0.22" />;
      case 'embroidered': return <circle cx="3" cy="3" r="0.65" fill={a} opacity="0.9" />;
      case 'zari': return <path d="M-1,5 L5,-1" stroke={a} strokeOpacity="0.55" strokeWidth="0.9" />;
      case 'cotton':
      case 'linen': return <path d="M0,1 H6 M0,4 H6 M1,0 V6 M4,0 V6" stroke="#000" strokeOpacity="0.12" strokeWidth="0.35" />;
      case 'sheer': return <><rect width="3" height="3" fill="#fff" opacity="0.14" /><rect x="3" y="3" width="3" height="3" fill="#fff" opacity="0.14" /></>;
      case 'light': return <rect width="6" height="6" fill="#fff" opacity="0.14" />;
      default: return null;
    }
  })();

  const renderGarment = () => {
    switch (kind) {
      case 'saree':
        return (
          <>
            {blouse(s)}
            {shortSleeves(s)}
            <path d="M34,27 L29.5,31 L31,84 L38.5,80 L37,40 Z" fill={pD} />
            <path d="M40,56 L60,56 Q64,95 65,133 L35,133 Q36,95 40,56 Z" fill={`url(#${gP})`} />
            {[[46, 44], [50, 50], [54, 56]].map(([x1, x2]) => (
              <path key={x1} d={`M${x1},82 L${x2},133`} stroke={pD} strokeWidth="0.7" />
            ))}
            <path d="M35.2,129 L64.8,129" stroke={a} strokeWidth="3" />
            <path d="M36,25.5 L44,23.5 L65,63 L57.5,67 Z" fill={p} opacity="0.94" />
            <path d="M44,23.5 L65,63" stroke={a} strokeWidth="1.6" />
            <path d="M36,25.5 L57.5,67" stroke={a} strokeWidth="0.8" />
            {juttis(a)}
          </>
        );
      case 'lehenga':
        return (
          <>
            {blouse(s)}
            {shortSleeves(s)}
            <path d="M40,55 L60,55 Q70,95 83,132 Q50,139 17,132 Q30,95 40,55 Z" fill={`url(#${gP})`} />
            <path d="M19.5,127 Q50,134 80.5,127" stroke={a} strokeWidth="3.2" fill="none" />
            <path d="M40,55 L60,55" stroke={a} strokeWidth="1.6" />
            {[[44, 30], [50, 50], [56, 70]].map(([x1, x2]) => (
              <path key={x1} d={`M${x1},62 Q${(x1 + x2) / 2},100 ${x2},130`} stroke={pD} strokeWidth="0.6" fill="none" />
            ))}
            {[[32, 110], [50, 118], [68, 110], [41, 92], [59, 92]].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" fill={a} />
            ))}
            <path d="M33,26 L39,24 L69,86 L63,90 Z" fill={a} opacity="0.45" />
            <path d="M66,27 L72,31 L74,100 L68,98 Z" fill={a} opacity="0.35" />
          </>
        );
      case 'anarkali':
        return (
          <>
            {churidar(sD, 108)}
            {torso(47, p)}
            {longSleeves(p)}
            <path d="M39,46 L61,46 Q73,85 81,118 Q50,125 19,118 Q27,85 39,46 Z" fill={`url(#${gP})`} />
            <path d="M21,114 Q50,121 79,114" stroke={a} strokeWidth="2.6" fill="none" />
            <path d="M39,46 L61,46" stroke={a} strokeWidth="1.8" />
            {[30, 40, 50, 60, 70].map(x => (
              <path key={x} d={`M50,48 L${x},117`} stroke={pD} strokeWidth="0.5" />
            ))}
            <path d="M45,24 Q50,31 55,24" stroke={a} strokeWidth="1.2" fill="none" />
            <path d="M24,69.5 L30.5,71" stroke={a} strokeWidth="1.4" />
            <path d="M76,69.5 L69.5,71" stroke={a} strokeWidth="1.4" />
            <path d="M34,26 L40,24 L22,100 L17,96 Z" fill={s} opacity="0.55" />
            {juttis(a)}
          </>
        );
      case 'sharara':
        return (
          <>
            <path d="M40,74 L60,74 L73,132 L52,132 L50,96 L48,132 L27,132 Z" fill={`url(#${gP})`} />
            <path d="M28,128 L48,128 M52,128 L72,128" stroke={a} strokeWidth="2.4" />
            {torso(80, p, 1)}
            {longSleeves(p)}
            <path d="M36,78 L64,78" stroke={a} strokeWidth="2" />
            <path d="M45,24 L50,34 L55,24" stroke={a} strokeWidth="1.2" fill="none" />
            {[40, 50, 60].map(y => <circle key={y} cx="50" cy={y} r="1" fill={a} />)}
            <path d="M34,26 L40,24 L66,84 L60,88 Z" fill={s} opacity="0.6" />
          </>
        );
      case 'kurta-f':
        return (
          <>
            <path d="M39,60 L61,60 L64,132 L53,132 L50,80 L47,132 L36,132 Z" fill={s} />
            {torso(104, `url(#${gP})`, 2)}
            {longSleeves(p)}
            <path d="M35,104 L65,104" stroke={a} strokeWidth="2" />
            <path d="M45,24 L50,36 L55,24" stroke={a} strokeWidth="1.3" fill="none" />
            {[50, 64, 78, 92].map(y => (
              <circle key={y} cx={y % 28 === 0 ? 44 : 56} cy={y} r="1" fill={a} />
            ))}
            <path d="M33,26 L39,24 L68,94 L62,97 Z" fill={a} opacity="0.4" />
            {juttis(a)}
          </>
        );
      case 'dress':
        return (
          <>
            <path d="M40,46 L60,46 Q67,78 72,106 Q50,111 28,106 Q33,78 40,46 Z" fill={`url(#${gP})`} />
            {torso(58, p)}
            {shortSleeves(p)}
            <path d="M45,24 L50,32 L55,24" fill={s} />
            <path d="M39,58 L61,58" stroke={a} strokeWidth="2.2" />
            <rect x="48.5" y="56.8" width="3" height="2.6" rx="0.4" fill="none" stroke={s} strokeWidth="0.6" />
            {buttons([34, 40, 46, 52], s)}
            {shoes(shade(p, -0.5))}
          </>
        );
      case 'pantsuit-f':
        return (
          <>
            {trousers(p, 58)}
            <path d="M45,24 L50,38 L55,24 Q50,26 45,24 Z" fill={s} />
            <path d="M45,24 L34,27 L36,44 L38.5,56 L37,80 L50,80 L50,38 Z" fill={`url(#${gP})`} />
            <path d="M55,24 L66,27 L64,44 L61.5,56 L63,80 L50,80 L50,38 Z" fill={`url(#${gP})`} />
            {longSleeves(p)}
            <path d="M45,24 L46.5,46 L50,38 M55,24 L53.5,46 L50,38" stroke={pD} strokeWidth="0.9" fill="none" />
            {buttons([52, 60], a)}
            <path d="M40,66 L45,66 M55,66 L60,66" stroke={pD} strokeWidth="0.8" />
            {shoes('#15151a')}
          </>
        );
      case 'suit':
      case 'tuxedo':
        return (
          <>
            {trousers(p, 60)}
            {shirtV(s)}
            {kind === 'suit' ? necktie(a) : bowtie('#15151a')}
            <path d="M45,24 L34,27 L36,44 L37,80 L50,80 L50,40 Z" fill={`url(#${gP})`} />
            <path d="M55,24 L66,27 L64,44 L63,80 L50,80 L50,40 Z" fill={`url(#${gP})`} />
            {longSleeves(p)}
            <path d="M45,24 L46.8,46 L50,40 L53.2,46 L55,24" fill={kind === 'tuxedo' ? '#26262c' : pD} />
            <path d="M24,68 L30.2,69.8 M76,68 L69.8,69.8" stroke={s} strokeWidth="1.4" />
            {buttons([54, 62], kind === 'tuxedo' ? '#3a3a42' : pD)}
            <path d="M40,64 L45.5,64 M54.5,64 L60,64" stroke={pD} strokeWidth="0.8" />
            <path d="M56,33 L60,32.5" stroke={s} strokeWidth="1.2" />
            {kind === 'tuxedo' && <path d="M38,60 L38,132 M62,60 L62,132" stroke="#2c2c34" strokeWidth="0.8" />}
            {shoes('#15151a')}
          </>
        );
      case 'vestsuit':
        return (
          <>
            {trousers(p, 60)}
            {shirtV(s === p ? '#f5f5f2' : '#f5f5f2')}
            {necktie(a)}
            <path d="M45,30 L50,40 L55,30 L56,76 L50,80 L44,76 Z" fill={s} />
            {buttons([48, 55, 62, 69], a)}
            <path d="M45,24 L34,27 L36,44 L37,82 L45,82 L45.5,48 Z" fill={`url(#${gP})`} />
            <path d="M55,24 L66,27 L64,44 L63,82 L55,82 L54.5,48 Z" fill={`url(#${gP})`} />
            {longSleeves(p)}
            <path d="M45,24 L45.5,48 L42,40 Z M55,24 L54.5,48 L58,40 Z" fill={pD} />
            <path d="M24,68 L30.2,69.8 M76,68 L69.8,69.8" stroke="#f5f5f2" strokeWidth="1.4" />
            {shoes('#3a2416')}
          </>
        );
      case 'sherwani':
        return (
          <>
            {churidar(s, 104)}
            <path d="M45,23 L34,27 L36,44 L35,110 L65,110 L64,44 L66,27 L55,23 Z" fill={`url(#${gP})`} />
            {longSleeves(p)}
            {mandarin(a)}
            <path d="M50,25 L50,110" stroke={a} strokeWidth="1.4" />
            {buttons([30, 37, 44, 51, 58, 65], shade(a, -0.2), 52.2)}
            <path d="M35,106 L65,106" stroke={a} strokeWidth="2.6" />
            <path d="M24,68 L30.2,69.8 M76,68 L69.8,69.8" stroke={a} strokeWidth="1.6" />
            {[[42, 88], [58, 88], [42, 96], [58, 96], [46, 92], [54, 92]].map(([x, y]) => (
              <circle key={`${x}${y}`} cx={x} cy={y} r="0.9" fill={a} />
            ))}
            <path d="M34,26 L40,23.5 L58,72 L52,74 Z" fill={s} opacity="0.85" />
            {juttis(a)}
          </>
        );
      case 'bandhgala':
        return (
          <>
            {trousers(s === '#f4ecd8' ? p : s, 60)}
            <path d="M45,23 L34,27 L36,44 L37,82 L63,82 L64,44 L66,27 L55,23 Z" fill={`url(#${gP})`} />
            {longSleeves(p)}
            {mandarin(pD)}
            <path d="M50,25 L50,82" stroke={pD} strokeWidth="0.8" />
            {buttons([30, 37, 44, 51, 58, 65, 72], a, 51.6)}
            <path d="M40,66 L45,66 M55,66 L60,66 M56,34 L60,33.5" stroke={pD} strokeWidth="0.8" />
            {shoes('#3a2416')}
          </>
        );
      case 'nehru':
        return (
          <>
            {churidar('#f5f5f2', 96)}
            {torso(102, s, 1)}
            {longSleeves(s)}
            <path d="M45,23 L37.5,28 L38.5,80 L61.5,80 L62.5,28 L55,23 L50,36 Z" fill={`url(#${gP})`} />
            {mandarin(pD)}
            {buttons([42, 50, 58, 66, 74], a, 51.4)}
            <path d="M42,62 L46,62 M54,62 L58,62 M55,40 L59,39.5" stroke={a} strokeWidth="0.9" />
            {juttis(a)}
          </>
        );
      case 'veshti':
        return (
          <>
            <path d="M39,60 L61,60 L64,133 L36,133 Z" fill={`url(#${gS})`} />
            <path d="M50,62 L53,133" stroke={sD} strokeWidth="0.7" />
            <path d="M52,62 L58,133" stroke={sD} strokeWidth="0.5" />
            <path d="M36.2,127.5 L63.8,127.5" stroke={a} strokeWidth="3.4" />
            <path d="M53,70 L58,133" stroke={a} strokeWidth="1.6" />
            {torso(76, p)}
            {longSleeves(p)}
            <path d="M45,24 L48,28 L50,24.5 L52,28 L55,24" stroke={shade(p, -0.15)} strokeWidth="0.8" fill="none" />
            {buttons([32, 40, 48], shade(p, -0.25))}
            <path d="M39,62 L61,62" stroke={a} strokeWidth="1.2" />
            <path d="M34,26 L41,23.5 L67,74 L61,78 Z" fill={s} />
            <path d="M34,26 L61,78" stroke={a} strokeWidth="1.3" />
            <path d="M34,27 L29,31 L31,78 L37,75 L36.5,40 Z" fill={s} />
            <path d="M31,78 L37,75" stroke={a} strokeWidth="1.5" />
            {juttis('#6b4428')}
          </>
        );
      case 'kurta-m':
        return (
          <>
            {churidar(s, 96)}
            {torso(102, `url(#${gP})`, 1.5)}
            {longSleeves(p)}
            {mandarin(pD)}
            <path d="M50,25 L50,44" stroke={pD} strokeWidth="0.8" />
            {buttons([29, 34, 39], a, 51.4)}
            <path d="M37,94 L37,102 M63,94 L63,102" stroke={pD} strokeWidth="0.7" />
            <path d="M35.5,100 L64.5,100" stroke={a} strokeWidth="1" />
            {juttis(a)}
          </>
        );
      case 'shirt':
        return (
          <>
            {trousers(s, 64)}
            {torso(66, `url(#${gP})`)}
            {longSleeves(p)}
            <path d="M45,24 L48.5,30 L50,25 L51.5,30 L55,24 Q50,26.5 45,24 Z" fill={shade(p, 0.15)} />
            <path d="M50,26 L50,66" stroke={pD} strokeWidth="0.6" />
            {buttons([32, 40, 48, 56], pD, 51)}
            <path d="M24,66 L30.4,68 M76,66 L69.6,68" stroke={pD} strokeWidth="1.2" />
            <path d="M38,64.5 L62,64.5" stroke={a} strokeWidth="2" />
            <rect x="48.3" y="63.3" width="3.4" height="2.4" fill="#c9b36a" />
            {shoes('#6b4428')}
          </>
        );
      case 'polo':
        return (
          <>
            {trousers(s, 64)}
            {torso(68, `url(#${gP})`)}
            {shortSleeves(p)}
            <path d="M28,39 L30,41.5 M72,39 L70,41.5" stroke={a} strokeWidth="1.2" />
            <path d="M45,24 L48,30 L50,26 L52,30 L55,24 Q50,26 45,24 Z" fill={a} />
            <path d="M50,26 L50,37" stroke={pD} strokeWidth="0.8" />
            {buttons([30, 34], a, 51)}
            <path d="M38,64.5 L62,64.5" stroke="#3a2416" strokeWidth="2" />
            {shoes('#f5f5f2')}
          </>
        );
      case 'coord':
        return (
          <>
            <path d="M39,62 L61,62 L66,132 L53,132 L50,80 L47,132 L34,132 Z" fill={`url(#${gP})`} />
            {torso(68, `url(#${gP})`, 2)}
            {shortSleeves(p)}
            <path d="M45,24 L50,31 L55,24" fill={a} />
            {[[42, 40], [58, 46], [44, 56], [56, 100], [44, 112], [58, 120], [42, 90]].map(([x, y]) => (
              <path key={`${x}${y}`} d={`M${x - 2},${y} Q${x},${y - 2.4} ${x + 2},${y} Q${x},${y + 2.4} ${x - 2},${y} Z`} fill={a} opacity="0.85" />
            ))}
            <path d="M35,66 L65,66" stroke={pD} strokeWidth="0.8" />
            {shoes('#f5f5f2')}
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 100 140" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={gBase} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={shade(p, 0.12)} />
          <stop offset="100%" stopColor={pD} />
        </linearGradient>
        <pattern id={tex} width="6" height="6" patternUnits="userSpaceOnUse">{textureTile}</pattern>
        <pattern id={gP} width="100" height="140" patternUnits="userSpaceOnUse">
          <rect width="100" height="140" fill={`url(#${gBase})`} />
          {texture && <rect width="100" height="140" fill={`url(#${tex})`} />}
        </pattern>
        <HumanDefs fig={fig} uid={uid} />
        <filter id={ol} x="-15%" y="-10%" width="130%" height="120%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="0.75" result="thick" />
          <feFlood floodColor="#f5deb3" floodOpacity="0.75" />
          <feComposite in2="thick" operator="in" result="edge" />
          <feMerge>
            <feMergeNode in="edge" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={gS} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={s} />
          <stop offset="100%" stopColor={sD} />
        </linearGradient>
        <radialGradient id={halo} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={haloColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={haloColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      {backdrop && (
        <>
          <ellipse cx="50" cy="66" rx="48" ry="66" fill={`url(#${halo})`} />
          <ellipse cx="50" cy="136" rx="22" ry="2.6" fill="#000" opacity="0.35" />
        </>
      )}
      {climateBack}
      <g filter={outline ? `url(#${ol})` : undefined}>
        <HumanHairBack fig={fig} uid={uid} />
        {body}
        {renderGarment()}
        {climateFront}
        {moodFront}
        {head}
      </g>
    </svg>
  );
};
