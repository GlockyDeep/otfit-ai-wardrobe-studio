import os
import sys
import time
import uuid
import threading
from typing import Optional, Dict, List, Any
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Load environment variables
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv()

try:
    from backend.rules import FashionRuleEngine
    from backend.prompts import (
        generate_recommendation_ai,
        generate_fashion_sketch,
        attach_ai_images,
        RecommendationResponse,
        SketchRequest,
        SketchResponse,
        OutfitDetail,
        get_llm_config,
        generate_preview_look,
        PreviewLookRequest,
        PreviewLookResponse,
        generate_virtual_try_on,
        TryOnRequest,
        TryOnResponse
    )
except ImportError:
    from rules import FashionRuleEngine
    from prompts import (
        generate_recommendation_ai,
        generate_fashion_sketch,
        attach_ai_images,
        RecommendationResponse,
        SketchRequest,
        SketchResponse,
        OutfitDetail,
        get_llm_config,
        generate_preview_look,
        PreviewLookRequest,
        PreviewLookResponse,
        generate_virtual_try_on,
        TryOnRequest,
        TryOnResponse
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure generated_svgs directory exists and mount static endpoint
svg_dir = os.path.join(os.path.dirname(__file__), "generated_svgs")
os.makedirs(svg_dir, exist_ok=True)
app.mount("/generated-svgs", StaticFiles(directory=svg_dir), name="generated-svgs")

# Generated model photos (downloaded from Replicate so links never expire)
images_dir = os.path.join(os.path.dirname(__file__), "generated_images")
os.makedirs(images_dir, exist_ok=True)
app.mount("/generated-images", StaticFiles(directory=images_dir), name="generated-images")

# Saved try-ons (My looks / What Others)
try:
    from backend import community
    from backend.prompts import call_nano_banana, store_image
except ImportError:
    import community
    from prompts import call_nano_banana, store_image
os.makedirs(community.GALLERY_DIR, exist_ok=True)
app.mount("/gallery-images", StaticFiles(directory=community.GALLERY_DIR), name="gallery-images")

# Initialize Rule Engine instance
rule_engine = FashionRuleEngine()

# --- Simple In-Memory IP Rate Limiter (Protects Replicate API Credits) ---
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW_SECONDS = 60
ip_request_history: Dict[str, List[float]] = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path in ["/recommend", "/generate-sketch", "/preview-look", "/virtual-try-on", "/tryon-pattern"]:
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        history = ip_request_history.get(client_ip, [])
        history = [t for t in history if now - t < RATE_LIMIT_WINDOW_SECONDS]
        if len(history) >= RATE_LIMIT_REQUESTS:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit active (10 requests per minute). Please wait before generating more outfits."}
            )
        history.append(now)
        ip_request_history[client_ip] = history
    response = await call_next(request)
    return response

# -------------------------------------------------------------------
# Background Image Job Store
# Stores generated alternative images keyed by job_id
# Structure: { job_id: { "status": "pending"|"done", "alternatives": [ {image_url, image_urls, sketch_url} ] } }
# -------------------------------------------------------------------
_image_jobs: Dict[str, Dict[str, Any]] = {}
_image_jobs_lock = threading.Lock()


def _generate_alternative_images_bg(job_id: str, alternatives: List[OutfitDetail], gender: str, user_preferences: str = ""):
    """Background thread: generate images for alternative outfits one by one, 11s apart."""
    results = []
    for idx, alt in enumerate(alternatives):
        if idx > 0:
            print(f"[BG] Waiting 11s before alternative {idx+1} to respect Replicate rate limit...")
            time.sleep(11)
        print(f"[BG] Generating image for alternative {idx+1}: {alt.clothing_type}")
        attach_ai_images(alt, gender, idx + 1, user_preferences)
        results.append({
            "index": idx,
            "image_url": alt.image_url or "",
            "image_urls": alt.image_urls or [],
            "sketch_url": alt.sketch_url or ""
        })
        # Update job store incrementally so frontend gets images ASAP
        with _image_jobs_lock:
            _image_jobs[job_id]["alternatives"] = list(results)
            _image_jobs[job_id]["completed"] = len(results)

    with _image_jobs_lock:
        _image_jobs[job_id]["status"] = "done"
    print(f"[BG] Job {job_id} complete — all alternative images generated.")


