import json
import os
from typing import Dict, Any, List

class FashionRuleEngine:
    def __init__(self, knowledge_base_path: str = None):
        if knowledge_base_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            knowledge_base_path = os.path.join(base_dir, "knowledge_base.json")
        
        with open(knowledge_base_path, "r", encoding="utf-8") as f:
            self.kb = json.load(f)

    def evaluate(
        self,
        gender: str,
        occasion: str,
        culture: str,
        budget: str,
        season: str,
        desired_garment: str = "",
        preferences: str = "",
        additional_notes: str = ""
    ) -> Dict[str, Any]:
        """
        Processes user inputs through the fashion knowledge base rules
        and generates a structured fashion context for AI recommendation.
        """
        occ_lower = (occasion or "").lower()

        # 1. Match Occasion
        matched_occasion = self._find_best_match(occasion, self.kb.get("occasions", {}))
        occasion_data = self.kb.get("occasions", {}).get(matched_occasion, {
            "formality": "Medium",
            "recommended_styles": ["Contemporary", "Elegant"],
            "recommended_fabrics": ["Silk blend", "Cotton", "Crepe"],
            "color_guidance": "Balanced tones suitable for the event",
            "embroidery_level": "Medium",
            "styling_tip": "Focus on well-fitted silhouette and complementary accessories."
        })

        # 2. Match Culture with occasion-specific boundary enforcement
        # e.g., Diwali is a South Asian / Indo-Western festival
        if "diwali" in occ_lower:
            if "indo" in culture.lower() or "fusion" in culture.lower():
                matched_culture = "Indo-Western"
            else:
                matched_culture = "South Asian"
        else:
            matched_culture = self._find_best_match(culture, self.kb.get("cultures", {}))

        culture_data = self.kb.get("cultures", {}).get(matched_culture, {
            "key_garments_female": ["Contemporary Dress", "Tailored Suit", "Indo-Western Set"],
            "key_garments_male": ["Tailored Suit", "Smart Blazer with Trousers", "Nehru Jacket Set"],
            "key_garments_other": ["Tailored Unisex Suit", "Flowing Co-ord Set"],
            "signature_motifs": ["Minimalist Embroidery", "Geometric Patterns"],
            "traditional_accessories": ["Statement Earrings", "Watch", "Clutch / Leather Wallet"],
            "footwear": ["Dress Shoes", "Heels", "Loafers"]
        })

        # Garment Selection by Gender & Occasion Formality
        gender_lower = (gender or "").lower()
        if "female" in gender_lower or "woman" in gender_lower:
            raw_garments = culture_data.get("key_garments_female", [])
        elif "male" in gender_lower or "man" in gender_lower:
            raw_garments = culture_data.get("key_garments_male", [])
        else:
            raw_garments = culture_data.get("key_garments_other", culture_data.get("key_garments_female", []))

        # Formality Filtering: Ensure business meetings don't get sherwanis or heavy wedding lehengas
        if "business" in occ_lower or "meeting" in occ_lower or "corporate" in occ_lower:
            # Strictly professional garments
            if "female" in gender_lower or "woman" in gender_lower:
                candidate_garments = ["Tailored Pant Suit", "Blazer with Trousers", "Formal Silk Kurta Set with Trousers", "Contemporary Solid Saree"]
            elif "male" in gender_lower or "man" in gender_lower:
                candidate_garments = ["Two-Piece Tailored Suit", "Bandhgala Suit", "Tuxedo", "Blazer with Chinos", "Crisp Nehru Jacket with Trousers"]
            else:
                candidate_garments = ["Tailored Unisex Business Suit", "Blazer with Structured Trousers"]
        elif "casual" in occ_lower or "college" in occ_lower:
            if "female" in gender_lower or "woman" in gender_lower:
                candidate_garments = ["Cotton Kurta with Trousers", "Casual Shirt Dress", "Midi Wrap Dress", "Co-ord Set"]
            elif "male" in gender_lower or "man" in gender_lower:
                candidate_garments = ["Linen-Cotton Shirt with Chinos", "Short Kurta with Denim", "Smart Polo with Trousers", "Blazer with Chinos"]
            else:
                candidate_garments = ["Smart Casual Co-ord Set", "Linen Shirt with Trousers"]
        else:
            candidate_garments = raw_garments

        # If user specified a desired garment, prioritize it as the primary candidate
        if desired_garment and desired_garment.strip():
            candidate_garments = [desired_garment.strip()] + [g for g in candidate_garments if g.lower() != desired_garment.strip().lower()]

        # 3. Match Season
        matched_season = self._find_best_match(season, self.kb.get("season_rules", {}))
        season_data = self.kb.get("season_rules", {}).get(matched_season, {
            "preferred_fabrics": ["Cotton", "Georgette", "Silk blend"],
            "avoid_fabrics": [],
            "color_recommendations": ["Balanced tones"],
            "styling_focus": "Comfort and adaptability."
        })

        # 4. Match Budget
        matched_budget = self._find_best_match(budget, self.kb.get("budget_rules", {}))
        budget_data = self.kb.get("budget_rules", {}).get(matched_budget, {
            "fabric_guidance": "Quality blended fabrics with good drape.",
            "embroidery_guidance": "Tasteful threadwork or clean tailoring.",
            "styling_focus": "High impact through color and fit."
        })

        # 5. Fabric Intersection (Occasion + Season + Budget)
        recommended_fabrics = [
            f for f in occasion_data.get("recommended_fabrics", [])
            if f not in season_data.get("avoid_fabrics", [])
        ]
        if not recommended_fabrics:
            recommended_fabrics = season_data.get("preferred_fabrics", ["Silk blend", "Cotton"])

        # 6. Synthesize Color Guidance
        combined_color_guidance = (
            f"Occasion palette: {occasion_data.get('color_guidance', '')}. "
            f"Seasonal suggestion: {', '.join(season_data.get('color_recommendations', []))}."
        )
        if preferences:
            combined_color_guidance += f" User preference: {preferences}."

        return {
            "gender": gender,
            "occasion": occasion,
            "matched_occasion": matched_occasion,
            "culture": culture,
            "matched_culture": matched_culture,
            "budget": budget,
            "season": season,
            "desired_garment": desired_garment,
            "user_preferences": preferences,
            "additional_notes": additional_notes,
            "candidate_garments": candidate_garments,
            "recommended_fabrics": recommended_fabrics,
            "avoid_fabrics": season_data.get("avoid_fabrics", []),
            "color_guidance": combined_color_guidance,
            "embroidery_level": occasion_data.get("embroidery_level", "Medium"),
            "signature_motifs": culture_data.get("signature_motifs", []),
            "accessories": culture_data.get("traditional_accessories", []),
            "footwear_options": culture_data.get("footwear", []),
            "season_styling_focus": season_data.get("styling_focus", ""),
            "budget_fabric_guidance": budget_data.get("fabric_guidance", ""),
            "budget_embroidery_guidance": budget_data.get("embroidery_guidance", ""),
            "general_styling_tip": occasion_data.get("styling_tip", "")
        }

    def _find_best_match(self, user_query: str, target_dict: dict) -> str:
        if not user_query:
            return next(iter(target_dict)) if target_dict else ""
        
        query_lower = user_query.lower().strip()
        
        # Direct exact or substring match
        for key in target_dict.keys():
            if key.lower() == query_lower or key.lower() in query_lower or query_lower in key.lower():
                return key
        
        # Default fallback to first key
        return next(iter(target_dict)) if target_dict else ""
