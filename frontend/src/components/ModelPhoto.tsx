import React, { useEffect, useState } from 'react';
import type { SeasonOption } from '../types';

/** Background that matches the studio backdrop of the generated model photos */
export const PHOTO_BG = 'bg-[#2a2b2f]';

interface ModelPhotoProps {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}

/** Head-to-toe model photo that fades in and never shows a broken-image icon */
export const ModelPhoto: React.FC<ModelPhotoProps> = ({ src, alt, className = '', imgClassName = '', eager }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${PHOTO_BG} ${className}`}>
      {!loaded && !failed && <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-white/[0.06] to-transparent" />}
      {src && !failed && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`w-full h-full object-contain transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      )}
    </div>
  );
};

/** Animated weather layer drawn over the live-preview photo */
export const ClimateOverlay: React.FC<{ season: SeasonOption }> = ({ season }) => {
  if (season === 'Summer') {
    return (
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-300/30 blur-2xl" />
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-amber-300 shadow-[0_0_40px_12px_rgba(252,211,77,0.45)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/10 to-transparent" />
      </div>
    );
  }
  const particles = Array.from({ length: season === 'Monsoon' ? 34 : season === 'Winter' ? 26 : 12 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {season === 'Winter' && <div className="absolute inset-0 bg-gradient-to-b from-sky-200/10 to-transparent" />}
      {season === 'Monsoon' && <div className="absolute inset-0 bg-gradient-to-b from-slate-500/25 via-transparent to-cyan-500/10" />}
      {particles.map(i => {
        const left = (i * 37) % 100;
        const delay = (i * 0.37) % 4;
        const style: React.CSSProperties = { left: `${left}%`, animationDelay: `-${delay}s` };
        if (season === 'Monsoon') {
          return <span key={i} style={{ ...style, animationDuration: `${0.7 + (i % 5) * 0.12}s` }} className="absolute -top-6 w-px h-5 bg-sky-200/60 rotate-12 animate-[rainfall_1s_linear_infinite]" />;
        }
        if (season === 'Winter') {
          return <span key={i} style={{ ...style, animationDuration: `${5 + (i % 6)}s`, width: 3 + (i % 3), height: 3 + (i % 3) }} className="absolute -top-3 rounded-full bg-white/80 animate-[snowfall_6s_linear_infinite]" />;
        }
        return <span key={i} style={{ ...style, animationDuration: `${7 + (i % 5)}s` }} className={`absolute -top-3 w-2.5 h-1.5 rounded-full ${i % 2 ? 'bg-lime-300/70' : 'bg-pink-300/70'} animate-[snowfall_8s_linear_infinite]`} />;
      })}
    </div>
  );
};