# --- Request Pydantic Model ---

class RecommendationRequest(BaseModel):
    gender: str = Field(..., description="Target gender: Male, Female, or Other")
    occasion: str = Field(..., description="Target occasion, e.g., Wedding, Business Meeting, Diwali")
    culture: str = Field(..., description="Cultural context, e.g., South Asian, Western, Indo-Western")
    budget: Optional[str] = Field(default="Medium", description="Optional budget tier")
    season: str = Field(..., description="Season or climate: Summer, Winter, Monsoon, Mild")
    desired_garment: Optional[str] = Field(default="", description="Optional specific preferred garment type")
    preferences: Optional[str] = Field(default="", description="Optional preferred colors or style preferences")
    additional_notes: Optional[str] = Field(default="", description="Optional extra notes or requirements")

# --- Endpoints ---

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Returns the API health status."""
    has_replicate = bool(os.getenv("REPLICATE_API_TOKEN", "").strip())
    llm = get_llm_config()
    return {
        "status": "ok",
        "ai_provider": llm["provider"],
        "ai_model": llm["model"],
        "ai_key_configured": bool(llm["api_key"]),
        "image_engine": os.getenv("IMAGE_ENGINE", "nano-banana"),
        "replicate_configured": has_replicate,
        "rate_limit": "10 requests/min",
        "mode": "progressive_image_loading"
    }


@app.post(
    "/recommend",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK
)
def get_fashion_recommendation(request: RecommendationRequest):
    """
    Progressive Recommendation Endpoint.
    Pipeline:
    1. Input validation via Pydantic
    2. Rule Engine knowledge-base evaluation
    3. AI outfit generation (text + primary image) — returned fast
    4. Alternative images generated in background thread
    5. Response includes job_id for frontend to poll /image-status/{job_id}
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

        # generate_recommendation_ai now only generates PRIMARY image (fast ~10s)
        recommendation = generate_recommendation_ai(fashion_context)

        # Create a background job for alternative images
        job_id = str(uuid.uuid4())
        with _image_jobs_lock:
            _image_jobs[job_id] = {
                "status": "pending",
                "total": len(recommendation.alternatives),
                "completed": 0,
                "alternatives": []
            }

        # Kick off background thread for alternatives (passes user color prefs so images stay on-palette)
        t = threading.Thread(
            target=_generate_alternative_images_bg,
            args=(job_id, recommendation.alternatives, request.gender, request.preferences or ""),
            daemon=True
        )
        t.start()

        # Attach job_id to response so frontend can poll
        recommendation.image_job_id = job_id
        return recommendation

    except Exception as e:
        print(f"[ERROR] Recommendation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate fashion recommendation: {str(e)}"
        )


