import os
import sys
import time
from typing import Optional, Dict, List
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from fastapi.staticfiles import StaticFiles

# Load environment variables
load_dotenv()

from rules import FashionRuleEngine
from prompts import (
    generate_recommendation_ai,
    generate_fashion_sketch,
    RecommendationResponse,
    SketchRequest,
    SketchResponse
)

# --- FastAPI App Initialization ---

app = FastAPI(
    title="AI-Assisted Fashion Design Recommendation API",
    description="Backend service providing rule-guided AI fashion outfit recommendations and Replicate Flux model photos.",
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

# Ensure generated_svgs directory exists and mount static endpoint
svg_dir = os.path.join(os.path.dirname(__file__), "generated_svgs")
os.makedirs(svg_dir, exist_ok=True)
app.mount("/generated-svgs", StaticFiles(directory=svg_dir), name="generated-svgs")

# Initialize Rule Engine instance
rule_engine = FashionRuleEngine()

# --- Simple In-Memory IP Rate Limiter (Protects Replicate API Credits) ---
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW_SECONDS = 60
ip_request_history: Dict[str, List[float]] = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path in ["/recommend", "/generate-sketch"]:
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        # Clean history
        history = ip_request_history.get(client_ip, [])
        history = [t for t in history if now - t < RATE_LIMIT_WINDOW_SECONDS]
        
        if len(history) >= RATE_LIMIT_REQUESTS:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit protection active (10 requests per minute). Please wait 30 seconds before generating more outfits."}
            )
        
        history.append(now)
        ip_request_history[client_ip] = history

    response = await call_next(request)
    return response

# --- Request Pydantic Model ---

class RecommendationRequest(BaseModel):
    gender: str = Field(..., description="Target gender: Male, Female, or Other")
    occasion: str = Field(..., description="Target occasion, e.g., Wedding, Business Meeting, Diwali")
    culture: str = Field(..., description="Cultural context, e.g., South Asian, Western, Indo-Western")
    budget: Optional[str] = Field(default="Medium", description="Optional budget tier")
    season: str = Field(..., description="Season or climate: Summer, Winter, Monsoon, Mild")
    desired_garment: Optional[str] = Field(default="", description="Optional specific preferred garment type, e.g. Tuxedo, Modi Jacket, Saree, Lehenga")
    preferences: Optional[str] = Field(default="", description="Optional preferred colors or style preferences")
    additional_notes: Optional[str] = Field(default="", description="Optional extra notes or requirements")

# --- Endpoints ---

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Returns the API health status."""
    has_replicate = bool(os.getenv("REPLICATE_API_TOKEN", "").strip())
    return {
        "status": "ok",
        "image_engine": "Replicate Flux 1.1 Pro / Schnell",
        "replicate_configured": has_replicate,
        "rate_limit": "10 requests/min"
    }


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
    if not request.gender or not request.occasion or not request.culture:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gender, Occasion, and Culture fields are required."
        )

    try:
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

        recommendation = generate_recommendation_ai(fashion_context)
        return recommendation

    except Exception as e:
        print(f"[ERROR] Recommendation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate fashion recommendation: {str(e)}"
        )


@app.post(
    "/generate-sketch",
    response_model=SketchResponse,
    status_code=status.HTTP_200_OK
)
def create_fashion_sketch(request: SketchRequest):
    """
    Generates a bespoke AI fashion sketch illustration.
    Uses DALL-E 3 if OPENAI_API_KEY is present, or a high-res fashion reference illustration fallback.
    """
    try:
        return generate_fashion_sketch(request)
    except Exception as e:
        print(f"[ERROR] Sketch generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate sketch: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    from fastapi.responses import JSONResponse
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
