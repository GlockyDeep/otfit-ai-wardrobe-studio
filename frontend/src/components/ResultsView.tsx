import React, { useState } from 'react';
import type { RecommendationResponse, RecommendationFormData, OutfitDetail, FavoriteOutfit } from '../types';
import { OutfitCard } from './OutfitCard';
import { RefreshCw, Sparkles, Check, Share2, ArrowLeft, Printer } from 'lucide-react';

interface ResultsViewProps {
  data: RecommendationResponse;
  formData: RecommendationFormData;
  onReset: () => void;
  favorites: FavoriteOutfit[];
  onToggleFavorite: (outfit: OutfitDetail, occasion: string, gender: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  data,
  formData,
  onReset,
  favorites,
  onToggleFavorite
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const summaryText = `CoutureAI Outfit Recommendation for ${formData.occasion} (${formData.culture}):\n\n` +
      `PRIMARY: ${data.primary_outfit.clothing_type}\n` +
      `Fabric: ${data.primary_outfit.fabric}\n` +
      `Colors: ${data.primary_outfit.colors.join(', ')}\n\n` +
      `ALTERNATIVE 1: ${data.alternatives[0]?.clothing_type || 'N/A'}\n` +
      `ALTERNATIVE 2: ${data.alternatives[1]?.clothing_type || 'N/A'}\n`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintLookbook = () => {
    window.print();
  };

  const isFavorited = (outfit: OutfitDetail) => {
    return favorites.some(f => f.outfit.clothing_type === outfit.clothing_type);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-12 print:p-0 print:m-0 print:max-w-none">
      {/* Top Nav Action (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-gray-800 print:hidden">
        <button
          onClick={onReset}
          className="flex items-center space-x-2 text-sm text-gray-400 hover:text-amber-300 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Modify Preferences & Re-Design</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrintLookbook}
            className="flex items-center space-x-2 text-xs sm:text-sm px-3.5 py-2 rounded-lg bg-gray-900 border border-gray-700 text-cyan-300 hover:border-cyan-500 transition cursor-pointer"
            title="Export or Print PDF Lookbook"
          >
            <Printer className="w-4 h-4" />
            <span>Export Lookbook (PDF)</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="flex items-center space-x-2 text-xs sm:text-sm px-3.5 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-300 hover:border-gray-600 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
            <span>{copied ? 'Summary Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-2 text-xs sm:text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-gray-950 font-semibold shadow-md cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Recommendation</span>
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="text-center print:text-left print:mb-6">
        <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full mb-3 print:border-black print:text-black">
          <Sparkles className="w-4 h-4 text-amber-400 print:hidden" />
          <span className="text-xs font-semibold text-amber-300 print:text-black">
            {formData.gender} &bull; {formData.occasion} &bull; {formData.culture}
          </span>
        </div>

        <h2 className="font-serif-fashion text-3xl sm:text-5xl font-bold bg-gradient-to-r from-amber-200 via-rose-100 to-purple-200 bg-clip-text text-transparent mb-2 print:text-black print:bg-none">
          CoutureAI Bespoke Lookbook
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto print:text-gray-700 print:m-0">
          Tailored for {formData.season} climate and {formData.budget} budget requirements.
        </p>
      </div>

      {/* Primary Outfit Section */}
      <section className="print:break-inside-avoid">
        <OutfitCard
          outfit={data.primary_outfit}
          title="Primary Outfit Design"
          isPrimary={true}
          isFavorite={isFavorited(data.primary_outfit)}
          onToggleFavorite={(outfit) => onToggleFavorite(outfit, formData.occasion, formData.gender)}
        />
      </section>

      {/* Alternatives Section */}
      {data.alternatives && data.alternatives.length > 0 && (
        <section className="space-y-6 pt-4 border-t border-gray-800/80 print:border-black print:pt-6">
          <div className="text-center sm:text-left">
            <h3 className="font-serif-fashion text-2xl sm:text-3xl font-bold text-gray-200 print:text-black">
              Alternative Outfit Concepts
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 print:text-gray-700">
              Two distinct alternative ensembles providing variety in cut, fabric, and styling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-8">
            {data.alternatives.map((alt, idx) => (
              <div key={idx} className="print:break-inside-avoid">
                <OutfitCard
                  outfit={alt}
                  title={`Alternative ${idx + 1}`}
                  isPrimary={false}
                  isFavorite={isFavorited(alt)}
                  onToggleFavorite={(outfit) => onToggleFavorite(outfit, formData.occasion, formData.gender)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom Callout (Hidden in Print) */}
      <div className="text-center py-6 print:hidden">
        <button
          onClick={onReset}
          className="py-3 px-8 rounded-xl font-semibold text-sm bg-gray-900 border border-gray-700 text-amber-300 hover:border-amber-400 transition cursor-pointer"
        >
          Create Another Recommendation
        </button>
      </div>
    </div>
  );
};