@app.get("/image-status/{job_id}", status_code=status.HTTP_200_OK)
def get_image_status(job_id: str):
    """
    Poll this endpoint to get alternative outfit images as they're generated.
    Returns status (pending/done), completed count, and image URLs so far.
    """
    with _image_jobs_lock:
        job = _image_jobs.get(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found or expired.")

    return {
        "job_id": job_id,
        "status": job["status"],          # "pending" or "done"
        "total": job["total"],
        "completed": job["completed"],
        "alternatives": job["alternatives"]   # list grows as images finish
    }


@app.post(
    "/generate-sketch",
    response_model=SketchResponse,
    status_code=status.HTTP_200_OK
)
def create_fashion_sketch(request: SketchRequest):
    """Generates a bespoke AI fashion sketch via Replicate Flux."""
    try:
        return generate_fashion_sketch(request)
    except Exception as e:
        print(f"[ERROR] Sketch generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate sketch: {str(e)}"
        )


@app.post("/preview-look", response_model=PreviewLookResponse, status_code=status.HTTP_200_OK)
def preview_look(request: PreviewLookRequest):
    """Restyle the live-preview model photo in the chosen colours / fabric / mood (Nano Banana image edit)."""
    if not request.image.startswith("data:image/"):
        raise HTTPException(status_code=400, detail="image must be a data URI")
    if len(request.image) > 3_000_000:
        raise HTTPException(status_code=413, detail="image too large")
    result = generate_preview_look(request)
    if not result.image_url:
        raise HTTPException(status_code=502, detail="Image generation failed. Check REPLICATE_API_TOKEN and credits.")
    return result


@app.post("/virtual-try-on", response_model=TryOnResponse, status_code=status.HTTP_200_OK)
def virtual_try_on(request: TryOnRequest):
    """Show the user (camera / uploaded photo) wearing a generated outfit, head to toe."""
    for name, value in (("person_image", request.person_image), ("outfit_image", request.outfit_image)):
        if not value.startswith("data:image/"):
            raise HTTPException(status_code=400, detail=f"{name} must be an image data URI")
        if len(value) > 6_000_000:
            raise HTTPException(status_code=413, detail=f"{name} is too large (max ~4 MB)")
    result = generate_virtual_try_on(request)
    if not result.image_url:
        raise HTTPException(status_code=502, detail=result.error or "Try-on generation failed. Please try again.")
    return result


# --- Try-on pattern designer, saved looks and trends ---

@app.post("/tryon-pattern", response_model=community.PatternResponse)
def tryon_pattern(request: community.PatternRequest):
    """Restyle the fabric pattern of a generated try-on photo (Nano Banana image edit)."""
    if request.pattern not in community.PATTERNS:
        raise HTTPException(status_code=400, detail="Unknown pattern.")
    if not community.generated_file_from_url(request.image_url):
        raise HTTPException(status_code=400, detail="This try-on image is no longer available. Generate it again.")
    result = community.apply_pattern(request, call_nano_banana, store_image)
    if not result.image_url:
        raise HTTPException(status_code=502, detail=result.error or "Pattern generation failed.")
    return result


@app.get("/patterns")
def list_patterns():
    return [{"name": k, "description": v} for k, v in community.PATTERNS.items()]


@app.post("/tryons", response_model=community.TryOnEntry)
def save_tryon(request: community.SaveTryOnRequest):
    """Save a try-on privately ("My looks") or share it on What Others (requires consent)."""
    if not community.valid_owner(request.owner_id):
        raise HTTPException(status_code=400, detail="Invalid owner id.")
    try:
        return community.save_try_on(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/tryons", response_model=List[community.TryOnEntry])
def list_tryons(owner_id: str = "", scope: str = "shared"):
    """scope=shared -> everyone's shared looks; scope=mine -> this browser's saved looks."""
    if scope not in ("shared", "mine"):
        raise HTTPException(status_code=400, detail="scope must be 'shared' or 'mine'")
    if scope == "mine" and not community.valid_owner(owner_id):
        raise HTTPException(status_code=400, detail="Invalid owner id.")
    return community.list_try_ons(owner_id, scope)


@app.delete("/tryons/{item_id}")
def delete_tryon(item_id: str, owner_id: str):
    if not community.valid_owner(owner_id) or not community.delete_try_on(item_id, owner_id):
        raise HTTPException(status_code=404, detail="Saved look not found.")
    return {"deleted": item_id}


class DiscardRequest(BaseModel):
    image_urls: List[str]


@app.post("/tryons/discard")
def discard_tryon(request: DiscardRequest):
    """'Don't save': delete the generated try-on images from this server."""
    return {"deleted": community.discard_generated(request.image_urls)}


@app.get("/trends")
def get_trends():
    return community.trends_payload()


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True, app_dir=backend_dir)
