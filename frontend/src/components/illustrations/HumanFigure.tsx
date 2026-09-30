import React from 'react';

/**
 * Hand-drawn human figure (fashion-illustration style) used under every garment.
 * Landmarks match the garment layer in GarmentIllustration:
 * shoulders y≈27 (x 34–66), waist y≈58, hands y≈72–80, ankles y≈132.
 */

export type HumanFigureKind = 'female' | 'male' | 'neutral';

interface Look {
  skin: string;
  skinShade: string;
  skinLight: string;
  hair: string;
  hairLight: string;
  lips: string;
}

const LOOKS: Record<HumanFigureKind, Look> = {
  female: { skin: '#eebd9c', skinShade: '#cc9170', skinLight: '#f7d3b8', hair: '#2a1b15', hairLight: '#6b4a38', lips: '#c0404d' },
  male: { skin: '#cf9670', skinShade: '#a66f4c', skinLight: '#e2af8b', hair: '#221914', hairLight: '#5a4030', lips: '#b0705f' },
  neutral: { skin: '#e0aa86', skinShade: '#b98561', skinLight: '#f0c4a4', hair: '#3b261c', hairLight: '#7a5540', lips: '#b9606a' },
};

export const skinOf = (fig: HumanFigureKind) => LOOKS[fig];

