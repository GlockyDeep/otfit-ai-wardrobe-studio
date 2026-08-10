import React, { useState, useEffect } from 'react';
import type { RecommendationFormData, GenderOption, SeasonOption } from '../types';
import { Sparkles, Calendar, Sun, Palette, FileText, User, Info, Shirt } from 'lucide-react';

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

interface GarmentChip {
  label: string;
  emoji: string;
}

const ALL_GARMENT_CHIPS: GarmentChip[] = [
  { label: '3-Piece Vest Suit', emoji: '🤵' },
  { label: '2-Piece Suit', emoji: '👔' },
  { label: 'Tuxedo', emoji: '🤵' },
  { label: 'Panche / Veshti & Angavastram', emoji: '🥻' },
  { label: 'Sherwani', emoji: '👑' },
  { label: 'Bandhgala Suit', emoji: '👔' },
  { label: 'Modi Jacket / Nehru Vest', emoji: '🧥' },
  { label: 'Banarasi Silk Saree', emoji: '🥻' },
  { label: 'Lehenga Choli', emoji: '👗' },
  { label: 'Tailored Pant Suit / Skirt Suit', emoji: '💼' },
  { label: 'Anarkali Suit', emoji: '💃' },
  { label: 'Kurta Set', emoji: '👘' },
  { label: 'Shirt & Chinos / Denim', emoji: '👕' },
  { label: 'Polo & Chinos', emoji: '👕' },
  { label: 'Casual Dress / Shirt Dress', emoji: '👗' },
  { label: 'Sharara Set', emoji: '✨' },
  { label: 'Co-ord Set', emoji: '👚' }
];

// Gender-specific garment filters
const GENDER_GARMENT_MAP: Record<GenderOption, string[]> = {
  Male: [
    '3-Piece Vest Suit', '2-Piece Suit', 'Tuxedo', 'Panche / Veshti & Angavastram',
    'Sherwani', 'Bandhgala Suit', 'Modi Jacket / Nehru Vest', 'Shirt & Chinos / Denim',
    'Polo & Chinos', 'Co-ord Set'
  ],
  Female: [
    'Banarasi Silk Saree', 'Lehenga Choli', 'Anarkali Suit', 'Sharara Set',
    'Kurta Set', 'Tailored Pant Suit / Skirt Suit', 'Casual Dress / Shirt Dress', 'Co-ord Set'
  ],
  Other: ['Bandhgala Suit', 'Modi Jacket / Nehru Vest', 'Co-ord Set', '2-Piece Suit', 'Shirt & Chinos / Denim']
};

// Occasion-specific garment chip filters
const OCCASION_GARMENT_MAP: Record<string, string[]> = {
  diwali: ['Banarasi Silk Saree', 'Lehenga Choli', 'Sherwani', 'Panche / Veshti & Angavastram', 'Bandhgala Suit', 'Anarkali Suit', 'Sharara Set', 'Kurta Set', 'Modi Jacket / Nehru Vest'],
  festival: ['Banarasi Silk Saree', 'Lehenga Choli', 'Sherwani', 'Panche / Veshti & Angavastram', 'Anarkali Suit', 'Sharara Set', 'Kurta Set', 'Modi Jacket / Nehru Vest'],
  wedding: ['Banarasi Silk Saree', 'Lehenga Choli', 'Sherwani', 'Panche / Veshti & Angavastram', '3-Piece Vest Suit', '2-Piece Suit', 'Bandhgala Suit', 'Anarkali Suit', 'Tuxedo', 'Sharara Set', 'Kurta Set'],
  'business meeting': ['Tailored Pant Suit / Skirt Suit', '3-Piece Vest Suit', '2-Piece Suit', 'Tuxedo', 'Bandhgala Suit', 'Co-ord Set'],
  casual: ['Shirt & Chinos / Denim', 'Polo & Chinos', 'Casual Dress / Shirt Dress', 'Co-ord Set', 'Kurta Set'],
  college: ['Shirt & Chinos / Denim', 'Polo & Chinos', 'Casual Dress / Shirt Dress', 'Co-ord Set', 'Kurta Set'],
  'cocktail party': ['Tuxedo', '3-Piece Vest Suit', '2-Piece Suit', 'Casual Dress / Shirt Dress', 'Co-ord Set', 'Anarkali Suit', 'Bandhgala Suit']
};

const SEASONS: SeasonOption[] = ['Summer', 'Winter', 'Monsoon', 'Mild'];

