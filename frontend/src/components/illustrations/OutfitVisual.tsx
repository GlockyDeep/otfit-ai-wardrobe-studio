import React, { useEffect, useState } from 'react';
import type { OutfitDetail } from '../../types';
import { colorNameToHex } from '../../lib/colors';
import { GarmentIllustration, garmentKindFromText, type Palette } from './GarmentIllustration';
import { modelPhotoForKind } from '../../data/modelPhotos';

/** Build an illustration palette from the AI's colour names, e.g. ["Emerald Green", "Royal Gold"] */
export function paletteFromColorNames(colors: string[] = []): Partial<Palette> {
  if (colors.length === 0) return {};
  const isMetal = (c: string) => /gold|bronze|copper|silver|zari/i.test(c);
  const metal = colors.find(isMetal);
  const accent = metal ? colorNameToHex(metal) : '#d4a73a';
  const fabricHexes = colors.filter(c => !isMetal(c)).map(c => colorNameToHex(c, '')).filter(Boolean);
  if (fabricHexes.length === 0 && !metal) return {};
  const primary = fabricHexes[0] ?? accent;
  const secondary = fabricHexes[1] ?? accent;
  return { primary, secondary, accent };
}

export function genderToFigure(gender: string) {
  return gender === 'Female' ? 'female' : gender === 'Male' ? 'male' : 'neutral';
}

interface Props {
  outfit: OutfitDetail;
  gender: string;
  /** If true and there's no photo yet, shows the illustration with a subtle "rendering" shimmer */
  pending?: boolean;
  className?: string;
  imgClassName?: string;
  onPhotoState?: (hasPhoto: boolean) => void;
}

/**
 * Shows the AI model photo when one exists and loads; otherwise a recoloured
 * design illustration so the card is never empty or stuck on a spinner.
 */
export const OutfitVisual: React.FC<Props> = ({ outfit, gender, pending, className = '', imgClassName = '', onPhotoState }) => {
  const src = outfit.image_url || outfit.sketch_url || '';
  const [failed, setFailed] = useState(false);
  const [refFailed, setRefFailed] = useState(false);
  const kind = garmentKindFromText(outfit.clothing_type, gender);
  const reference = modelPhotoForKind(gender, kind);

  useEffect(() => setFailed(false), [src]);
  const hasPhoto = !!src && !failed;
  useEffect(() => onPhotoState?.(hasPhoto), [hasPhoto, onPhotoState]);

  if (hasPhoto) {
    return <img src={src} alt={outfit.clothing_type} onError={() => setFailed(true)} className={imgClassName} />;
  }

  // No AI photo (yet): show the closest real model reference photo
  if (reference && !refFailed) {
    return (
      <img
        src={reference}
        alt={`Reference look: ${outfit.clothing_type}`}
        onError={() => setRefFailed(true)}
        className={`${imgClassName} ${pending ? 'opacity-70' : ''}`}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <GarmentIllustration
        kind={kind}
        palette={paletteFromColorNames(outfit.colors)}
        figure={genderToFigure(gender)}
        className={`w-full h-full ${pending ? 'animate-pulse' : ''}`}
      />
    </div>
  );
};
