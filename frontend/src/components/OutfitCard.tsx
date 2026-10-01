import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import type { OutfitDetail } from '../types';
import {
  Sparkles, Feather, Scissors, Check, Heart, Lightbulb, Compass, ExternalLink, Maximize2, X, Wand2,
  Loader2, Footprints, Brush, Gem, PenTool, Image as ImageIcon, ScanFace,
} from 'lucide-react';
import { OutfitVisual } from './illustrations/OutfitVisual';
import { garmentKindFromText } from './illustrations/GarmentIllustration';
import { modelPhotoForKind } from '../data/modelPhotos';
import { VirtualTryOn } from './VirtualTryOn';
import { colorNameToHex } from '../lib/colors';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface OutfitCardProps {
  outfit: OutfitDetail;
  title: string;
  isPrimary?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (outfit: OutfitDetail) => void;
  gender?: string;
  /** The backend is still rendering an AI photo for this outfit */
  imagePending?: boolean;
}

const Spec: React.FC<{ icon: React.ElementType; label: string; tint: string; children: React.ReactNode }> = ({ icon: Icon, label, tint, children }) => (
  <div className="rounded-xl bg-gray-950/40 border border-white/5 p-3.5">
    <div className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-semibold mb-1.5 ${tint}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
    <p className="text-sm text-gray-200 leading-snug">{children}</p>
  </div>
);

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit: initialOutfit,
  title,
  isPrimary = false,
  isFavorite = false,
  onToggleFavorite,
  gender = 'Male',
  imagePending = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateFailed, setGenerateFailed] = useState(false);
  const [sketchOverride, setSketchOverride] = useState<string>('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const onPhotoState = useCallback((v: boolean) => setHasPhoto(v), []);

  const outfit: OutfitDetail = sketchOverride ? { ...initialOutfit, image_url: sketchOverride } : initialOutfit;
  const photoSrc = outfit.image_url || outfit.sketch_url || '';

  const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(
    `${gender} ${outfit.clothing_type} ${outfit.fabric} fashion style`
  )}`;

  const handleGeneratePhoto = async () => {
    setIsGenerating(true);
    setGenerateFailed(false);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-sketch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clothing_type: outfit.clothing_type,
          silhouette: outfit.silhouette,
          colors: outfit.colors,
          fabric: outfit.fabric,
          embroidery: outfit.embroidery_or_pattern,
          gender,
        }),
      });
      const data = response.ok ? await response.json() : null;
      if (data?.sketch_url) setSketchOverride(data.sketch_url);
      else setGenerateFailed(true);
    } catch (err) {
      console.error('AI photo generation failed', err);
      setGenerateFailed(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const showPending = imagePending && !hasPhoto;
  // The photo currently on the card: the AI photo, or the closest reference model photo while it renders
  const tryOnSource = hasPhoto ? photoSrc : modelPhotoForKind(gender, garmentKindFromText(outfit.clothing_type, gender));

  return (
    <article
      className={`rounded-3xl overflow-hidden transition-all duration-300 ${
        isPrimary
          ? 'glass-panel ring-1 ring-amber-400/30 shadow-2xl shadow-amber-500/5'
          : 'glass-card shadow-xl hover:ring-1 hover:ring-white/10'
      }`}
    >
      <div className={isPrimary ? 'grid lg:grid-cols-[400px_minmax(0,1fr)]' : ''}>
        {/* ================= VISUAL ================= */}
        <div className={`relative flex flex-col bg-[#2a2b2f] ${isPrimary ? 'lg:h-full ' : ''}${isPrimary ? 'lg:border-r border-b lg:border-b-0' : 'border-b'} border-white/5`}>
          <button
            type="button"
            onClick={() => hasPhoto && setIsModalOpen(true)}
            className={`group flex items-center justify-center w-full ${isPrimary ? 'h-[560px] lg:h-auto lg:flex-1 lg:min-h-[560px]' : 'h-[460px]'} pt-12 pb-3 ${hasPhoto ? 'cursor-zoom-in' : 'cursor-default'}`}
            aria-label={hasPhoto ? 'View full-size photo' : undefined}
          >
            <OutfitVisual
              outfit={outfit}
              gender={gender}
              pending={showPending}
              onPhotoState={onPhotoState}
              className="w-full h-full p-6"
              imgClassName="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </button>

          {/* top-left badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {isPrimary && (
              <span className="bg-gradient-to-r from-amber-400 to-rose-500 text-gray-950 font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Sparkles className="w-3.5 h-3.5" /> Top pick
              </span>
            )}
          </div>

          {/* favourite */}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(initialOutfit)}
              className={`absolute top-4 right-4 p-2.5 rounded-full border backdrop-blur-md transition cursor-pointer print:hidden ${
                isFavorite ? 'bg-rose-500/25 border-rose-400 text-rose-300' : 'bg-gray-950/60 border-white/10 text-gray-300 hover:text-rose-300'
              }`}
              title={isFavorite ? 'Saved to Wardrobe' : 'Save to Wardrobe'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          )}

          {/* virtual try-on */}
          <div className="px-4 pt-1 pb-3 print:hidden">
            <button
              type="button"
              onClick={() => setTryOnOpen(true)}
              disabled={!tryOnSource}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-500/20 hover:brightness-110 transition cursor-pointer disabled:opacity-50"
            >
              <ScanFace className="w-4 h-4" /> Virtual Try-On
            </button>
          </div>

          {/* bottom caption */}
          <div className="flex items-center justify-between gap-2 text-[11px] bg-gray-950/60 px-4 py-2.5 border-t border-white/5 print:hidden">
            <span className="flex items-center gap-1.5 text-gray-300 min-w-0">
              {hasPhoto ? <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <PenTool className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              <span className="truncate">
                {hasPhoto ? 'AI model photo' : showPending ? 'Reference look · AI photo on the way…' : 'Reference look'}
              </span>
              {showPending && <Loader2 className="w-3 h-3 animate-spin text-amber-400 shrink-0" />}
            </span>
            <span className="flex items-center gap-3 shrink-0">
              {hasPhoto && (
                <button onClick={() => setIsModalOpen(true)} className="text-cyan-300 hover:text-cyan-200 flex items-center gap-1 font-semibold cursor-pointer">
                  <Maximize2 className="w-3 h-3" /> Zoom
                </button>
              )}
              <a href={pinterestUrl} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:text-amber-200 flex items-center gap-1 font-semibold">
                Inspiration <ExternalLink className="w-3 h-3" />
              </a>
            </span>
          </div>
        </div>

        {/* ================= DETAILS ================= */}
        <div className={`${isPrimary ? 'p-6 sm:p-8' : 'p-5 sm:p-6'} space-y-6`}>
          <header>
            <span className="text-[11px] uppercase font-semibold tracking-[0.16em] text-amber-400">{title}</span>
            <h3 className={`font-serif-fashion font-bold mt-1 text-gray-50 ${isPrimary ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
              {outfit.clothing_type}
            </h3>
            <p className="text-sm text-gray-400 mt-2 flex items-start gap-1.5">
              <Compass className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{outfit.silhouette}</span>
            </p>
          </header>

          {/* Palette with real swatches */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-500 mb-2">Color palette</div>
            <div className="flex flex-wrap gap-2">
              {outfit.colors.map((color, i) => (
                <span key={i} className="flex items-center gap-2 rounded-full bg-gray-950/50 border border-white/5 pl-1 pr-3 py-1">
                  <span className="w-6 h-6 rounded-full ring-2 ring-white/10" style={{ background: colorNameToHex(color) }} />
                  <span className="text-xs text-gray-200">{color}</span>
                </span>
              ))}
            </div>
          </div>

          <div className={`grid gap-3 ${isPrimary ? 'sm:grid-cols-2' : ''}`}>
            <Spec icon={Feather} label="Fabric" tint="text-rose-300">{outfit.fabric}</Spec>
            <Spec icon={Scissors} label="Embroidery & motifs" tint="text-purple-300">{outfit.embroidery_or_pattern}</Spec>
            <Spec icon={Footprints} label="Footwear" tint="text-cyan-300">{outfit.footwear}</Spec>
            <Spec icon={Brush} label="Hair & grooming" tint="text-emerald-300">
              {outfit.hairstyle}
              <span className="block text-gray-400 text-xs mt-1">{outfit.makeup}</span>
            </Spec>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5 text-amber-400" /> Accessories
            </div>
            <div className="flex flex-wrap gap-1.5">
              {outfit.accessories.map((acc, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-400/5 text-amber-100/90 text-xs border border-amber-400/15">{acc}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Styling tips
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              {outfit.styling_tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <blockquote className="border-l-2 border-amber-400/60 bg-amber-400/5 rounded-r-xl px-4 py-3 text-sm text-gray-300 italic leading-relaxed">
            {outfit.rationale}
          </blockquote>

          {!hasPhoto && !showPending && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-white/10 p-3.5 print:hidden">
              <span className="text-xs text-gray-400">
                {generateFailed ? "Couldn't create a photo. Check the image API key in backend/.env." : 'Want a photo of a model wearing this outfit?'}
              </span>
              <button
                onClick={handleGeneratePhoto}
                disabled={isGenerating}
                className="py-2 px-3.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {isGenerating ? 'Generating…' : 'Generate AI photo'}
              </button>
            </div>
          )}
        </div>
      </div>

      <VirtualTryOn open={tryOnOpen} onClose={() => setTryOnOpen(false)} outfit={outfit} outfitImageSrc={tryOnSource} />

      {/* ================= LIGHTBOX ================= */}
      {isModalOpen && photoSrc && createPortal(
        <div className="fixed inset-0 z-50 bg-gray-950/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-serif-fashion font-bold text-lg text-gray-100 truncate">{outfit.clothing_type}</h4>
                <p className="text-xs text-amber-400 truncate">{gender} • {outfit.fabric}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={photoSrc} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1">
                  Open original <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-950">
              <img src={photoSrc} alt={outfit.clothing_type} className="max-w-full max-h-[75vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      , document.body)}
    </article>
  );
};
