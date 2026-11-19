import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes.chart import router as chart_router
from app.routes.match import router as match_router
from app.routes.history import router as history_router
from app.routes.auth import router as auth_router
from app.database import get_db, ensure_auth_indexes

# Always load backend/.env regardless of shell cwd (e.g. project root).
_BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(_BACKEND_DIR / ".env")

app = FastAPI(
    title="Astrology API",
    description="Birth chart & 12-house calculator using Swiss Ephemeris",
    version="1.0.0",
)

_default_origins = [
    "https://kundli.astrogyan.org",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3014",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3014",
]
_extra_origins = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "").split(",")
    if o.strip()
]
if os.getenv("FRONTEND_URL", "").strip():
    _extra_origins.append(os.getenv("FRONTEND_URL", "").strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=[*_default_origins, *_extra_origins],
    # Next.js dev "Network" URL (e.g. http://192.168.x.x:3000)
    allow_origin_regex=r"http://192\.168\.\d{1,3}\.\d{1,3}:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth")
app.include_router(chart_router, prefix="/api")
app.include_router(match_router, prefix="/api/match")
app.include_router(history_router, prefix="/api/history")


@app.on_event("startup")
def startup_db_check():
    """Log MongoDB connectivity at startup for easier debugging."""
    db = get_db()
    if db is None:
        print("[MongoDB] Not connected. Check MONGODB_URI in backend/.env")
    else:
        print(f"[MongoDB] Startup OK. Using database: {db.name}")
        try:
            ensure_auth_indexes()
        except Exception as exc:
            print(f"[MongoDB] Auth index setup warning: {exc}")


@app.get("/")
def root():
    return {"status": "ok", "message": "Astrology API is running"}
