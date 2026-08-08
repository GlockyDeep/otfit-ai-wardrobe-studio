# AI-Assisted Fashion Design Recommendation System

## 1. Project Goal

Build a complete working MVP for a Final Year B.Tech project called:

**AI-Assisted Fashion Design Recommendation System**

The application should behave like a beginner-level fashion designer.

A user provides an occasion and fashion preferences.

The system generates a complete outfit recommendation including:

* Clothing type
* Silhouette
* Colors
* Fabric
* Embroidery or pattern
* Accessories
* Footwear
* Hairstyle
* Makeup where appropriate
* Styling tips
* Design rationale
* Two alternative outfits

This is a **fashion design recommendation system**, not an e-commerce product recommendation system.

---

# 2. MVP Objective

The MVP must be suitable for a project review/demo.

Prioritize:

1. Working functionality
2. Professional UI
3. Reliable structured AI output
4. Explainable recommendations
5. Clean architecture
6. Easy future expansion

Do NOT over-engineer the MVP.

---

# 3. Technology Stack

Use the following stack unless there is a strong technical reason not to.

## Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* shadcn/ui when useful

Prefer pure Tailwind when adding shadcn would create unnecessary complexity.

## Backend

* Python
* FastAPI
* Pydantic

## AI

Use an OpenAI-compatible API.

API credentials must be loaded through environment variables.

Primary variable:

`OPENAI_API_KEY`

The implementation should support:

* OpenAI
* Groq

Provider configuration should be easy to change through environment variables.

Never hardcode an API key.

## Knowledge

Use:

`backend/knowledge_base.json`

Do NOT add:

* PostgreSQL
* MongoDB
* Firebase
* Supabase
* Vector databases
* Authentication
* Advanced RAG

for this MVP.

---

# 4. Required Folder Structure

```text
fashion-ai-mvp/
├── AGENTS.md
├── PROJECT_PLAN.md
├── README.md
│
├── backend/
│   ├── main.py
│   ├── prompts.py
│   ├── rules.py
│   ├── knowledge_base.json
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    ├── public/
    ├── package.json
    └── ...
```

Additional files may be created when technically necessary.

Do not unnecessarily restructure the project.

---

# 5. User Input

The frontend must provide a recommendation form.

Required fields:

## Gender

Options:

* Male
* Female
* Other

## Occasion

Free-text input.

Also provide suggestion chips such as:

* Wedding
* Diwali
* Business Meeting
* Casual
* Cocktail Party
* College
* Date Night
* Festival
* Formal Event

The user must still be able to type a custom occasion.

## Culture

Options:

* South Asian
* Western
* Indo-Western
* Middle Eastern
* East Asian
* African

## Budget

Options:

* Low
* Medium
* High

## Season / Climate

Options:

* Summer
* Winter
* Monsoon
* Mild

## Preferred Colors / Style

Optional text field.

Examples:

* Dark colors
* Minimalist
* Pastels
* Streetwear inspired
* Regal
* Traditional

## Additional Notes

Optional text field.

---

# 6. Recommendation Output

Every successful recommendation must contain:

## Primary Outfit

* Clothing type
* Silhouette
* Colors
* Fabric
* Embroidery or pattern
* Accessories
* Footwear
* Hairstyle
* Makeup
* Styling tips
* Rationale

## Alternatives

Exactly two alternative outfit recommendations.

Each alternative should follow the same structure as the primary outfit.

---

# 7. Required JSON Schema

The backend must expose a stable structured response.

Expected recommendation structure:

```json
{
  "primary_outfit": {
    "clothing_type": "",
    "silhouette": "",
    "colors": [],
    "fabric": "",
    "embroidery_or_pattern": "",
    "accessories": [],
    "footwear": "",
    "hairstyle": "",
    "makeup": "",
    "styling_tips": [],
    "rationale": ""
  },
  "alternatives": [
    {
      "clothing_type": "",
      "silhouette": "",
      "colors": [],
      "fabric": "",
      "embroidery_or_pattern": "",
      "accessories": [],
      "footwear": "",
      "hairstyle": "",
      "makeup": "",
      "styling_tips": [],
      "rationale": ""
    },
    {
      "clothing_type": "",
      "silhouette": "",
      "colors": [],
      "fabric": "",
      "embroidery_or_pattern": "",
      "accessories": [],
      "footwear": "",
      "hairstyle": "",
      "makeup": "",
      "styling_tips": [],
      "rationale": ""
    }
  ]
}
```

Use Pydantic models to validate the response.

Do not rely only on prompt instructions for JSON correctness.

---

# 8. Backend API

Create:

`POST /recommend`

The endpoint should accept:

```json
{
  "gender": "",
  "occasion": "",
  "culture": "",
  "budget": "",
  "season": "",
  "preferences": "",
  "additional_notes": ""
}
```

The endpoint must:

1. Validate input.
2. Load relevant fashion knowledge.
3. Apply deterministic fashion rules.
4. Construct contextual fashion guidance.
5. Build the LLM prompt.
6. Call the configured AI provider.
7. Request structured JSON output where supported.
8. Parse and validate the generated result.
9. Return the validated response.