/** Gradients the figure needs; place inside <defs> */
export const HumanDefs: React.FC<{ fig: HumanFigureKind; uid: string }> = ({ fig, uid }) => {
  const l = LOOKS[fig];
  return (
    <>
      <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={l.skinShade} />
        <stop offset="35%" stopColor={l.skin} />
        <stop offset="65%" stopColor={l.skinLight} />
        <stop offset="100%" stopColor={l.skinShade} />
      </linearGradient>
      <radialGradient id={`face-${uid}`} cx="50%" cy="42%" r="60%">
        <stop offset="0%" stopColor={l.skinLight} />
        <stop offset="70%" stopColor={l.skin} />
        <stop offset="100%" stopColor={l.skinShade} />
      </radialGradient>
      <linearGradient id={`hair-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={l.hairLight} />
        <stop offset="45%" stopColor={l.hair} />
        <stop offset="100%" stopColor={l.hair} />
      </linearGradient>
    </>
  );
};

/** Hair that sits behind the body (long hair, bob) */
export const HumanHairBack: React.FC<{ fig: HumanFigureKind; uid: string }> = ({ fig, uid }) => {
  if (fig === 'female') {
    return <path d="M42.4,10 Q40.8,2 50,1.8 Q59.2,2 57.6,10 Q58.8,20 60.6,31 Q57,33 50,33 Q43,33 39.4,31 Q41.2,20 42.4,10 Z" fill={`url(#hair-${uid})`} />;
  }
  if (fig === 'neutral') {
    return <path d="M42.6,12 Q41.6,2.4 50,2.2 Q58.4,2.4 57.4,12 L58,20 Q55,21.6 50,21.6 Q45,21.6 42,20 Z" fill={`url(#hair-${uid})`} />;
  }
  return null;
};

/** Neck, torso, arms, hands and legs — garments are drawn on top */
export const HumanBody: React.FC<{ fig: HumanFigureKind; uid: string }> = ({ fig, uid }) => {
  const l = LOOKS[fig];
  const skin = `url(#skin-${uid})`;
  const female = fig === 'female';
  return (
    <g>
      {/* legs */}
      <path d={female
        ? 'M38.6,68 L49.6,68 L48.9,96 Q48.3,104 48.1,112 Q47.9,122 47.4,131 L44,131 Q43.2,121 42.2,111 Q40,100 39.4,88 Q38.4,78 38.6,68 Z'
        : 'M38.4,68 L49.6,68 L49,98 Q48.7,106 48.4,114 Q48.1,123 47.6,131 L43.8,131 Q43,122 42,112 Q40,101 39.2,89 Q38.2,78 38.4,68 Z'} fill={skin} />
      <path d={female
        ? 'M61.4,68 L50.4,68 L51.1,96 Q51.7,104 51.9,112 Q52.1,122 52.6,131 L56,131 Q56.8,121 57.8,111 Q60,100 60.6,88 Q61.6,78 61.4,68 Z'
        : 'M61.6,68 L50.4,68 L51,98 Q51.3,106 51.6,114 Q51.9,123 52.4,131 L56.2,131 Q57,122 58,112 Q60,101 60.8,89 Q61.8,78 61.6,68 Z'} fill={skin} />
      {/* knee + calf hints */}
      <path d="M43.2,100 Q45,101.4 47,100.4 M53,100.4 Q55,101.4 56.8,100" stroke={l.skinShade} strokeWidth="0.3" fill="none" opacity="0.7" />

      {/* torso */}
      <path d={female
        ? 'M45.3,22.6 Q41.5,24.4 36.4,25.8 Q33.8,26.8 33.9,30 L35.6,43 Q37.4,51 39.8,57.5 Q37.8,63 37.4,70 L62.6,70 Q62.2,63 60.2,57.5 Q62.6,51 64.4,43 L66.1,30 Q66.2,26.8 63.6,25.8 Q58.5,24.4 54.7,22.6 Z'
        : 'M45,22.6 Q40.6,24.2 35.4,25.6 Q33.2,26.6 33.4,30 L35.4,44 Q37,52 38.8,58 Q38,64 37.6,70 L62.4,70 Q62,64 61.2,58 Q63,52 64.6,44 L66.6,30 Q66.8,26.6 64.6,25.6 Q59.4,24.2 55,22.6 Z'} fill={skin} />
      {/* neck */}
      <path d="M46.6,16 L53.4,16 L54.2,23.6 Q50,25.4 45.8,23.6 Z" fill={skin} />
      <ellipse cx="50" cy="19.6" rx="3.4" ry="1.1" fill={l.skinShade} opacity="0.55" />
      {/* collarbones */}
      <path d="M43.5,26.4 Q46.8,27.3 49.2,26.6 M50.8,26.6 Q53.2,27.3 56.5,26.4" stroke={l.skinShade} strokeWidth="0.3" fill="none" opacity="0.8" />
      <path d="M50,24.8 L50,26.4" stroke={l.skinShade} strokeWidth="0.25" opacity="0.6" />

      {/* arms: deltoid → elbow (y≈49) → wrist (y≈71) */}
      <path d="M35.2,26 Q31,27.2 30.2,31.4 Q29.2,40 28.4,48.8 Q27,59 25.2,70.8 L29.8,71.6 Q31.2,61 32.2,51.6 Q33.6,46 35.6,41 Z" fill={skin} />
      <path d="M64.8,26 Q69,27.2 69.8,31.4 Q70.8,40 71.6,48.8 Q73,59 74.8,70.8 L70.2,71.6 Q68.8,61 67.8,51.6 Q66.4,46 64.4,41 Z" fill={skin} />
      <path d="M29.6,48.6 Q30.6,49.6 31.6,49 M70.4,48.6 Q69.4,49.6 68.4,49" stroke={l.skinShade} strokeWidth="0.3" fill="none" opacity="0.7" />

      {/* hands (relaxed, fingers down, thumbs forward) */}
      <g fill={l.skin} stroke={l.skinShade} strokeWidth="0.25">
        <path d="M25.1,70.6 Q24.2,73.6 24.4,76.8 Q24.7,79.8 26.4,80.4 Q28.2,80.6 28.8,78.4 Q29.6,75.6 29.9,71.4 Z" />
        <path d="M29.4,72.8 Q31,74.4 30.4,76.6 Q29.4,76.6 28.9,74.8" />
        <path d="M74.9,70.6 Q75.8,73.6 75.6,76.8 Q75.3,79.8 73.6,80.4 Q71.8,80.6 71.2,78.4 Q70.4,75.6 70.1,71.4 Z" />
        <path d="M70.6,72.8 Q69,74.4 69.6,76.6 Q70.6,76.6 71.1,74.8" />
      </g>
      <path d="M25.6,77 L25.9,79.6 M26.9,77.4 L27.1,80.2 M74.4,77 L74.1,79.6 M73.1,77.4 L72.9,80.2" stroke={l.skinShade} strokeWidth="0.2" opacity="0.8" />
    </g>
  );
};

/** Face, front hair and facial hair — drawn last, on top of the garment */
export const HumanHead: React.FC<{ fig: HumanFigureKind; uid: string; accent: string }> = ({ fig, uid, accent }) => {
  const l = LOOKS[fig];
  const hair = `url(#hair-${uid})`;
  const browW = fig === 'male' ? 0.6 : 0.34;
  return (
    <g>
      {/* ears */}
      <ellipse cx="43.7" cy="11.6" rx="0.95" ry="1.9" fill={l.skin} stroke={l.skinShade} strokeWidth="0.2" />
      <ellipse cx="56.3" cy="11.6" rx="0.95" ry="1.9" fill={l.skin} stroke={l.skinShade} strokeWidth="0.2" />

      {/* face shape: temples → cheekbones → jaw → chin */}
      <path
        d={fig === 'male'
          ? 'M44,9.8 Q44,4.2 50,4.2 Q56,4.2 56,9.8 Q56.2,14.2 54.4,17.2 Q52.6,19.6 50,19.7 Q47.4,19.6 45.6,17.2 Q43.8,14.2 44,9.8 Z'
          : 'M44.2,9.8 Q44.2,4.3 50,4.3 Q55.8,4.3 55.8,9.8 Q55.8,14.4 53.6,17.4 Q51.9,19.4 50,19.4 Q48.1,19.4 46.4,17.4 Q44.2,14.4 44.2,9.8 Z'}
        fill={`url(#face-${uid})`}
      />

      {/* brows */}
      <path d="M45.7,9.3 Q47.2,8.4 48.9,9 M51.1,9 Q52.8,8.4 54.3,9.3" stroke={l.hair} strokeWidth={browW} strokeLinecap="round" fill="none" />
      {/* eyes */}
      {[47.35, 52.65].map(cx => (
        <g key={cx}>
          <path d={`M${cx - 1.35},11 Q${cx},10 ${cx + 1.35},11 Q${cx},11.85 ${cx - 1.35},11 Z`} fill="#fbf7f2" />
          <circle cx={cx} cy="10.95" r="0.55" fill="#4a2d1c" />
          <circle cx={cx} cy="10.95" r="0.25" fill="#120b07" />
          <circle cx={cx + 0.18} cy="10.75" r="0.12" fill="#fff" />
          <path d={`M${cx - 1.4},11 Q${cx},9.85 ${cx + 1.4},11`} stroke="#1c120d" strokeWidth={fig === 'female' ? 0.38 : 0.28} fill="none" strokeLinecap="round" />
        </g>
      ))}
      {/* nose */}
      <path d="M49.5,11.4 Q49.2,12.9 48.9,13.9" stroke={l.skinShade} strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M48.8,14.2 Q49.3,14.7 50,14.6 Q50.7,14.7 51.2,14.2" stroke={l.skinShade} strokeWidth="0.3" fill="none" strokeLinecap="round" />
      {/* cheeks */}
      {fig !== 'male' && (
        <>
          <ellipse cx="46.4" cy="14" rx="1.3" ry="0.8" fill="#e27b7b" opacity="0.18" />
          <ellipse cx="53.6" cy="14" rx="1.3" ry="0.8" fill="#e27b7b" opacity="0.18" />
        </>
      )}

      {/* facial hair (male) — short boxed beard + moustache */}
      {fig === 'male' && (
        <g fill={l.hair}>
          <path d="M44.3,12.6 Q44.6,16.4 46.8,18.6 Q48.4,19.9 50,19.9 Q51.6,19.9 53.2,18.6 Q55.4,16.4 55.7,12.6 L55.1,13.2 Q54.4,16.2 52.6,17 Q51.4,16.2 50,16.3 Q48.6,16.2 47.4,17 Q45.6,16.2 44.9,13.2 Z" opacity="0.72" />
          <path d="M47.9,15.5 Q50,14.7 52.1,15.5 Q51.2,15.9 50,15.8 Q48.8,15.9 47.9,15.5 Z" opacity="0.9" />
        </g>
      )}
      {/* lips */}
      {fig === 'male' ? (
        <path d="M48.6,16.4 Q50,16 51.4,16.4 Q50,17.2 48.6,16.4 Z" fill={l.lips} />
      ) : (
        <>
          <path d="M48.3,16.1 Q49.2,15.5 50,15.9 Q50.8,15.5 51.7,16.1 Q50,16.4 48.3,16.1 Z" fill={l.lips} />
          <path d="M48.3,16.1 Q50,16.4 51.7,16.1 Q50,17.5 48.3,16.1 Z" fill={l.lips} opacity="0.85" />
        </>
      )}

      {/* front hair */}
      {fig === 'female' && (
        <g>
          <path d="M44,11 Q43.2,3.2 50,3 Q56.8,3.2 56,11 Q55.4,6.2 51.4,5 Q47.2,5.4 44,11 Z" fill={hair} />
          {/* long strands falling over the shoulders */}
          <path d="M44.2,8.6 Q42.6,15 43.4,21 Q42.4,28 39.6,36.5 Q43,35 44.6,29.4 Q46,23.6 45.4,17.6 Q45,12.6 44.2,8.6 Z" fill={hair} />
          <path d="M55.8,8.6 Q57.4,15 56.6,21 Q57.6,28 60.4,36.5 Q57,35 55.4,29.4 Q54,23.6 54.6,17.6 Q55,12.6 55.8,8.6 Z" fill={hair} />
          <path d="M44.4,14 Q43.8,22 42,30 M55.6,14 Q56.2,22 58,30 M47,4.4 Q45,6 44.6,9" stroke={l.hairLight} strokeWidth="0.3" fill="none" opacity="0.8" />
          <circle cx="43.8" cy="14.4" r="0.55" fill={accent} />
          <circle cx="56.2" cy="14.4" r="0.55" fill={accent} />
        </g>
      )}
      {fig === 'male' && (
        <g>
          <path d="M43.9,11.2 Q43,4.6 47.6,3.2 Q51.6,1.6 55.4,3.4 Q57.4,5.4 56.1,11.2 Q55.5,7.8 53.4,7 Q50.2,6.3 46.8,7.2 Q44.6,8 43.9,11.2 Z" fill={hair} />
          <path d="M46.6,3.6 Q51.8,0.8 56.2,4.4 Q52.4,3.2 48.6,5.2 Z" fill={l.hairLight} opacity="0.8" />
          <path d="M43.9,11.2 L44.2,13.2 M56.1,11.2 L55.8,13.2" stroke={l.hair} strokeWidth="0.6" />
        </g>
      )}
      {fig === 'neutral' && (
        <g>
          <path d="M43.4,15.6 Q42.4,3 50,2.8 Q57.6,3 56.6,15.6 L55.7,15.6 Q55.8,9.6 53.8,7.2 Q49,8.2 44.6,10.6 L44.3,15.6 Z" fill={hair} />
          <path d="M47.6,3.6 Q52,4 54,7" stroke={l.hairLight} strokeWidth="0.35" fill="none" opacity="0.8" />
        </g>
      )}
    </g>
  );
};
