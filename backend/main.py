import os
import sys
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from rules import FashionRuleEngine
from prompts import generate_recommendation_ai, RecommendationResponse

# --- FastAPI App Initialization ---

app = FastAPI(
    title="AI-Assisted Fashion Design Recommendation API",
    description="Backend service providing rule-guided AI fashion outfit recommendations.",
    version="1.0.0"
)

# Enable CORS for Frontend Communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Rule Engine instance
rule_engine = FashionRuleEngine()

# --- Request Pydantic Model ---

class RecommendationRequest(BaseModel):
    gender: str = Field(..., description="Target gender: Male, Female, or Other")
    occasion: str = Field(..., description="Target occasion, e.g., Wedding, Business Meeting, Diwali")
    culture: str = Field(..., description="Cultural context, e.g., South Asian, Western, Indo-Western")
    budget: str = Field(..., description="Budget tier: Low, Medium, or High")
    season: str = Field(..., description="Season or climate: Summer, Winter, Monsoon, Mild")
    desired_garment: Optional[str] = Field(default="", description="Optional specific preferred garment type, e.g. Tuxedo, Modi Jacket, Saree, Lehenga")
    preferences: Optional[str] = Field(default="", description="Optional preferred colors or style preferences")
    additional_notes: Optional[str] = Field(default="", description="Optional extra notes or requirements")

# --- Endpoints ---

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Returns the API health status."""
    return {"status": "ok"}


@app.post(
    "/recommend",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK
)
def get_fashion_recommendation(request: RecommendationRequest):
    """
    Main Recommendation Endpoint.
    Pipeline:
    1. Input validation via Pydantic
    2. Rule Engine knowledge-base evaluation
    3. AI prompt building & LLM completion call (with deterministic fallback)
    4. Schema validation and response formatting
    """
    # 1. Input Validation Checks
    if not request.gender or not request.occasion or not request.culture:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gender, Occasion, and Culture fields are required."
        )

    try:
        # 2. Process inputs through Rule Engine
        fashion_context = rule_engine.evaluate(
            gender=request.gender,
            occasion=request.occasion,
            culture=request.culture,
            budget=request.budget,
            season=request.season,
            desired_garment=request.desired_garment or "",
            preferences=request.preferences or "",
            additional_notes=request.additional_notes or ""
        )

        # 3. Generate AI Recommendation (or rule fallback if no API key)
        recommendation = generate_recommendation_ai(fashion_context)
        return recommendation

    except Exception as e:
        print(f"[ERROR] Recommendation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate fashion recommendation: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