Also create:

`GET /health`

Expected response:

```json
{
  "status": "ok"
}
```

---

# 9. Hybrid Recommendation Engine

The system must NOT simply send the raw form to the LLM.

Use a hybrid pipeline:

```text
User Input
    ↓
Rule Engine
    ↓
Knowledge Base Filtering
    ↓
Relevant Fashion Context
    ↓
LLM
    ↓
Pydantic Validation
    ↓
API Response
```

Rules should constrain or guide the LLM without eliminating its ability to produce creative recommendations.

---

# 10. Rule Engine

Implement rule processing in:

`backend/rules.py`

Examples:

## Season

Summer:

* Cotton
* Linen
* Chiffon
* Lightweight silk
* Breathable fabrics

Winter:

* Wool blends
* Velvet
* Brocade
* Layered fabrics

Monsoon:

* Lightweight fabrics
* Quick-drying materials
* Avoid overly heavy garments where appropriate

## Occasion

Wedding:

* Elevated fabrics
* Richer color combinations
* Appropriate embellishment
* Formal silhouettes

Business Meeting:

* Restrained colors
* Structured silhouettes
* Minimal embellishment
* Professional accessories

Casual:

* Comfortable fabrics
* Relaxed silhouettes
* Simpler accessories

## Diwali

Prefer combinations such as:

* Jewel tones
* Bright festive colors
* Silk
* Organza
* Brocade
* Traditional embroidery

Do not hardcode only these examples.

Use the knowledge base to support additional combinations.

---

# 11. Fashion Knowledge Base

Create:

`backend/knowledge_base.json`

It should contain useful real fashion knowledge for the MVP.

Organize information into categories such as:

```json
{
  "occasions": {},
  "cultures": {},
  "garments": {},
  "color_palettes": {},
  "fabrics": {},
  "embroidery_and_motifs": {},
  "season_rules": {},
  "budget_rules": {}
}
```

Include a reasonable selection of:

### South Asian clothing

Examples:

* Saree
* Lehenga
* Salwar suit
* Kurta
* Sherwani
* Bandhgala
* Dhoti
* Indo-Western sets

### Western clothing

Examples:

* Suit
* Blazer combinations
* Dresses
* Shirts
* Trousers
* Co-ord sets
* Cocktail wear
* Casual wear

Include useful information concerning:

* Appropriate occasions
* Gender suitability
* Climate
* Silhouettes
* Fabrics
* Colors
* Embroidery
* Motifs
* Styling considerations

The knowledge base should contain enough data to visibly influence generated recommendations.

---

# 12. AI Prompt

Implement prompt generation in:

`backend/prompts.py`

The system prompt should establish that the model is a professional fashion designer.

The model must:

* Consider occasion
* Consider culture
* Consider gender
* Consider climate
* Consider budget
* Respect user color/style preferences
* Use supplied knowledge-base context
* Provide realistic combinations
* Avoid random incompatible garments
* Explain design decisions
* Produce two meaningfully different alternatives

The LLM should not recommend specific products, stores or shopping links.

The recommendations should describe fashion designs and styling concepts.

The prompt should explicitly require the defined structured output.

---

# 13. LLM Provider Configuration

Support configuration through environment variables.

Create:

`.env.example`

