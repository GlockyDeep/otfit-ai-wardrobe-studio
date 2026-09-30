import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Gem, Briefcase, Coffee, Martini, GraduationCap, Heart, PartyPopper, Crown,
  Sun, Snowflake, CloudRain, CloudSun, Minus, Flower2, Zap, Sparkles, Landmark, Shapes,
  Cherry, Footprints, Stars, Shield, Music, Recycle, Move, Plane, Thermometer, Feather,
  Camera, Wind, Trophy, Dumbbell,
} from 'lucide-react';
import type { GenderOption, SeasonOption } from '../types';
import type { GarmentKind } from '../components/illustrations/GarmentIllustration';

/* ---------------- Diwali diya (custom icon, lucide has none) ---------------- */
export const DiyaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c1.6 1.8 2.2 3.3 2.2 4.5a2.2 2.2 0 0 1-4.4 0C9.8 6.3 10.4 4.8 12 3z" fill="currentColor" fillOpacity="0.35" />
    <path d="M3 13h18c-.6 3.6-4.4 6-9 6s-8.4-2.4-9-6z" />
    <path d="M8 21h8" />
    <path d="M12 10.5V13" />
  </svg>
);

type IconLike = LucideIcon | React.FC<{ className?: string }>;

/* ---------------- Gender ---------------- */
export const GENDER_VISUALS: Record<GenderOption, { kind: GarmentKind; tagline: string; ring: string }> = {
  Female: { kind: 'saree', tagline: 'Sarees, lehengas, gowns & suits', ring: 'from-rose-500 to-amber-400' },
  Male: { kind: 'sherwani', tagline: 'Sherwanis, suits, kurtas & more', ring: 'from-sky-500 to-indigo-500' },
  Other: { kind: 'coord', tagline: 'Fluid tailoring & co-ord sets', ring: 'from-violet-500 to-fuchsia-500' },
};

/* ---------------- Occasions ---------------- */
export interface OccasionVisual {
  label: string;
  icon: IconLike;
  hint: string;
  gradient: string; // tailwind gradient classes
}

export const OCCASIONS: OccasionVisual[] = [
  { label: 'Wedding', icon: Gem, hint: 'Ceremony & reception', gradient: 'from-rose-500/30 via-rose-500/10 to-transparent' },
  { label: 'Diwali', icon: DiyaIcon, hint: 'Festival of lights', gradient: 'from-amber-500/35 via-orange-500/10 to-transparent' },
  { label: 'Business Meeting', icon: Briefcase, hint: 'Boardroom ready', gradient: 'from-slate-400/30 via-slate-500/10 to-transparent' },
  { label: 'Casual', icon: Coffee, hint: 'Everyday easy', gradient: 'from-emerald-500/30 via-emerald-500/10 to-transparent' },
  { label: 'Cocktail Party', icon: Martini, hint: 'Evening glamour', gradient: 'from-fuchsia-500/30 via-purple-500/10 to-transparent' },
  { label: 'College', icon: GraduationCap, hint: 'Campus cool', gradient: 'from-sky-500/30 via-sky-500/10 to-transparent' },
  { label: 'Date Night', icon: Heart, hint: 'Romantic dinner', gradient: 'from-pink-500/30 via-rose-500/10 to-transparent' },
  { label: 'Festival', icon: PartyPopper, hint: 'Pujas, Eid, Holi…', gradient: 'from-orange-500/30 via-yellow-500/10 to-transparent' },
  { label: 'Formal Event', icon: Crown, hint: 'Galas & black tie', gradient: 'from-indigo-500/30 via-indigo-500/10 to-transparent' },
];

/* ---------------- Seasons ---------------- */
export const SEASON_VISUALS: Record<SeasonOption, { icon: IconLike; hint: string; gradient: string; tint: string }> = {
  Summer: { icon: Sun, hint: 'Hot · 30°C+', gradient: 'from-amber-400/35 to-orange-500/5', tint: 'text-amber-300' },
  Winter: { icon: Snowflake, hint: 'Cold · under 15°C', gradient: 'from-sky-300/35 to-blue-500/5', tint: 'text-sky-200' },
  Monsoon: { icon: CloudRain, hint: 'Rainy & humid', gradient: 'from-teal-400/35 to-cyan-600/5', tint: 'text-teal-200' },
  Mild: { icon: CloudSun, hint: 'Pleasant · 18–28°C', gradient: 'from-lime-300/30 to-emerald-500/5', tint: 'text-lime-200' },
};

