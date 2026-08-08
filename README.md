# AI-Assisted Fashion Design Recommendation System MVP

A Final Year B.Tech project MVP for a **Rule-Guided AI Fashion Recommendation System**. 

The application behaves like a personal fashion designer assistant. A user inputs their gender identity, occasion, cultural heritage context, budget tier, climate/season, and optional style preferences. The system evaluates the inputs against a fashion knowledge base and rule engine, then synthesizes a complete **Primary Outfit Ensemble** alongside **Two Alternative Outfit Concepts**, complete with fabrics, colors, silhouettes, embroidery/motifs, footwear, hairstyles, makeup/grooming, styling tips, design rationale, and **Visual Concept Reference Image Previews**.

---

## 🌟 Architecture & Hybrid Recommendation Pipeline

The recommendation system utilizes a deterministic hybrid pipeline to ensure fashion rule compliance, cultural accuracy, and seasonal appropriateness:

```text
       ┌──────────────────────────────────────────────┐
       │                 User Input                   │
       │ (Gender, Occasion, Culture, Budget, Season)  │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │                 Rule Engine                  │
       │             (backend/rules.py)               │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │           Knowledge Base Filtering           │
       │        (backend/knowledge_base.json)         │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │          Synthesized Fashion Context         │
       │    (Candidate Garments, Fabrics, Palettes)   │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │               AI Provider / LLM              │
       │      (OpenAI / Groq API or Fallback)         │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │             Pydantic Validation              │
       │          & Garment Image Resolver            │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │     Structured Response + High-Res Image     │
       └──────────────────────────────────────────────┘
```

---

## 📸 Visual Concept Reference Image Feature (Option A)

Each recommended ensemble (Primary and Alternatives) is paired with a **high-resolution fashion concept reference image (`image_url`)** mapped directly from a curated garment image library in `knowledge_base.json`.

**Benefits**:
- ⚡ **0 ms Overhead**: Instant loading without API latency.
- 🛡️ **100% Demo Reliability**: Guaranteed high-fashion photography without AI image distortions or broken external links.
- 🎨 **Visual Appeal**: Gives each recommendation card a visual fashion presentation.

---

## 🛠️ Technology Stack

### Backend
- **Language**: Python 3.10+
- **Framework**: FastAPI
- **Data Validation**: Pydantic v2
- **Server**: Uvicorn
- **AI Integrations**: OpenAI API standard (`httpx`, `openai` SDK), supporting both OpenAI and Groq providers.

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Custom Glassmorphism Theme
- **Typography**: Playfair Display (Serif) + Plus Jakarta Sans (Sans)
- **Icons**: Lucide React

---

## 📂 Repository Structure

```text
fashion-ai-mvp/
├── AGENTS.md                   # Autonomous agent instructions & execution rules
├── PROJECT_PLAN.md             # Complete MVP specifications & definition of done
├── README.md                   # Project documentation & execution guide
├── .gitignore                  # Git exclusion rules
│
├── backend/
│   ├── main.py                 # FastAPI app, endpoints (/health, /recommend), CORS
│   ├── rules.py                # Deterministic rule engine & knowledge evaluator
│   ├── prompts.py              # AI prompt generation, LLM caller & image resolver
│   ├── knowledge_base.json     # Fashion dataset & curated garment image library
│   ├── test_api.py             # FastAPI unit & integration tests
│   ├── test_scenarios.py       # End-to-end verification across 5 project scenarios
│   ├── requirements.txt        # Python backend dependencies
│   ├── .env.example            # Environment variables template
│   └── .env                    # Active environment config (ignored by git)
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Header.tsx             # Studio header with live indicators
    │   │   ├── RecommendationForm.tsx # Interactive form with occasion-aware chips
    │   │   ├── LoadingOverlay.tsx     # Animated design studio progress steps
    │   │   ├── OutfitCard.tsx         # Outfit display card with concept image preview
    │   │   └── ResultsView.tsx        # Collection showcase & summary copy actions
    │   ├── types.ts                   # TypeScript interfaces matching backend models
    │   ├── App.tsx                    # Main state manager & API connector
    │   ├── index.css                  # Tailwind imports & typography setup
    │   └── main.tsx                   # React entry point
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

---

## 🚀 Quick Start & Execution Guide (Windows)

### Prerequisites
- **Python**: Python 3.10 or higher
- **Node.js**: Node 18+ and `npm`

---

### One-Click Launch

Double-click **[start.bat](file:///c:/Myfinaltry/fashion-ai-mvp/start.bat)** in Windows File Explorer to automatically launch both backend and frontend servers in separate windows.

---

### Manual Launch

#### 1. Backend Setup
```powershell
cd c:\Myfinaltry\fashion-ai-mvp
pip install -r backend/requirements.txt
python backend/main.py
```
Backend runs at `http://localhost:8000`. Swagger API docs at `http://localhost:8000/docs`.