Example variables:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=
GROQ_API_KEY=
GROQ_MODEL=
```

Exact model names should be configurable rather than deeply hardcoded.

The backend should provide a clear error when:

* API credentials are missing
* Provider configuration is invalid
* API request fails
* AI returns invalid data

Never expose API keys to the frontend.

---

# 14. Frontend

Create a visually polished fashion-oriented interface.

The design should feel:

* Elegant
* Minimal
* Modern
* Premium
* Easy to understand

Avoid making it look like a generic admin dashboard.

---

# 15. Frontend Pages / Sections

The MVP can remain a single-page application.

## Landing / Form

Include:

* Project title
* Short explanation
* Recommendation form
* Occasion chips
* Submit button

## Loading State

After submission:

* Disable duplicate submissions
* Show a polished loading indicator
* Explain that the outfit is being designed

## Results

Display the primary outfit prominently.

Use sections/cards for:

* Outfit
* Colors
* Fabric
* Embroidery/pattern
* Accessories
* Footwear
* Hairstyle
* Makeup
* Styling tips
* Design rationale

Then show:

**Alternative 1**

and

**Alternative 2**

Provide an obvious way to create another recommendation.

---

# 16. Error Handling

Frontend should handle:

* Backend unavailable
* Invalid form input
* AI provider unavailable
* Recommendation generation failure

Show understandable messages instead of raw stack traces.

Backend should log useful diagnostic information.

Do not expose internal secrets or API credentials.

---

# 17. Responsive Design

The application must work properly on:

* Desktop
* Tablet
* Mobile

Desktop should be prioritized for the project demo.

---

# 18. Implementation Phases

Complete these phases sequentially.

## Phase 1 — Project Inspection

Before changing anything:

1. Inspect existing repository files.
2. Determine what has already been implemented.
3. Preserve working code.
4. Compare existing implementation against this specification.

Do not recreate the entire application if substantial working code already exists.

---

## Phase 2 — Backend Foundation

Implement:

* FastAPI application
* Request models
* Response models
* CORS
* `/health`
* `/recommend`
* Environment configuration

Confirm that the application starts successfully.

---

## Phase 3 — Fashion Knowledge Base

Implement:

* `knowledge_base.json`
* Occasion data
* Culture data
* Garments
* Colors
* Fabrics
* Embroidery
* Seasonal rules
* Budget guidance

Validate the JSON.

---

## Phase 4 — Rule Engine

Implement:

`rules.py`

It should:

1. Read knowledge-base data.
2. Evaluate user inputs.
3. Select relevant garments.
4. Select season-compatible materials.
5. Identify suitable colors.
6. Identify appropriate embellishments.
7. Return structured fashion context.

Add simple tests or manual verification for representative inputs.

---

## Phase 5 — AI Integration

Implement:

`prompts.py`

and AI-provider calling logic.

Ensure:

* OpenAI compatibility
* Groq compatibility
* Environment-based provider selection
* Structured output parsing
* Pydantic validation
* Graceful error handling

---

## Phase 6 — Frontend Foundation

Create React + Vite + TypeScript frontend.

Configure Tailwind.

Build reusable components where useful.

Do not create unnecessary abstraction.

---

## Phase 7 — Recommendation Form

Implement all required inputs.

Add:

* Validation
* Suggestion chips
* Loading state
* API connection
* Error handling

---

## Phase 8 — Results UI

Create polished result presentation.

Primary recommendation should have visual hierarchy over alternatives.

Ensure long rationale and styling content remains readable.

---

## Phase 9 — Integration

Connect frontend and backend.

Test at minimum:

1. South Asian wedding
2. Business meeting
3. Casual college outfit
4. Diwali outfit
5. Western cocktail party

Confirm the frontend can display all returned fields.

---

## Phase 10 — Quality Pass

Before considering the project complete:

* Run backend
* Build frontend
* Fix TypeScript errors
* Fix Python errors
* Test API
* Check JSON files
* Remove obviously unused code
* Check responsive UI
* Check error states

Do not declare completion if build errors remain.

---

## Phase 11 — Documentation

Create a clear `README.md`.

It must explain:

* Project purpose
* Architecture
* Features
* Technology stack
* Folder structure
* Requirements
* Backend setup
* Frontend setup
* Environment variables
* How to run the application
* Example recommendation
* API endpoint
* Future improvements

Also include exact commands for Windows where possible.

---

# 19. Test Scenarios

Use these scenarios during verification.

## Test 1

Gender: Female
Occasion: Diwali celebration
Culture: South Asian
Budget: Medium
Season: Mild
Preference: Jewel tones, elegant traditional style

## Test 2

Gender: Male
Occasion: Business meeting
Culture: Western
Budget: Medium
Season: Summer
Preference: Professional and minimal

## Test 3

Gender: Female
Occasion: Wedding guest
Culture: Indo-Western
Budget: High
Season: Winter
Preference: Contemporary but culturally inspired

## Test 4

Gender: Male
Occasion: College
Culture: Western
Budget: Low
Season: Summer
Preference: Casual and comfortable

## Test 5

Gender: Female
Occasion: Cocktail party
Culture: Western
Budget: High
Season: Mild
Preference: Elegant and modern

---

# 20. Definition of Done

The MVP is complete only when:

* Backend starts successfully.
* Frontend starts successfully.
* Frontend production build succeeds.
* `/health` works.
* `/recommend` works.
* Form inputs are validated.
* Knowledge base affects recommendations.
* Rule engine works.
* AI provider integration works.
* Output follows the defined schema.
* Primary outfit is displayed.
* Exactly two alternatives are displayed.
* Styling tips are displayed.
* Rationale is displayed.
* Errors are handled cleanly.
* API keys are not exposed.
* README contains setup instructions.
* Five representative scenarios have been checked.
* There are no known blocking runtime errors.

---

# 21. Future Scope

Do NOT implement these unless the MVP is fully complete.

Potential future features:

* Authentication
* User profiles
* Saved designs
* PostgreSQL
* Vector database
* RAG
* Larger fashion dataset
* Image generation
* Outfit visualization
* Trend analysis
* Designer feedback
* Recommendation history
* Body-type-aware styling
* Regional fashion knowledge
* Admin interface

The MVP architecture should make future additions possible without implementing them now.


## Demo Reliability Requirement

If the configured LLM provider is unavailable, the backend should
optionally fall back to a deterministic recommendation generated from
the knowledge base and rule engine.

The fallback must return the same response schema.

The response may indicate internally that fallback mode was used,
but the frontend must remain functional.

This exists to ensure that the university demo does not completely
fail because of an external AI API outage.