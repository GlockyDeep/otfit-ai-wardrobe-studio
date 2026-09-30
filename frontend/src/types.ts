export type GenderOption = 'Female' | 'Male' | 'Other';
export type CultureOption = 'South Asian' | 'Western' | 'Indo-Western' | 'Middle Eastern' | 'East Asian' | 'African';
export type SeasonOption = 'Summer' | 'Winter' | 'Monsoon' | 'Mild';

export interface RecommendationFormData {
  gender: GenderOption;
  occasion: string;
  culture: CultureOption;
  budget?: string;
  season: SeasonOption;
  desired_garment?: string;
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
  image_url?: string;
  sketch_url?: string;
  image_urls?: string[];
}

export interface RecommendationResponse {
  primary_outfit: OutfitDetail;
  alternatives: OutfitDetail[];
  image_job_id?: string;   // Poll /image-status/{image_job_id} for alternative images
  engine?: string;         // "openai:gpt-4o-mini", "groq:llama-3.3-70b-versatile" or "rules"
  engine_note?: string;    // Why the rule-based fallback was used
}

export interface ImageJobStatus {
  job_id: string;
  status: 'pending' | 'done';
  total: number;
  completed: number;
  alternatives: {
    index: number;
    image_url: string;
    image_urls: string[];
    sketch_url: string;
  }[];
}


export interface FavoriteOutfit {
  id: string;
  saved_at: string;
  occasion: string;
  gender: string;
  outfit: OutfitDetail;
}
