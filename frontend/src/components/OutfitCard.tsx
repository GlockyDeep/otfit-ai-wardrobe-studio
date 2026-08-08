import React from 'react';
import type { OutfitDetail } from '../types';
import { Sparkles, Palette, Feather, Layers, Scissors, Check, Heart, Lightbulb, Compass } from 'lucide-react';

interface OutfitCardProps {
  outfit: OutfitDetail;
  title: string;
  isPrimary?: boolean;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, title, isPrimary = false }) => {
  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${
        isPrimary
          ? 'glass-panel border-2 border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-amber-500/5 relative overflow-hidden'
          : 'glass-card border border-gray-800 p-6 shadow-xl hover:border-gray-700'
      }`}
    >
      {isPrimary && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-rose-500 text-gray-950 font-bold text-xs px-4 py-1.5 rounded-bl-xl uppercase tracking-wider flex items-center space-x-1 shadow-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Primary Choice</span>
        </div>
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