/* ---------------- Colour palettes (real swatches) ---------------- */
export const COLOR_SWATCHES: Record<string, string[]> = {
  'Jewel tones': ['#047857', '#1f4fb8', '#9b111e', '#7b4fa0'],
  'Pastels': ['#f7c8d0', '#c9e4de', '#c6def1', '#faedcb'],
  'Earthy tones': ['#c05a3c', '#b88a55', '#6b7333', '#6b4428'],
  'Monochrome': ['#15151a', '#56606b', '#bfc3c9', '#f5f5f2'],
  'All-black': ['#15151a', '#2a2a30', '#0b0b0e'],
  'All-white': ['#f5f5f2', '#e8e8e3', '#ffffff'],
  'Ivory & cream': ['#f4ecd8', '#efe3c6', '#e3d3ae'],
  'Bold neons': ['#39ff88', '#ff2fb3', '#fff200', '#00e5ff'],
  'Dusty rose': ['#c98b93', '#e3b5b9', '#a86d77'],
  'Sapphire blue': ['#1f4fb8', '#0f2a6b', '#5a82d8'],
  'Burgundy & wine': ['#6d1a36', '#4a0e22', '#8e2b4c'],
  'Forest green': ['#1f5135', '#0f3322', '#3b7a52'],
  'Terracotta': ['#c05a3c', '#9a4128', '#e08a6a'],
  'Gold & bronze': ['#d4a73a', '#a8753a', '#f0d27a'],
};

/* ---------------- Style moods ---------------- */
export const MOOD_ICONS: Record<string, IconLike> = {
  'Minimalist': Minus, 'Regal': Crown, 'Bohemian': Flower2, 'Romantic': Heart, 'Edgy': Zap,
  'Glamorous': Sparkles, 'Classic & timeless': Landmark, 'Avant-garde': Shapes, 'Old-money': Gem,
  'Cottagecore': Cherry, 'Streetwear': Footprints, 'Maximalist': Stars,
};

/* ---------------- Fabric textures (CSS-only swatches) ---------------- */
export const FABRIC_TEXTURES: Record<string, React.CSSProperties> = {
  'Silk preferred': { background: 'linear-gradient(135deg,#7a1330 0%,#d9728a 45%,#7a1330 55%,#c2185b 100%)' },
  'Cotton only': { background: 'repeating-linear-gradient(0deg,#e9e3d6 0 2px,#d9d1c0 2px 3px),#e9e3d6', backgroundBlendMode: 'multiply' },
  'Lightweight fabrics': { background: 'linear-gradient(160deg,#e0f2fe 0%,#bae6fd 50%,#f0f9ff 100%)' },
  'Velvet & rich textures': { background: 'radial-gradient(circle at 30% 30%,#8e2b4c 0%,#4a0e22 60%,#2a0613 100%)' },
  'Linen & breathable': { background: 'repeating-linear-gradient(0deg,rgba(0,0,0,.08) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.08) 0 1px,transparent 1px 3px),#d8c3a0' },
  'Embroidered details': { background: 'radial-gradient(circle,#f0d27a 1.4px,transparent 1.6px) 0 0/6px 6px,#1f4fb8' },
  'Zari work': { background: 'repeating-linear-gradient(45deg,#d4a73a 0 2px,#8a6420 2px 4px)' },
  'Sheer overlays': { background: 'linear-gradient(45deg,rgba(255,255,255,.35) 25%,transparent 25% 75%,rgba(255,255,255,.35) 75%) 0 0/6px 6px,linear-gradient(135deg,#c9a4d8,#f2c4c9)' },
};

/* ---------------- Quick instruction icons ---------------- */
export const NOTE_ICONS: Record<string, IconLike> = {
  'Prefer flat footwear for comfort': Footprints,
  'High heels are fine': Sparkles,
  'Modest necklines & full coverage': Shield,
  'Outfit must allow easy dancing': Music,
  'Prefer sustainable / eco fabrics': Recycle,
  'Comfort & ease of movement priority': Move,
  'Lightweight for travel / destination wedding': Plane,
  'Hot & humid climate — keep it breathable': Thermometer,
  'Avoid heavy embellishments / beadwork': Feather,
  'Photogenic look — camera-ready colors': Camera,
  'Flattering for a curvy / fuller figure': Heart,
  'Groom-ready — want to stand out': Crown,
  'Bride-ready — want to be unforgettable': Gem,
  'Include dupatta / head coverage': Wind,
  'Must be the best-dressed in the room': Trophy,
  'Show off a strong / athletic build': Dumbbell,
  'Sharp & clean — business-adjacent look': Briefcase,
};
