import React, { useState, useEffect } from 'react';
import type { RecommendationFormData, GenderOption, SeasonOption } from '../types';
import { Sparkles, Check, Wand2, PenLine, ShieldCheck, Layers, Palette, Eye, X, Loader2, RotateCcw } from 'lucide-react';
import { ModelPhoto, ClimateOverlay } from './ModelPhoto';
import { modelPhoto, GENDER_COVER, HERO_PHOTOS } from '../data/modelPhotos';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
import {
  GENDER_VISUALS, OCCASIONS, SEASON_VISUALS, COLOR_SWATCHES, MOOD_ICONS, FABRIC_TEXTURES, NOTE_ICONS,
} from '../data/visuals';

interface FormProps {
  onSubmit: (data: RecommendationFormData) => void;
  isLoading: boolean;
}

const ALL_GARMENTS: string[] = [
  '3-Piece Vest Suit', '2-Piece Suit', 'Tuxedo', 'Panche / Veshti & Angavastram', 'Sherwani',
  'Bandhgala Suit', 'Modi Jacket / Nehru Vest', 'Banarasi Silk Saree', 'Lehenga Choli',
  'Tailored Pant Suit / Skirt Suit', 'Anarkali Suit', 'Kurta Set', 'Shirt & Chinos / Denim',
  'Polo & Chinos', 'Casual Dress / Shirt Dress', 'Sharara Set', 'Co-ord Set',
];

// Gender-specific garment filters
const GENDER_GARMENT_MAP: Record<GenderOption, string[]> = {
  Male: [
    '3-Piece Vest Suit', '2-Piece Suit', 'Tuxedo', 'Panche / Veshti & Angavastram',
    'Sherwani', 'Bandhgala Suit', 'Modi Jacket / Nehru Vest', 'Shirt & Chinos / Denim',
    'Polo & Chinos', 'Co-ord Set', 'Kurta Set',
  ],
  Female: [
    'Banarasi Silk Saree', 'Lehenga Choli', 'Anarkali Suit', 'Sharara Set',
    'Kurta Set', 'Tailored Pant Suit / Skirt Suit', 'Casual Dress / Shirt Dress', 'Co-ord Set',
  ],
  Other: ['Bandhgala Suit', 'Modi Jacket / Nehru Vest', 'Co-ord Set', '2-Piece Suit', 'Shirt & Chinos / Denim', 'Kurta Set'],
};

// Occasion-specific garment filters
const OCCASION_GARMENT_MAP: Record<string, string[]> = {
  diwali: ['Banarasi Silk Saree', 'Lehenga Choli', 'Sherwani', 'Panche / Veshti & Angavastram', 'Bandhgala Suit', 'Anarkali Suit', 'Sharara Set', 'Kurta Set', 'Modi Jacket / Nehru Vest'],
  festival: ['Banarasi Silk Saree', 'Lehenga Choli', 'Sherwani', 'Panche / Veshti & Angavastram', 'Anarkali Suit', 'Sharara Set', 'Kurta Set', 'Modi Jacket / Nehru Vest'],
  wedding: ['Banarasi Silk Saree', 'Lehenga Choli', 'Sherwani', 'Panche / Veshti & Angavastram', '3-Piece Vest Suit', '2-Piece Suit', 'Bandhgala Suit', 'Anarkali Suit', 'Tuxedo', 'Sharara Set', 'Kurta Set'],
  'business meeting': ['Tailored Pant Suit / Skirt Suit', '3-Piece Vest Suit', '2-Piece Suit', 'Tuxedo', 'Bandhgala Suit', 'Co-ord Set'],
  casual: ['Shirt & Chinos / Denim', 'Polo & Chinos', 'Casual Dress / Shirt Dress', 'Co-ord Set', 'Kurta Set'],
  college: ['Shirt & Chinos / Denim', 'Polo & Chinos', 'Casual Dress / Shirt Dress', 'Co-ord Set', 'Kurta Set'],
  'cocktail party': ['Tuxedo', '3-Piece Vest Suit', '2-Piece Suit', 'Casual Dress / Shirt Dress', 'Co-ord Set', 'Anarkali Suit', 'Bandhgala Suit'],
  'date night': ['Casual Dress / Shirt Dress', 'Co-ord Set', 'Anarkali Suit', 'Shirt & Chinos / Denim', '2-Piece Suit', 'Bandhgala Suit', 'Kurta Set', 'Sharara Set'],
  'formal event': ['Tuxedo', '3-Piece Vest Suit', '2-Piece Suit', 'Bandhgala Suit', 'Sherwani', 'Tailored Pant Suit / Skirt Suit', 'Banarasi Silk Saree', 'Anarkali Suit'],
};

