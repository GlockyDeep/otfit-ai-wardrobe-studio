import type { GenderOption } from '../types';
import type { GarmentKind } from '../components/illustrations/GarmentIllustration';

/**
 * Real model photos (head-to-toe, generated with Nano Banana by
 * backend/scripts/generate_model_photos.py) served from /public/models.
 * Keep this list in sync with GARMENTS in that script.
 */
const AVAILABLE: Record<GenderOption, string[]> = {
  Male: [
    '3-Piece Vest Suit', '2-Piece Suit', 'Tuxedo', 'Panche / Veshti & Angavastram', 'Sherwani', 'Bandhgala Suit',
    'Modi Jacket / Nehru Vest', 'Shirt & Chinos / Denim', 'Polo & Chinos', 'Co-ord Set', 'Kurta Set',
  ],
  Female: [
    'Banarasi Silk Saree', 'Lehenga Choli', 'Anarkali Suit', 'Sharara Set', 'Kurta Set',
    'Tailored Pant Suit / Skirt Suit', 'Casual Dress / Shirt Dress', 'Co-ord Set',
  ],
  Other: ['Co-ord Set', 'Bandhgala Suit', 'Modi Jacket / Nehru Vest', '2-Piece Suit', 'Shirt & Chinos / Denim', 'Kurta Set'],
};

const FILE_PREFIX: Record<GenderOption, string> = { Male: 'male', Female: 'female', Other: 'other' };

const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Photo for a garment chip label, or undefined if we don't have one for this gender */
export function modelPhoto(gender: GenderOption | string, garmentLabel: string): string | undefined {
  const g = (gender in AVAILABLE ? gender : 'Other') as GenderOption;
  if (!AVAILABLE[g].includes(garmentLabel)) return undefined;
  return `/models/${FILE_PREFIX[g]}-${slug(garmentLabel)}.webp`;
}

/** The signature look shown on each gender card */
export const GENDER_COVER: Record<GenderOption, string> = {
  Female: 'Banarasi Silk Saree',
  Male: 'Sherwani',
  Other: 'Co-ord Set',
};

const KIND_TO_LABEL: Record<GarmentKind, string> = {
  saree: 'Banarasi Silk Saree', lehenga: 'Lehenga Choli', anarkali: 'Anarkali Suit', sharara: 'Sharara Set',
  'kurta-f': 'Kurta Set', 'kurta-m': 'Kurta Set', dress: 'Casual Dress / Shirt Dress',
  'pantsuit-f': 'Tailored Pant Suit / Skirt Suit', suit: '2-Piece Suit', tuxedo: 'Tuxedo', vestsuit: '3-Piece Vest Suit',
  sherwani: 'Sherwani', bandhgala: 'Bandhgala Suit', nehru: 'Modi Jacket / Nehru Vest',
  veshti: 'Panche / Veshti & Angavastram', shirt: 'Shirt & Chinos / Denim', polo: 'Polo & Chinos', coord: 'Co-ord Set',
};

/** Closest reference photo for an illustration kind (used when an AI result has no photo) */
export function modelPhotoForKind(gender: string, kind: GarmentKind): string | undefined {
  return modelPhoto(gender, KIND_TO_LABEL[kind]);
}

export const HERO_PHOTOS = [
  { gender: 'Female' as GenderOption, label: 'Lehenga Choli' },
  { gender: 'Male' as GenderOption, label: 'Sherwani' },
  { gender: 'Female' as GenderOption, label: 'Anarkali Suit' },
];