#### 2. Frontend Setup
```powershell
cd c:\Myfinaltry\fashion-ai-mvp\frontend
npm.cmd install
npm.cmd run dev
```
Frontend runs at `http://localhost:5173`.

---

## 🧪 Testing & Verification

Run automated backend and scenario tests:

```powershell
# Run API endpoint unit test
python backend/test_api.py

# Run verification across the 5 project scenarios
python backend/test_scenarios.py
```

### Verified Test Scenarios
- **Scenario 1**: Female / Diwali / South Asian / Medium Budget / Mild Climate
- **Scenario 2**: Male / Business Meeting / Western / Medium Budget / Summer Climate
- **Scenario 3**: Female / Wedding Guest / Indo-Western / High Budget / Winter Climate
- **Scenario 4**: Male / College / Western / Low Budget / Summer Climate
- **Scenario 5**: Female / Cocktail Party / Western / High Budget / Mild Climate

---

## 📡 API Endpoint Reference

### `GET /health`
Returns system health status.

**Response:**
```json
{
  "status": "ok"
}
```

### `POST /recommend`
Generates a complete fashion recommendation.

**Request Body:**
```json
{
  "gender": "Female",
  "occasion": "Diwali celebration",
  "culture": "South Asian",
  "budget": "Medium",
  "season": "Mild",
  "preferences": "Jewel tones, elegant traditional style",
  "additional_notes": "Attending family gathering"
}
```

**Response Schema:**
```json
{
  "primary_outfit": {
    "clothing_type": "Banarasi Silk Lehenga Choli with Zardozi Embroidered Dupatta",
    "silhouette": "A-Line flared lehenga with structured blouse",
    "colors": ["Emerald Green", "Royal Gold", "Deep Crimson Accent"],
    "fabric": "Pure Banarasi Silk and Organza Dupatta",
    "embroidery_or_pattern": "Handcrafted Zardozi floral motifs with gold zari weave",
    "accessories": ["Kundan choker set", "Maang tikka", "Gold bangles", "Potli bag"],
    "footwear": "Embroidered Antique Gold Mojris",
    "hairstyle": "Soft low bun decorated with fresh jasmine flowers",
    "makeup": "Warm glowing skin with subtle gold eye shadow and deep berry lip color",
    "styling_tips": [
      "Drape the organza dupatta neatly across one shoulder.",
      "Choose warm gold jewelry to complement emerald and crimson tones."
    ],
    "rationale": "Designed specifically for a Diwali celebration in a mild climate...",
    "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
  },
  "alternatives": [
    {
      "clothing_type": "Contemporary Draped Silk Saree with Velvet Blouse",
      "silhouette": "Fluid pre-draped contour silhouette",
      "colors": ["Ruby Red", "Antique Copper", "Warm Champagne"],
      "fabric": "Fluid Georgette Saree with Micro-Velvet Blouse",
      "embroidery_or_pattern": "Gota Patti work along saree borders",
      "accessories": ["Chandbali statement earrings", "Embellished clutch"],
      "footwear": "Block Heel Metallic Sandals",
      "hairstyle": "Side-swept loose Hollywood waves",
      "makeup": "Classic winged eyeliner with nude crimson gloss",
      "styling_tips": ["Pre-draped pleats provide effortless elegance."],
      "rationale": "An elegant drape alternative combining traditional tones with modern cuts.",
      "image_url": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
    },
    {
      "clothing_type": "Indo-Western Anarkali Gown with Sheer Cape",
      "silhouette": "Floor-length high-waist flared gown",
      "colors": ["Mustard Yellow", "Magenta Accent", "Gold"],
      "fabric": "Chiffon and Silk Satin blend",
      "embroidery_or_pattern": "Chikankari shadow threadwork with mirror highlights",
      "accessories": ["Filigree cuff bracelet", "Pearl drop earrings"],
      "footwear": "Kolhapuri Wedge Sandals",
      "hairstyle": "Half-up braided crown",
      "makeup": "Dewy coral blush with soft brown eyeliner",
      "styling_tips": ["Lightweight chiffon cape allows breathable movement."],
      "rationale": "A lighter, contemporary Indo-Western alternative ideal for social gatherings.",
      "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
    }
  ]
}
```

---

## 🔮 Future Scope & Extension Roadmap

The MVP architecture is designed for easy future scaling:
- **Live Generative AI Image Generation**: Integrate DALL-E 3 / Stable Diffusion APIs to generate custom 3D outfit renderings directly from prompts.
- **Body-Type & Skin-Tone Awareness**: Tailor silhouettes based on body measurements and skin undertones.
- **User Accounts & Wardrobe Saving**: Allow users to bookmark designs and create personal style lookbooks.
- **PostgreSQL / Vector Database Support**: Store historical recommendations and enable semantic fashion trend search.
