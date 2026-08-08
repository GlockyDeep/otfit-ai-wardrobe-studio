# AI-Assisted Fashion Design Recommendation System MVP

A Final Year B.Tech project MVP for a **Rule-Guided AI Fashion Recommendation System**. 

The application behaves like a personal fashion designer assistant. A user inputs their gender identity, occasion, cultural heritage context, budget tier, climate/season, and optional style preferences. The system evaluates the inputs against a fashion knowledge base and rule engine, then synthesizes a complete **Primary Outfit Ensemble** alongside **Two Alternative Outfit Concepts**, complete with fabrics, colors, silhouettes, embroidery/motifs, footwear, hairstyles, makeup/grooming, styling tips, and design rationale.

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
       │          (Primary + 2 Alternatives)          │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │            Structured API Response           │
       └──────────────────────────────────────────────┘
```

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
│   ├── prompts.py              # AI prompt generation, LLM caller & offline fallback
│   ├── knowledge_base.json     # Fashion dataset (occasions, cultures, fabrics, motifs)
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
    │   │   ├── RecommendationForm.tsx # Interactive form with occasion chips
    │   │   ├── LoadingOverlay.tsx     # Animated design studio progress steps
    │   │   ├── OutfitCard.tsx         # Primary & Alternative outfit display card
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

### 1. Backend Setup

1. Open PowerShell or Command Prompt in the repository root:
   ```powershell
   cd c:\Myfinaltry\fashion-ai-mvp
   ```

2. Install Python dependencies:
   ```powershell
   pip install -r backend/requirements.txt
   ```

3. Configure Environment Variables:
   A `.env` file is pre-configured in `backend/.env`. You can edit `backend/.env` to supply your OpenAI or Groq API key:
   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   PORT=8000
   ```
   *Note: If no API key is provided, the system automatically uses its built-in rule-engine fallback generator, ensuring 100% offline functionality for testing and review.*

4. Start the FastAPI Backend Server:
   ```powershell
   python backend/main.py
   ```
   The backend will run at: `http://localhost:8000`  
   API Docs (Swagger UI): `http://localhost:8000/docs`

---

### 2. Frontend Setup

1. Open a new terminal window in `frontend`:
   ```powershell
   cd c:\Myfinaltry\fashion-ai-mvp\frontend
   ```

2. Install dependencies:
   ```powershell
   npm.cmd install
   ```

3. Start the Vite Development Server:
   ```powershell
   npm.cmd run dev
   ```
   The frontend app will launch at `http://localhost:5173`.

4. Build for Production:
   ```powershell
   npm.cmd run build
   ```

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
    "rationale": "Designed specifically for a Diwali celebration in a mild climate..."
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
      "rationale": "An elegant drape alternative combining traditional tones with modern cuts."
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
      "rationale": "A lighter, contemporary Indo-Western alternative ideal for social gatherings."
    }
  ]
}
```

---

## 🔮 Future Scope & Extension Roadmap

The MVP architecture is designed for easy future scaling:
- **Image Generation Integration**: Generate visual outfit previews using Stable Diffusion or DALL-E.
- **Body-Type & Skin-Tone Awareness**: Tailor silhouettes based on body measurements and skin undertones.
- **User Accounts & Wardrobe Saving**: Allow users to bookmark designs and create personal style lookbooks.
- **PostgreSQL / Vector Database Support**: Store historical recommendations and enable semantic fashion trend search.
