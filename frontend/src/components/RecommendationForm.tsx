import React, { useState } from 'react';
import type { RecommendationFormData, GenderOption, CultureOption, BudgetOption, SeasonOption } from '../types';
import { Sparkles, Calendar, Globe, DollarSign, Sun, Palette, FileText, User } from 'lucide-react';

interface FormProps {
  onSubmit: (data: RecommendationFormData) => void;
  isLoading: boolean;
}

const OCCASION_CHIPS = [
  'Wedding',
  'Diwali',
  'Business Meeting',
  'Casual',
  'Cocktail Party',
  'College',
  'Date Night',
  'Festival',
  'Formal Event'
];

const CULTURES: CultureOption[] = [
  'South Asian',
  'Western',
  'Indo-Western',
  'Middle Eastern',
  'East Asian',
  'African'
];

const BUDGETS: BudgetOption[] = ['Low', 'Medium', 'High'];

const SEASONS: SeasonOption[] = ['Summer', 'Winter', 'Monsoon', 'Mild'];

const PREFERENCE_TAGS = ['Jewel tones', 'Pastels', 'Minimalist', 'Regal', 'Streetwear', 'Earthy tones'];

export const RecommendationForm: React.FC<FormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<RecommendationFormData>({
    gender: 'Female',
    occasion: 'Diwali',
    culture: 'South Asian',
    budget: 'Medium',
    season: 'Mild',
    preferences: 'Jewel tones, elegant traditional style',
    additional_notes: ''
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.occasion.trim()) {
      setError('Please specify an occasion for the recommendation.');
      return;
    }
    setError(null);
    onSubmit(formData);
  };

  const handleChipClick = (occasion: string) => {
    setFormData(prev => ({ ...prev, occasion }));
  };

  const handleTagClick = (tag: string) => {
    setFormData(prev => {
      const current = prev.preferences;
      if (!current) return { ...prev, preferences: tag };
      if (current.includes(tag)) return prev;
      return { ...prev, preferences: `${current}, ${tag}` };
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="text-center mb-10">
        <h2 className="font-serif-fashion text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-200 via-rose-100 to-amber-400 bg-clip-text text-transparent mb-3">
          Design Your Bespoke Outfit
        </h2>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
          Specify your occasion, cultural heritage, and styling preferences. Our hybrid fashion rule engine and AI will curate a complete primary ensemble alongside two alternative designs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 space-y-8 border border-gray-800 shadow-2xl">
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center space-x-2">
            <span className="font-semibold">Notice:</span>
            <span>{error}</span>
          </div>
        )}

        {/* 1. Gender Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
            <User className="w-4 h-4 text-amber-400" />
            <span>Gender Identity</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['Female', 'Male', 'Other'] as GenderOption[]).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  formData.gender === g
                    ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-gray-900/60 border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Occasion Selection + Chips */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Occasion / Event</span>
          </label>
          <input
            type="text"
            value={formData.occasion}
            onChange={e => setFormData(prev => ({ ...prev, occasion: e.target.value }))}
            placeholder="e.g. Traditional South Asian Wedding Guest, Formal Gala, Campus College Party"
            className="w-full bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center mr-1">Quick Select:</span>
            {OCCASION_CHIPS.map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  formData.occasion === chip
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-gray-900/40 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Culture & Heritage */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>Cultural Context & Styling Aesthetics</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CULTURES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, culture: c }))}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium border text-left transition cursor-pointer ${
                  formData.culture === c
                    ? 'bg-rose-500/15 border-rose-400 text-rose-200'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Budget & Season Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Budget */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Budget Level</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BUDGETS.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, budget: b }))}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium border transition cursor-pointer ${
                    formData.budget === b
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Season / Climate</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SEASONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, season: s }))}
                  className={`py-2.5 px-2 rounded-xl text-xs font-medium border transition text-center cursor-pointer ${
                    formData.season === s
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Preferred Colors & Style */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center space-x-2">
            <Palette className="w-4 h-4 text-amber-400" />
            <span>Preferred Colors & Style Direction (Optional)</span>
          </label>
          <input
            type="text"
            value={formData.preferences}
            onChange={e => setFormData(prev => ({ ...prev, preferences: e.target.value }))}
            placeholder="e.g. Jewel tones, Emerald green, Pastels, Minimalist, Regal"
            className="w-full bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {PREFERENCE_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="text-xs px-2.5 py-1 rounded-md bg-gray-900/40 border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300 transition cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Additional Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Additional Custom Instructions (Optional)</span>
          </label>
          <textarea
            rows={2}
            value={formData.additional_notes}
            onChange={e => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
            placeholder="e.g. Prefer comfortable flat footwear for dancing, desire modest necklines, or lightweight dupatta."
            className="w-full bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl font-semibold text-sm sm:text-base bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-xl shadow-amber-500/10 hover:shadow-amber-500/25 hover:opacity-95 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>{isLoading ? 'Designing Outfit Ensemble...' : 'Generate Couture Outfit Recommendation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
