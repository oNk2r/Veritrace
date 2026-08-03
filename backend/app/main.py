from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.waste import router as waste_router
from app.database import init_db

app = FastAPI(title="ReSource AI API")

# Enable CORS for http://localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_client():
    """Initializes SQLite database and tables on startup."""
    init_db()

app.include_router(waste_router, prefix="/api")

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "version": "1.0",
        "product": "ReSource AI"
    }
