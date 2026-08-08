import React, { useState } from 'react';
import type { RecommendationResponse, RecommendationFormData } from '../types';
import { OutfitCard } from './OutfitCard';
import { RefreshCw, Sparkles, Check, Share2, ArrowLeft } from 'lucide-react';

interface ResultsViewProps {
  data: RecommendationResponse;
  formData: RecommendationFormData;
  onReset: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ data, formData, onReset }) => {
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

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-12">
      {/* Top Nav Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-gray-800">
        <button
          onClick={onReset}
          className="flex items-center space-x-2 text-sm text-gray-400 hover:text-amber-300 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Modify Preferences & Re-Design</span>
        </button>

        <div className="flex items-center space-x-3">
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
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-300">
            {formData.gender} • {formData.occasion} • {formData.culture}
          </span>
        </div>

        <h2 className="font-serif-fashion text-3xl sm:text-5xl font-bold bg-gradient-to-r from-amber-200 via-rose-100 to-purple-200 bg-clip-text text-transparent mb-2">
          Your Curated Fashion Collection
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
          Tailored for {formData.season} climate and {formData.budget} budget requirements.
        </p>
      </div>

      {/* Primary Outfit Section */}
      <section>
        <OutfitCard outfit={data.primary_outfit} title="Primary Outfit Design" isPrimary={true} />
      </section>

      {/* Alternatives Section */}
      {data.alternatives && data.alternatives.length > 0 && (
        <section className="space-y-6 pt-4 border-t border-gray-800/80">
          <div className="text-center sm:text-left">
            <h3 className="font-serif-fashion text-2xl sm:text-3xl font-bold text-gray-200">
              Alternative Outfit Concepts
            </h3>
            <p className="text-xs sm:text-sm text-gray-400">
              Two distinct alternative ensembles providing variety in cut, fabric, and styling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.alternatives.map((alt, idx) => (
              <OutfitCard key={idx} outfit={alt} title={`Alternative ${idx + 1}`} isPrimary={false} />
            ))}
          </div>
        </section>
      )}

      {/* Bottom Callout */}
      <div className="text-center py-6">
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
