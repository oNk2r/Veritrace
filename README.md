# ReSource AI &mdash; Turning Waste into Opportunity with AI

**ReSource AI** is a premium, AI-powered Circular Economy Decision Engine designed to help businesses reduce waste. By analyzing byproduct streams (e.g., coffee grounds, sawdust, plastic scrap) and matching them with regional buyer needs, ReSource AI estimates carbon offsets, diverted landfill mass, shipping emissions, and potential revenues in seconds.

---

## Key Features
* **Intelligent Material Mapping & Synonym Recognition**: Translates raw descriptions (e.g., "used coffee powder") into standardized material taxonomy (`coffee_grounds`) locally.
* **Geographical Logistics**: Applies the Haversine formula on latitude/longitude coordinate offsets to measure exact delivery routes.
* **Circular Impact Calculator**: Simulates Scope 3 transport footprints and computes net carbon offsets:
  $$\text{CO2 Saved} = \text{Quantity}_{\text{monthly}} \times (\text{Factor}_{\text{disposal}} - \text{Factor}_{\text{reuse}}) - \text{Transport Emissions}$$
* **Gemini Reasoning Engine**: Generates markdown compatibility audits, operational checklists, and custom B2B outreach partnership email templates.
* **Aggregated Portfolio Dashboard**: Tracks company-wide circular actions, monthly revenue generated, and active regional partnerships with live Recharts visualizations.
* **SQLite Persistence**: Stores registered evaluations in a local `waste_logs` database with interactive delete triggers.

---

## Technical Stack & Architecture

### Backend: FastAPI (Python) & SQLite
* **FastAPI Framework**: High-performance asynchronous API endpoints routing requests to `/api/waste/analyze` and `/api/waste/dashboard`.
* **Gemini 2.5 Flash**: Evaluates material chemistry suitability, logs operations timelines, and synthesizes personalized B2B outreach emails.
* **Local CSV Databases**: Caches catalogs on startup for offline operation:
  * `materials.csv` & `waste_types.csv` (synonyms taxonomy)
  * `reuse_opportunities.csv` & `industries.csv` (circular paths)
  * `business_directory.csv` (buyers details & coordinates near Pune)
  * `carbon_factors.csv` & `transport_estimates.csv` (emission multipliers)
* **SQLite database**: Persists data locally inside `resource_ai.db`.

### Frontend: Vite (React 19 & TypeScript)
* **Single-Page Application (SPA)**: Includes responsive dashboard widgets, an intake wizard, match details cards, operational checklists, and dynamic email composers.
* **Tailwind CSS v4**: Styled with a dark glassmorphic design system featuring hover glow animations (`glow-card`), OKLCH layout palettes, and typography grids.
* **Charts**: Recharts render cumulative material carbon savings and revenue trends.

---

## Directory Structure

```
ReSource AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── waste.py           # API Route handlers (analyze, dashboard, delete)
│   │   ├── data/
│   │   │   ├── materials.csv      # Standard materials taxonomies
│   │   │   ├── waste_types.csv    # Synonym mapping rules
│   │   │   ├── reuse_opportunities.csv # Re-routing pathways and pricing
│   │   │   ├── industries.csv     # Industry waste listings
│   │   │   ├── business_directory.csv # Local buyer coordinates and capacities
│   │   │   ├── carbon_factors.csv # Methane and Circular offsets values
│   │   │   └── transport_estimates.csv # Shipping transport carbon factors
│   │   ├── database.py            # SQLite log connection handles and startup creation
│   │   ├── main.py                # Server initialization and table bootstrap
│   │   ├── schemas/
│   │   │   └── waste.py           # Pydantic schema validation structures
│   │   └── services/
│   │       ├── calculator.py      # Haversine and logistical impact formulas
│   │       └── llm_service.py     # Gemini reasoning prompts and offline fallbacks
│   ├── tests/
│   │   └── test_waste.py          # Pytest backend validation suites
│   ├── resource_ai.db             # Local SQLite database (created on boot)
│   ├── requirements.txt           # Python dependency manifest
│   └── .gitignore                 # Python-specific ignore rules
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── RevealLayer.tsx    # Interactive canvas/mouse hover background effect
    │   ├── App.tsx                # Main single-page application dashboard and views
    │   ├── index.css              # Styling, utility variables, Tailwind CSS v4 directives
    │   └── main.tsx               # App entry point
    ├── index.html                 # Main HTML entry point
    ├── vite.config.ts             # Vite configuration
    ├── tsconfig.json              # TypeScript compiler configuration
    ├── package.json               # Frontend dependencies and npm scripts
    └── .gitignore                 # Frontend-specific ignore rules
```

---

## Setup & Running Guide

### 1. Prerequisites
* Python 3.10+
* Node.js 18+
* A valid Gemini API Key from Google AI Studio.

### 2. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Linux/macOS**:
     ```bash
     source venv/bin/activate
     ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify your `backend/.env` file contains:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. Run the dev server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
6. Run the test suite:
   ```powershell
   $env:PYTHONPATH="."
   venv\Scripts\pytest tests
   ```

### 3. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.