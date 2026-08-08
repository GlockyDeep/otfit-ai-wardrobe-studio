export type GenderOption = 'Female' | 'Male' | 'Other';
export type CultureOption = 'South Asian' | 'Western' | 'Indo-Western' | 'Middle Eastern' | 'East Asian' | 'African';
export type BudgetOption = 'Low' | 'Medium' | 'High';
export type SeasonOption = 'Summer' | 'Winter' | 'Monsoon' | 'Mild';

export interface RecommendationFormData {
  gender: GenderOption;
  occasion: string;
  culture: CultureOption;
  budget: BudgetOption;
  season: SeasonOption;
  preferences: string;
  additional_notes: string;
}

export interface OutfitDetail {
  clothing_type: string;
  silhouette: string;
  colors: string[];
  fabric: string;
  embroidery_or_pattern: string;
  accessories: string[];
  footwear: string;
  hairstyle: string;
  makeup: string;
  styling_tips: string[];
  rationale: string;
}

export interface RecommendationResponse {
  primary_outfit: OutfitDetail;
  alternatives: OutfitDetail[];
}