const SEASONS: SeasonOption[] = ['Summer', 'Winter', 'Monsoon', 'Mild'];

const MOOD_TAGS = ['Minimalist', 'Regal', 'Bohemian', 'Romantic', 'Edgy', 'Glamorous', 'Classic & timeless', 'Avant-garde', 'Old-money', 'Cottagecore', 'Streetwear', 'Maximalist'];
const FABRIC_TAGS = ['Silk preferred', 'Cotton only', 'Lightweight fabrics', 'Velvet & rich textures', 'Linen & breathable', 'Embroidered details', 'Zari work', 'Sheer overlays'];
const COLOR_TAGS = Object.keys(COLOR_SWATCHES);

// Quick-insert chips for Additional Notes (gender-aware)
const NOTE_CHIPS: { label: string; genders: GenderOption[] }[] = [
  { label: 'Prefer flat footwear for comfort', genders: ['Male', 'Female', 'Other'] },
  { label: 'High heels are fine', genders: ['Female', 'Other'] },
  { label: 'Modest necklines & full coverage', genders: ['Male', 'Female', 'Other'] },
  { label: 'Outfit must allow easy dancing', genders: ['Male', 'Female', 'Other'] },
  { label: 'Prefer sustainable / eco fabrics', genders: ['Male', 'Female', 'Other'] },
  { label: 'Comfort & ease of movement priority', genders: ['Male', 'Female', 'Other'] },
  { label: 'Lightweight for travel / destination wedding', genders: ['Male', 'Female', 'Other'] },
  { label: 'Hot & humid climate — keep it breathable', genders: ['Male', 'Female', 'Other'] },
  { label: 'Avoid heavy embellishments / beadwork', genders: ['Male', 'Female', 'Other'] },
  { label: 'Photogenic look — camera-ready colors', genders: ['Male', 'Female', 'Other'] },
  { label: 'Flattering for a curvy / fuller figure', genders: ['Female', 'Other'] },
  { label: 'Groom-ready — want to stand out', genders: ['Male'] },
  { label: 'Bride-ready — want to be unforgettable', genders: ['Female', 'Other'] },
  { label: 'Include dupatta / head coverage', genders: ['Female', 'Other'] },
  { label: 'Must be the best-dressed in the room', genders: ['Male', 'Female', 'Other'] },
  { label: 'Show off a strong / athletic build', genders: ['Male'] },
  { label: 'Sharp & clean — business-adjacent look', genders: ['Male', 'Other'] },
];

// ---------- helpers for comma / sentence separated free-text fields ----------
const splitList = (value: string, sep: RegExp) => value.split(sep).map(s => s.trim()).filter(Boolean);
const hasItem = (value: string, item: string, sep: RegExp) => splitList(value, sep).some(v => v.toLowerCase() === item.toLowerCase());
const toggleItem = (value: string, item: string, sep: RegExp, joiner: string) => {
  const items = splitList(value, sep);
  const exists = items.some(v => v.toLowerCase() === item.toLowerCase());
  return (exists ? items.filter(v => v.toLowerCase() !== item.toLowerCase()) : [...items, item]).join(joiner);
};
const PREF_SEP = /\s*,\s*/;
const NOTE_SEP = /\.\s+|\.$/;

// ---------- small layout primitives ----------
const Step: React.FC<{ n: string; title: string; subtitle: string; aside?: React.ReactNode; children: React.ReactNode }> = ({ n, title, subtitle, aside, children }) => (
  <section className="glass-panel rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/20">
    <header className="flex items-start gap-4 mb-5">
      <span className="font-serif-fashion text-3xl leading-none text-amber-400/90 tabular-nums">{n}</span>
      <div className="flex-1 min-w-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-100">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {aside}
    </header>
    {children}
  </section>
);

const SubLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[11px] uppercase tracking-[0.14em] text-gray-500 font-semibold mb-2 block">{children}</span>
);

const SelectedBadge = () => (
  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-gray-950 flex items-center justify-center shadow-lg">
    <Check className="w-3.5 h-3.5" strokeWidth={3} />
  </span>
);

const inputCls =
  'w-full bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20 transition';

export const RecommendationForm: React.FC<FormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<RecommendationFormData>({
    gender: 'Female',
    occasion: 'Diwali',
    culture: 'South Asian', // Set internally, UI hidden
    season: 'Summer',
    desired_garment: '',
    preferences: '',
    additional_notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [styled, setStyled] = useState<{ base: string; url: string } | null>(null);
  const [styling, setStyling] = useState(false);
  const [styleError, setStyleError] = useState<string | null>(null);

  const getAvailableGarments = (occ: string, gender: GenderOption): string[] => {
    const allowedForGender = GENDER_GARMENT_MAP[gender] || ALL_GARMENTS;
    const key = occ.trim().toLowerCase();
    let allowedForOccasion = ALL_GARMENTS;
    for (const [mappedOcc, valid] of Object.entries(OCCASION_GARMENT_MAP)) {
      if (key.includes(mappedOcc)) {
        allowedForOccasion = valid;
        break;
      }
    }
    const filtered = ALL_GARMENTS.filter(g => allowedForGender.includes(g) && allowedForOccasion.includes(g));
    return filtered.length > 0 ? filtered : allowedForGender;
  };

  const availableGarments = getAvailableGarments(formData.occasion, formData.gender);

  // Drop a selected garment that is no longer valid for the chosen gender/occasion
  useEffect(() => {
    if (formData.desired_garment && ALL_GARMENTS.includes(formData.desired_garment) && !availableGarments.includes(formData.desired_garment)) {
      setFormData(prev => ({ ...prev, desired_garment: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.occasion, formData.gender]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.occasion.trim()) {
      setError('Please choose or describe an occasion.');
      document.getElementById('step-occasion')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setError(null);
    onSubmit(formData);
  };

  const set = <K extends keyof RecommendationFormData>(key: K, value: RecommendationFormData[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const togglePref = (tag: string) =>
    setFormData(prev => ({ ...prev, preferences: toggleItem(prev.preferences, tag, PREF_SEP, ', ') }));
  const toggleNote = (label: string) =>
    setFormData(prev => {
      const next = toggleItem(prev.additional_notes, label, NOTE_SEP, '. ');
      return { ...prev, additional_notes: next ? `${next}.` : '' };
    });
  const prefSelected = (tag: string) => hasItem(formData.preferences, tag, PREF_SEP);
  const noteSelected = (label: string) => hasItem(formData.additional_notes, label, NOTE_SEP);

  // ---------- live preview ----------
  const selectedColorTags = COLOR_TAGS.filter(prefSelected);
  const selectedMoods = MOOD_TAGS.filter(prefSelected);
  const selectedFabrics = FABRIC_TAGS.filter(prefSelected);

  // Real head-to-toe model photo for the chosen gender + garment
  const previewLabel =
    formData.desired_garment && modelPhoto(formData.gender, formData.desired_garment)
      ? formData.desired_garment
      : availableGarments.find(g => modelPhoto(formData.gender, g)) ?? GENDER_COVER[formData.gender];
  const basePhoto = modelPhoto(formData.gender, previewLabel) ?? modelPhoto(formData.gender, GENDER_COVER[formData.gender]);
  const shownPhoto = styled && styled.base === basePhoto ? styled.url : basePhoto;
  const isStyled = !!styled && styled.base === basePhoto;
  const hasStyleChoices = selectedColorTags.length + selectedFabrics.length + selectedMoods.length > 0;

  const stylePreview = async () => {
    if (!basePhoto) return;
    setStyling(true);
    setStyleError(null);
    try {
      const image = await blobToDataUrl(await (await fetch(basePhoto)).blob());
      const res = await fetch(`${API_BASE_URL}/preview-look`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          garment: previewLabel,
          colors: selectedColorTags,
          fabric: selectedFabrics[0] ?? '',
          moods: selectedMoods,
          season: formData.season,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Preview failed (${res.status})`);
      const data = await res.json();
      setStyled({ base: basePhoto, url: data.image_url });
    } catch (e) {
      setStyleError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setStyling(false);
    }
  };

  const renderPreview = (heightCls: string) => (
    <div className={`relative ${heightCls}`}>
      <ModelPhoto key={shownPhoto} src={shownPhoto} alt={`${formData.gender} model wearing ${previewLabel}`} eager className="w-full h-full" />
      <ClimateOverlay season={formData.season} />
      <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.16em] font-semibold text-amber-300 bg-gray-950/70 border border-amber-400/20 rounded-full px-2.5 py-1">
        {isStyled ? 'AI styled preview' : 'Live preview'}
      </span>
      {styling && (
        <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-amber-200 text-xs">
          <Loader2 className="w-6 h-6 animate-spin" />
          Styling in your colours…
        </div>
      )}
    </div>
  );

  const renderStyleButton = () => (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={stylePreview}
          disabled={styling || !hasStyleChoices}
          title={hasStyleChoices ? undefined : 'Pick colours, a fabric or a mood in step 05 first'}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-amber-400/40 text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Wand2 className="w-3.5 h-3.5" />
          {isStyled ? 'Update in my choices' : 'See it in my colours'}
        </button>
        {isStyled && (
          <button type="button" onClick={() => setStyled(null)} className="px-3 rounded-xl border border-white/10 text-gray-300 hover:text-white cursor-pointer" title="Back to original photo" aria-label="Back to original photo">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {styleError && <p className="text-[11px] text-rose-300">{styleError}</p>}
      {!hasStyleChoices && <p className="text-[11px] text-gray-500">Pick colours, a fabric or a mood in step 05 to restyle this photo.</p>}
    </div>
  );

  const summaryRows: [string, React.ReactNode][] = [
    ['For', formData.gender],
    ['Occasion', formData.occasion || <span className="text-rose-300">Not set</span>],
    ['Garment', formData.desired_garment || <span className="text-gray-500 italic">AI's choice</span>],
    ['Climate', formData.season],
    ['Fabric', selectedFabrics[0] ?? <span className="text-gray-500 italic">Any</span>],
  ];

  const submitLabel = isLoading ? 'Designing your ensemble…' : 'Generate My Outfit';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 lg:pb-16">
      {/* ================= HERO ================= */}
      <section className="relative grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center py-10 sm:py-14">
        <div className="relative z-10 text-center lg:text-left">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Rule-guided AI stylist
          </span>
          <h2 className="font-serif-fashion text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.05] mt-5 text-gray-50">
            Your personal
            <span className="block bg-gradient-to-r from-amber-200 via-rose-200 to-fuchsia-300 bg-clip-text text-transparent">couture designer.</span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mt-5 mx-auto lg:mx-0 leading-relaxed">
            Tell us who, where and when. ŌTFIT checks your choices against its fashion rules, then designs one main look and two alternatives. Each look lists fabrics, colors, accessories and styling tips.
          </p>
          <div className="mt-7 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-3 text-xs text-gray-400">
            <span className="flex items-center gap-2"><Layers className="w-4 h-4 text-amber-400" /> 17 garment styles</span>
            <span className="flex items-center gap-2"><Palette className="w-4 h-4 text-rose-400" /> Color-matched palettes</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Cultural rule engine</span>
          </div>
        </div>

        <div className="relative h-80 sm:h-96 hidden sm:block" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.18),transparent_65%)]" />
          {HERO_PHOTOS.map(({ gender, label }, i) => (
            <div
              key={label}
              className={`absolute w-40 sm:w-44 aspect-[2/3] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 ${
                ['left-[4%] top-8 -rotate-6', 'left-1/2 -translate-x-1/2 -top-2 z-10 scale-110', 'right-[4%] top-8 rotate-6'][i]
              }`}
            >
              <ModelPhoto src={modelPhoto(gender, label)} alt={`${gender} model in ${label}`} eager className="w-full h-full" />
            </div>
          ))}
        </div>
      </section>

      {/* ================= FORM ================= */}
      <form id="outfit-form" onSubmit={handleSubmit} className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8 items-start">
        <div className="space-y-6 min-w-0">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">{error}</div>
          )}

          {/* 01 — Gender */}
          <Step n="01" title="Who are we dressing?" subtitle="We use this to pick garments and cuts that suit you.">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {(['Female', 'Male', 'Other'] as GenderOption[]).map(g => {
                const v = GENDER_VISUALS[g];
                const active = formData.gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={active}
                    onClick={() => set('gender', g)}
                    className={`group relative rounded-2xl overflow-hidden border text-left transition-all cursor-pointer ${
                      active ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-400/5' : 'border-gray-800 hover:border-gray-600 bg-gray-950/40'
                    }`}
                  >
                    <ModelPhoto
                      src={modelPhoto(g, GENDER_COVER[g])}
                      alt={`${g} model`}
                      eager
                      className="aspect-[2/3] w-full"
                      imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-t border-white/5">
                      <div className={`text-sm font-semibold ${active ? 'text-amber-300' : 'text-gray-200'}`}>{g}</div>
                      <div className="text-[11px] text-gray-500 hidden sm:block mt-0.5">{v.tagline}</div>
                    </div>
                    {active && <SelectedBadge />}
                  </button>
                );
              })}
            </div>
          </Step>

          {/* 02 — Occasion */}
          <div id="step-occasion">
            <Step n="02" title="What's the occasion?" subtitle="Pick one, or describe your own event below.">
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {OCCASIONS.map(({ label, icon: Icon, hint, gradient }) => {
                  const active = formData.occasion === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => set('occasion', label)}
                      className={`relative rounded-xl border p-3 sm:p-4 text-left overflow-hidden transition-all cursor-pointer ${
                        active ? 'border-amber-400 ring-2 ring-amber-400/25' : 'border-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} ${active ? 'opacity-100' : 'opacity-60'}`} />
                      <div className="relative">
                        <span className={`inline-flex w-9 h-9 sm:w-10 sm:h-10 rounded-lg items-center justify-center mb-2 sm:mb-3 ${active ? 'bg-amber-400 text-gray-950' : 'bg-gray-950/60 text-gray-200'}`}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <div className={`text-xs sm:text-sm font-semibold leading-tight ${active ? 'text-amber-200' : 'text-gray-200'}`}>{label}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">{hint}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="relative mt-4">
                <PenLine className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.occasion}
                  onChange={e => set('occasion', e.target.value)}
                  placeholder="Or type your own — e.g. Sangeet night, Beach engagement, Office party"
                  className={`${inputCls} pl-11`}
                />
              </div>
            </Step>
          </div>

          {/* 03 — Garment */}
          <Step
            n="03"
            title="Pick a garment"
            subtitle="Optional. These options match your gender and occasion."
            aside={
              <span className="hidden sm:inline-flex text-[11px] text-rose-300/90 bg-rose-500/10 border border-rose-500/20 rounded-full px-2.5 py-1 whitespace-nowrap">
                {availableGarments.length} styles for {formData.occasion || 'any occasion'}
              </span>
            }
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
              <button
                type="button"
                aria-pressed={!formData.desired_garment}
                onClick={() => set('desired_garment', '')}
                className={`relative rounded-xl border p-3 flex flex-col items-center justify-center text-center gap-2 min-h-[10rem] transition cursor-pointer ${
                  !formData.desired_garment ? 'border-amber-400 ring-2 ring-amber-400/25 bg-amber-400/5' : 'border-dashed border-gray-700 hover:border-gray-500'
                }`}
              >
                <span className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
                  <Wand2 className="w-5 h-5 text-white" />
                </span>
                <span className="text-xs font-semibold text-gray-200">Let AI decide</span>
                <span className="text-[10px] text-gray-500 leading-tight">Best match for your brief</span>
                {!formData.desired_garment && <SelectedBadge />}
              </button>
              {availableGarments.map(label => {
                const active = formData.desired_garment === label;
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => set('desired_garment', active ? '' : label)}
                    className={`group relative rounded-xl border overflow-hidden flex flex-col transition cursor-pointer ${
                      active ? 'border-rose-400 ring-2 ring-rose-400/25 bg-rose-500/5' : 'border-gray-800 hover:border-gray-600 bg-gray-950/40'
                    }`}
                  >
                    <ModelPhoto
                      src={modelPhoto(formData.gender, label)}
                      alt={`${formData.gender} model in ${label}`}
                      className="aspect-[2/3] w-full"
                      imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <span className={`text-[11px] sm:text-xs font-medium px-2 py-2 leading-tight text-center ${active ? 'text-rose-200' : 'text-gray-300'}`}>
                      {label}
                    </span>
                    {active && <SelectedBadge />}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={ALL_GARMENTS.includes(formData.desired_garment || '') ? '' : formData.desired_garment || ''}
              onChange={e => set('desired_garment', e.target.value)}
              placeholder="Something else in mind? e.g. Kanjeevaram saree, Indo-western cape set"
              className={`${inputCls} mt-4`}
            />
          </Step>

          {/* 04 — Season */}
          <Step n="04" title="Season & climate" subtitle="Helps us choose fabric weight, layers and how breathable it should be.">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SEASONS.map(s => {
                const { icon: Icon, hint, gradient, tint } = SEASON_VISUALS[s];
                const active = formData.season === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => set('season', s)}
                    className={`relative rounded-xl border p-4 overflow-hidden text-left transition cursor-pointer ${
                      active ? 'border-cyan-300 ring-2 ring-cyan-300/25' : 'border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} ${active ? '' : 'opacity-50'}`} />
                    <Icon className={`relative w-7 h-7 mb-3 ${tint}`} />
                    <div className="relative text-sm font-semibold text-gray-100">{s}</div>
                    <div className="relative text-[11px] text-gray-400">{hint}</div>
                    {active && <SelectedBadge />}
                  </button>
                );
              })}
            </div>
          </Step>

          {/* 05 — Style direction */}
          <Step n="05" title="Colors, mood & fabric" subtitle="Optional. Pick as many as you like, and tap again to remove one.">
            <div className="space-y-6">
              <div>
                <SubLabel>Color palette</SubLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                  {COLOR_TAGS.map(tag => {
                    const active = prefSelected(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={active}
                        onClick={() => togglePref(tag)}
                        className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition cursor-pointer ${
                          active ? 'border-amber-400 bg-amber-400/10' : 'border-gray-800 hover:border-gray-600 bg-gray-950/40'
                        }`}
                      >
                        <span className="flex -space-x-2 sm:-space-x-1.5 shrink-0">
                          {COLOR_SWATCHES[tag].slice(0, 4).map((hex, i) => (
                            <span key={i} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full ring-2 ring-gray-950" style={{ background: hex }} />
                          ))}
                        </span>
                        <span className={`text-xs leading-tight ${active ? 'text-amber-200 font-semibold' : 'text-gray-300'}`}>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <SubLabel>Style mood</SubLabel>
                <div className="flex flex-wrap gap-2">
                  {MOOD_TAGS.map(tag => {
                    const Icon = MOOD_ICONS[tag];
                    const active = prefSelected(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={active}
                        onClick={() => togglePref(tag)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition cursor-pointer ${
                          active ? 'border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-200 font-semibold' : 'border-gray-800 text-gray-300 hover:border-gray-600 bg-gray-950/40'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <SubLabel>Fabric & texture</SubLabel>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FABRIC_TAGS.map(tag => {
                    const active = prefSelected(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={active}
                        onClick={() => togglePref(tag)}
                        className={`flex items-center gap-2.5 rounded-lg border p-1.5 pr-2.5 text-left transition cursor-pointer ${
                          active ? 'border-emerald-400 bg-emerald-500/10' : 'border-gray-800 hover:border-gray-600 bg-gray-950/40'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-md shrink-0 ring-1 ring-white/10" style={FABRIC_TEXTURES[tag]} />
                        <span className={`text-xs leading-tight ${active ? 'text-emerald-200 font-semibold' : 'text-gray-300'}`}>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <SubLabel>In your own words</SubLabel>
                <input
                  type="text"
                  value={formData.preferences}
                  onChange={e => set('preferences', e.target.value)}
                  placeholder="e.g. Emerald green, Pastels, Minimalist, Regal"
                  className={inputCls}
                />
              </div>
            </div>
          </Step>

          {/* 06 — Notes */}
          <Step n="06" title="Anything else?" subtitle="Optional. Tell us about comfort, coverage, footwear or anything else you need.">
            <div className="flex flex-wrap gap-2 mb-4">
              {NOTE_CHIPS.filter(c => c.genders.includes(formData.gender)).map(({ label }) => {
                const Icon = NOTE_ICONS[label] ?? Sparkles;
                const active = noteSelected(label);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleNote(label)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition cursor-pointer ${
                      active ? 'border-violet-400 bg-violet-500/15 text-violet-200 font-semibold' : 'border-gray-800 text-gray-300 hover:border-gray-600 bg-gray-950/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
            <textarea
              rows={3}
              value={formData.additional_notes}
              onChange={e => set('additional_notes', e.target.value)}
              placeholder="e.g. I'll be dancing all night, so I'd like comfortable flats and a light dupatta."
              className={`${inputCls} resize-none`}
            />
          </Step>
        </div>

        {/* ================= LIVE SUMMARY (desktop) ================= */}
        <aside className="hidden lg:block sticky top-24">
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl shadow-black/30 max-h-[calc(100vh-7rem)] overflow-y-auto">
            {renderPreview('h-[min(56vh,480px)]')}
            <div className="p-5 space-y-4">
              {renderStyleButton()}
              <div>
                <h4 className="font-serif-fashion text-xl font-bold text-gray-100">Your style brief</h4>
                <p className="text-[11px] text-gray-500">Updates as you make choices</p>
              </div>
              <dl className="space-y-2 text-sm">
                {summaryRows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="text-gray-200 font-medium text-right truncate">{v}</dd>
                  </div>
                ))}
              </dl>
              {(selectedColorTags.length > 0 || selectedMoods.length > 0) && (
                <div className="pt-3 border-t border-white/5 space-y-2.5">
                  {selectedColorTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedColorTags.flatMap(t => COLOR_SWATCHES[t]).slice(0, 12).map((hex, i) => (
                        <span key={i} className="w-5 h-5 rounded-md ring-1 ring-white/10" style={{ background: hex }} />
                      ))}
                    </div>
                  )}
                  {selectedMoods.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedMoods.map(m => (
                        <span key={m} className="text-[10px] text-fuchsia-200 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full px-2 py-0.5">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {submitLabel}
              </button>
              <p className="text-[11px] text-gray-500 text-center">1 main look + 2 alternatives, each with a full styling guide</p>
            </div>
          </div>
        </aside>
      </form>

      {/* ================= LIVE PREVIEW SHEET (mobile / tablet) ================= */}
      {showMobilePreview && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gray-950/80 backdrop-blur-sm flex items-end" onClick={() => setShowMobilePreview(false)}>
          <div className="w-full glass-panel rounded-t-3xl p-5 pb-28" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-100">{previewLabel}</span>
              <button type="button" onClick={() => setShowMobilePreview(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 cursor-pointer" aria-label="Close preview">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden">{renderPreview('h-[52vh]')}</div>
            <div className="mt-3">{renderStyleButton()}</div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[11px]">
              {[formData.desired_garment || "AI's choice", formData.season, ...selectedColorTags, ...selectedMoods, ...selectedFabrics].map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= STICKY SUBMIT (mobile / tablet) ================= */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 p-3 bg-gray-950/85 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMobilePreview(true)}
            className="relative w-12 h-[4.5rem] shrink-0 rounded-lg border border-white/10 cursor-pointer"
            aria-label="Open live preview"
          >
            <ModelPhoto src={shownPhoto} alt="Live preview" eager className="w-full h-full rounded-lg" />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-gray-950 flex items-center justify-center">
              <Eye className="w-3 h-3" />
            </span>
          </button>
          <div className="min-w-0 flex-1 text-xs">
            <div className="text-gray-200 font-semibold truncate">{formData.desired_garment || "AI's choice"}</div>
            <div className="text-gray-500 truncate">{formData.gender} · {formData.occasion || 'No occasion'} · {formData.season}</div>
          </div>
          <button
            type="submit"
            form="outfit-form"
            disabled={isLoading}
            className="shrink-0 py-3 px-5 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-600 text-white shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">{submitLabel}</span>
            <span className="sm:hidden">Generate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