// --- Categorized Preference Tags ---
const PREFERENCE_GROUPS = [
  {
    label: '🎨 Color Palette',
    tags: ['Jewel tones', 'Pastels', 'Earthy tones', 'Monochrome', 'All-black', 'All-white', 'Ivory & cream', 'Bold neons', 'Dusty rose', 'Sapphire blue', 'Burgundy & wine', 'Forest green', 'Terracotta', 'Gold & bronze']
  },
  {
    label: '✨ Style Mood',
    tags: ['Minimalist', 'Regal', 'Bohemian', 'Romantic', 'Edgy', 'Glamorous', 'Classic & timeless', 'Avant-garde', 'Old-money', 'Cottagecore', 'Streetwear', 'Maximalist']
  },
  {
    label: '🪡 Fabric & Texture',
    tags: ['Silk preferred', 'Cotton only', 'Lightweight fabrics', 'Velvet & rich textures', 'Linen & breathable', 'Embroidered details', 'Zari work', 'Sheer overlays']
  }
];

// --- Quick-insert chips for Additional Notes (gender-aware) ---
const NOTE_CHIPS: { emoji: string; label: string; genders: GenderOption[] }[] = [
  { emoji: '👟', label: 'Prefer flat footwear for comfort',              genders: ['Male', 'Female', 'Other'] },
  { emoji: '👠', label: 'High heels are fine',                           genders: ['Female', 'Other'] },
  { emoji: '🕌', label: 'Modest necklines & full coverage',              genders: ['Male', 'Female', 'Other'] },
  { emoji: '💃', label: 'Outfit must allow easy dancing',                genders: ['Male', 'Female', 'Other'] },
  { emoji: '🌿', label: 'Prefer sustainable / eco fabrics',              genders: ['Male', 'Female', 'Other'] },
  { emoji: '🏋️', label: 'Comfort & ease of movement priority',          genders: ['Male', 'Female', 'Other'] },
  { emoji: '✈️', label: 'Lightweight for travel / destination wedding',  genders: ['Male', 'Female', 'Other'] },
  { emoji: '🌡️', label: 'Hot & humid climate — keep it breathable',     genders: ['Male', 'Female', 'Other'] },
  { emoji: '🧴', label: 'Avoid heavy embellishments / beadwork',        genders: ['Male', 'Female', 'Other'] },
  { emoji: '📷', label: 'Photogenic look — camera-ready colors',         genders: ['Male', 'Female', 'Other'] },
  { emoji: '🤰', label: 'Flattering for a curvy / fuller figure',        genders: ['Female', 'Other'] },
  { emoji: '🕺', label: 'Groom-ready — want to stand out',              genders: ['Male'] },
  { emoji: '👰', label: 'Bride-ready — want to be unforgettable',        genders: ['Female', 'Other'] },
  { emoji: '🧕', label: 'Include dupatta / head coverage',               genders: ['Female', 'Other'] },
  { emoji: '🥇', label: 'Must be the best-dressed in the room',          genders: ['Male', 'Female', 'Other'] },
  { emoji: '💪', label: 'Show off a strong / athletic build',            genders: ['Male'] },
  { emoji: '👔', label: 'Sharp & clean — business-adjacent look',        genders: ['Male', 'Other'] },
];


