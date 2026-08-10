import React, { useState } from 'react';
import type { OutfitDetail } from '../types';
import { Sparkles, Palette, Feather, Layers, Scissors, Check, Heart, Lightbulb, Compass, Image as ImageIcon, ExternalLink, Maximize2, X, Wand2, Loader2 } from 'lucide-react';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingSketch, setIsGeneratingSketch] = useState(false);

  const initialImage = outfit.image_url || outfit.sketch_url || '';
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(initialImage);

  const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(
    `${gender} ${outfit.clothing_type} ${outfit.fabric} fashion style`
  )}`;

  const handleGenerateGeminiSketch = async () => {
    setIsGeneratingSketch(true);
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
      if (response.ok) {
        const data = await response.json();
        if (data.sketch_url) {
          setCurrentImageSrc(data.sketch_url);
        }
      }
    } catch (err) {
      console.error("Gemini sketch failed", err);
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

      {/* Outfit Fashion Reference Image */}
      {currentImageSrc && (
        <div className="mb-6 rounded-xl overflow-hidden relative group border border-gray-800 shadow-lg bg-gray-950">
          <div
            onClick={() => setIsModalOpen(true)}
            className="w-full min-h-[360px] max-h-[480px] overflow-hidden bg-gray-950 relative flex items-center justify-center cursor-pointer p-4"
          >
            <img
              src={currentImageSrc}
              alt={outfit.clothing_type}
              className="w-full h-full object-contain max-h-[460px] transition-transform duration-500 group-hover:scale-105 rounded-lg"
              loading="lazy"
            />

            {/* Hover Expand Overlay */}
            <div className="absolute inset-0 bg-gray-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <div className="bg-gray-900/90 text-amber-300 text-xs font-semibold px-4 py-2 rounded-xl border border-amber-500/40 flex items-center space-x-2 shadow-2xl">
                <Maximize2 className="w-4 h-4 text-amber-400" />
                <span>Click to View Full-Screen High-Res Model Photo</span>
              </div>
            </div>

            {/* Bottom Caption Bar */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-amber-200 font-medium bg-gray-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-gray-800/80 shadow-md">
              <span className="flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-amber-400">✨ Real Fashion Model Look</span>
              </span>

              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 text-[11px] font-semibold transition cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Full Screen</span>
                </button>

                <a
                  href={pinterestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-amber-400 hover:text-amber-300 flex items-center space-x-1 text-[11px] font-semibold transition"
                >
                  <span>Pinterest</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action: Generate Gemini AI Look Button */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-gray-900/40 p-3.5 rounded-xl border border-gray-800/80">
        <div className="text-xs text-gray-400 flex items-center space-x-1.5">
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span>Produce custom fashion look via Google Gemini API?</span>
        </div>
        <button
          onClick={handleGenerateGeminiSketch}
          disabled={isGeneratingSketch}
          className="py-1.5 px-3.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
        >
          {isGeneratingSketch ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Generating with Gemini API...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              <span>Re-Generate Gemini AI Image</span>
            </>
          )}
        </button>
      </div>

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

      {/* FULL SCREEN IMAGE LIGHTBOX MODAL */}
      {isModalOpen && currentImageSrc && (
        <div className="fixed inset-0 z-50 bg-gray-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/90">
              <div>
                <h4 className="font-serif-fashion font-bold text-lg text-gray-100">
                  {outfit.clothing_type}
                </h4>
                <p className="text-xs text-amber-400 font-medium">
                  {gender} • {outfit.fabric} • {outfit.colors.join(', ')}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <a
                  href={currentImageSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition flex items-center space-x-1"
                >
                  <span>Open High-Res Model Photo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content / Full-Size Image */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-950">
              <img
                src={currentImageSrc}
                alt={outfit.clothing_type}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
