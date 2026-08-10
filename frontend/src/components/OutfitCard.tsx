import React, { useState } from 'react';
import type { OutfitDetail } from '../types';
import { Sparkles, Palette, Feather, Layers, Scissors, Check, Heart, Lightbulb, Compass, Image as ImageIcon, Wand2, ExternalLink, Loader2 } from 'lucide-react';

interface OutfitCardProps {
  outfit: OutfitDetail;
  title: string;
  isPrimary?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (outfit: OutfitDetail) => void;
  gender?: string;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  title,
  isPrimary = false,
  isFavorite = false,
  onToggleFavorite,
  gender = 'Male'
}) => {
  const [sketchUrl, setSketchUrl] = useState<string | null>(outfit.sketch_url || null);
  const [isGeneratingSketch, setIsGeneratingSketch] = useState(false);
  const [sketchError, setSketchError] = useState<string | null>(null);

  const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(
    `${gender} ${outfit.clothing_type} ${outfit.fabric} fashion style`
  )}`;

  const handleGenerateSketch = async () => {
    setIsGeneratingSketch(true);
    setSketchError(null);
    try {
      const response = await fetch('http://localhost:8000/generate-sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clothing_type: outfit.clothing_type,
          silhouette: outfit.silhouette,
          colors: outfit.colors,
          fabric: outfit.fabric,
          embroidery: outfit.embroidery_or_pattern,
          gender: gender
        })
      });
      if (!response.ok) throw new Error('Sketch generation failed');
      const data = await response.json();
      setSketchUrl(data.sketch_url);
    } catch (err) {
      setSketchError('Could not generate sketch at this time.');
    } finally {
      setIsGeneratingSketch(false);
    }
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${
        isPrimary
          ? 'glass-panel border-2 border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-amber-500/5 relative overflow-hidden'
          : 'glass-card border border-gray-800 p-6 shadow-xl hover:border-gray-700'
      }`}
    >
      {/* Top badges & Favorite Toggle */}
      <div className="flex items-center justify-between mb-4 relative z-20">
        <div className="flex items-center space-x-2">
          {isPrimary && (
            <div className="bg-gradient-to-l from-amber-500 to-rose-500 text-gray-950 font-bold text-[10px] sm:text-xs px-3 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Primary Choice</span>
            </div>
          )}
        </div>

        {/* Favorite Save Button */}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(outfit)}
            className={`p-2.5 rounded-full border transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-semibold ${
              isFavorite
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/20'
                : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-rose-300 hover:border-gray-700'
            }`}
            title={isFavorite ? 'Saved to Wardrobe' : 'Save to Wardrobe'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
          </button>
        )}
      </div>

      {/* Outfit Fashion Image / AI Sketch Preview */}
      {(sketchUrl || outfit.image_url) && (
        <div className="mb-6 rounded-xl overflow-hidden relative group border border-gray-800 shadow-lg">
          <div className="h-64 sm:h-72 w-full overflow-hidden bg-gray-950 relative">
            <img
              src={sketchUrl || outfit.image_url}
              alt={outfit.clothing_type}
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />
            
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-amber-200 font-medium bg-gray-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-800/80">
              <span className="flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>{sketchUrl ? 'AI Couture Sketch' : 'High-Res Fashion Reference'}</span>
              </span>
              <a
                href={pinterestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 flex items-center space-x-1 text-[11px] font-semibold transition"
              >
                <span>Pinterest Ideas</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Action: Generate AI Sketch Button */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-gray-900/40 p-3 rounded-xl border border-gray-800/80">
        <div className="text-xs text-gray-400">
          <span>Need a custom 1-of-1 AI fashion sketch illustration?</span>
        </div>
        <button
          onClick={handleGenerateSketch}
          disabled={isGeneratingSketch}
          className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
        >
          {isGeneratingSketch ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Rendering Sketch...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              <span>{sketchUrl ? 'Re-Generate AI Sketch' : 'Generate AI Couture Sketch'}</span>
            </>
          )}
        </button>
      </div>

      {sketchError && (
        <p className="text-xs text-rose-400 mb-4 text-center">{sketchError}</p>
      )}

      {/* Header Title */}
      <div className="mb-6">
        <span className="text-xs uppercase font-semibold tracking-wider text-amber-400 block mb-1">
          {title}
        </span>
        <h3 className={`font-serif-fashion font-bold ${isPrimary ? 'text-2xl sm:text-3xl text-gray-100' : 'text-xl text-gray-200'}`}>
          {outfit.clothing_type}
        </h3>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 flex items-center space-x-1">
          <Compass className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>Cut & Silhouette: <strong className="text-gray-300 font-medium">{outfit.silhouette}</strong></span>
        </p>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs sm:text-sm">
        {/* Colors */}
        <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
          <div className="flex items-center space-x-2 text-amber-300 font-semibold mb-2">
            <Palette className="w-4 h-4" />
            <span>Color Palette</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {outfit.colors.map((color, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-gray-800 text-gray-200 text-xs font-medium border border-gray-700/80 flex items-center space-x-1"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 inline-block" />
                <span>{color}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Fabric */}
        <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
          <div className="flex items-center space-x-2 text-rose-300 font-semibold mb-1">
            <Feather className="w-4 h-4" />
            <span>Fabric & Texture</span>
          </div>
          <p className="text-gray-300 font-medium">{outfit.fabric}</p>
        </div>

        {/* Embroidery / Pattern */}
        <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
          <div className="flex items-center space-x-2 text-purple-300 font-semibold mb-1">
            <Scissors className="w-4 h-4" />
            <span>Embroidery & Motifs</span>
          </div>
          <p className="text-gray-300">{outfit.embroidery_or_pattern}</p>
        </div>

        {/* Footwear */}
        <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
          <div className="flex items-center space-x-2 text-cyan-300 font-semibold mb-1">
            <Layers className="w-4 h-4" />
            <span>Footwear</span>
          </div>
          <p className="text-gray-300">{outfit.footwear}</p>
        </div>
      </div>

      {/* Grooming & Accessories */}
      <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/80 mb-6 space-y-3 text-xs sm:text-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="text-gray-500 block text-xs">Hairstyle:</span>
            <span className="text-gray-300 font-medium">{outfit.hairstyle}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs">Makeup / Grooming:</span>
            <span className="text-gray-300 font-medium">{outfit.makeup}</span>
          </div>
        </div>

        <div>
          <span className="text-gray-500 block text-xs mb-1.5">Recommended Accessories:</span>
          <div className="flex flex-wrap gap-1.5">
            {outfit.accessories.map((acc, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-gray-900 text-gray-300 text-xs border border-gray-800">
                • {acc}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Styling Tips */}
      <div className="mb-6">
        <h4 className="text-xs uppercase font-semibold text-amber-400 mb-2 flex items-center space-x-1.5">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>Styling Tips</span>
        </h4>
        <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
          {outfit.styling_tips.map((tip, i) => (
            <li key={i} className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Fashion Rationale */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-xs sm:text-sm">
        <div className="flex items-center space-x-2 text-amber-300 font-semibold mb-1">
          <Heart className="w-4 h-4 text-amber-400" />
          <span>Design Rationale</span>
        </div>
        <p className="text-gray-300 leading-relaxed italic">{outfit.rationale}</p>
      </div>
    </div>
  );
};