export const RecommendationForm: React.FC<FormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<RecommendationFormData>({
    gender: 'Female',
    occasion: 'Diwali',
    culture: 'South Asian', // Set internally, UI hidden
    season: 'Summer',
    desired_garment: '',
    preferences: 'Jewel tones, elegant traditional style',
    additional_notes: ''
  });

  const [error, setError] = useState<string | null>(null);

  // Compute available garment choices based on Gender AND Occasion
  const getAvailableGarmentChips = (occ: string, gender: GenderOption): GarmentChip[] => {
    const allowedForGender = GENDER_GARMENT_MAP[gender] || ALL_GARMENT_CHIPS.map(g => g.label);
    const key = occ ? occ.trim().toLowerCase() : '';
    
    let allowedForOccasion = ALL_GARMENT_CHIPS.map(g => g.label);
    for (const [mappedOcc, validLabels] of Object.entries(OCCASION_GARMENT_MAP)) {
      if (key.includes(mappedOcc)) {
        allowedForOccasion = validLabels;
        break;
      }
    }

    return ALL_GARMENT_CHIPS.filter(
      chip => allowedForGender.includes(chip.label) && allowedForOccasion.includes(chip.label)
    );
  };

  const availableGarments = getAvailableGarmentChips(formData.occasion, formData.gender);

  // Dynamic placeholder text matching target gender
  const getGarmentPlaceholder = (gender: GenderOption) => {
    if (gender === 'Female') return 'e.g. Banarasi Silk Saree, Lehenga Choli, Tailored Pant Suit, Shirt Dress';
    if (gender === 'Male') return 'e.g. Panche / Veshti & Angavastram, 3-Piece Vest Suit, Sherwani, Tuxedo';
    return 'e.g. Bandhgala Suit, 2-Piece Suit, Co-ord Set';
  };

  // Auto-adjust selections if current desired_garment is invalid for current gender/occasion
  useEffect(() => {
    if (formData.desired_garment) {
      const validLabels = availableGarments.map(g => g.label);
      if (!validLabels.includes(formData.desired_garment)) {
        setFormData(prev => ({ ...prev, desired_garment: '' }));
      }
    }
  }, [formData.occasion, formData.gender]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.occasion.trim()) {
      setError('Please specify an occasion for the recommendation.');
      return;
    }
    setError(null);
    onSubmit(formData);
  };

  const handleChipClick = (occ: string) => {
    const validGarmentChips = getAvailableGarmentChips(occ, formData.gender);
    const validGarmentLabels = validGarmentChips.map(g => g.label);

    setFormData(prev => ({
      ...prev,
      occasion: occ,
      desired_garment: prev.desired_garment && validGarmentLabels.includes(prev.desired_garment) ? prev.desired_garment : ''
    }));
  };

  const handleGarmentClick = (garmentLabel: string) => {
    setFormData(prev => ({
      ...prev,
      desired_garment: prev.desired_garment === garmentLabel ? '' : garmentLabel
    }));
  };

  const handleTagClick = (tag: string) => {
    setFormData(prev => {
      const current = prev.preferences;
      if (!current) return { ...prev, preferences: tag };
      if (current.includes(tag)) return prev;
      return { ...prev, preferences: `${current}, ${tag}` };
    });
  };

  const handleNoteChipClick = (label: string) => {
    setFormData(prev => {
      const current = (prev.additional_notes || '').trim();
      if (!current) return { ...prev, additional_notes: label };
      if (current.includes(label)) return prev;
      return { ...prev, additional_notes: `${current}. ${label}` };
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="text-center mb-10">
        <h2 className="font-serif-fashion text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-200 via-rose-100 to-amber-400 bg-clip-text text-transparent mb-3">
          Design Your Bespoke Outfit
        </h2>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
          Specify your occasion, target gender, season/climate, and garment preferences. Our hybrid fashion rule engine and AI will curate a complete primary ensemble alongside two alternative designs.
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
            placeholder="e.g. Traditional Wedding Guest, Formal Business Meeting, Campus College Party"
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

        {/* 3. Preferred Clothing Type / Garment */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
              <Shirt className="w-4 h-4 text-rose-400" />
              <span>Preferred Clothing Type / Garment (Optional)</span>
            </label>
            <span className="text-xs text-rose-300/80 flex items-center space-x-1 font-medium">
              <Info className="w-3.5 h-3.5" />
              <span>Filtered for {formData.gender} &bull; {formData.occasion}</span>
            </span>
          </div>

          <input
            type="text"
            value={formData.desired_garment || ''}
            onChange={e => setFormData(prev => ({ ...prev, desired_garment: e.target.value }))}
            placeholder={getGarmentPlaceholder(formData.gender)}
            className="w-full bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center mr-1">Garment Choices:</span>
            {availableGarments.map(({ label, emoji }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleGarmentClick(label)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center space-x-1.5 ${
                  formData.desired_garment === label
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-semibold'
                    : 'bg-gray-900/40 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                }`}
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Season / Climate */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Season / Climate</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SEASONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, season: s }))}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-medium border transition text-center cursor-pointer ${
                  formData.season === s
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold shadow-md'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
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
          <div className="mt-3 space-y-2.5">
            {PREFERENCE_GROUPS.map(group => (
              <div key={group.label}>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1.5 block">{group.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {group.tags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition cursor-pointer ${
                        formData.preferences?.includes(tag)
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold'
                          : 'bg-gray-900/40 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                      }`}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
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
          <div className="mt-2.5">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1.5 block">⚡ Quick Instructions</span>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_CHIPS.filter(chip => chip.genders.includes(formData.gender)).map(({ emoji, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleNoteChipClick(label)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition cursor-pointer flex items-center space-x-1 ${
                    formData.additional_notes?.includes(label)
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-semibold'
                      : 'bg-gray-900/40 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
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
