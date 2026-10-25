"""
FastAPI application entrypoint.

Wires together all four independent modules:
    Module 1 - User Health & Lifestyle Profiling      (/user)
    Module 2 - ML-based Nutrient Deficiency Prediction (/predict)
    Module 3 - Chemical Engineering Nutrition Engine    (/nutrition)
    Module 4 - Recommendation Engine                   (/recommend)

Run:
    uvicorn main:app --reload
"""
from fastapi import FastAPI
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")
from fastapi.middleware.cors import CORSMiddleware

from database.db import Base, engine, run_migrations
from module1_user import routes as user_routes
from module1_user import models as user_models  # noqa: F401 - ensures table is registered
from module2_prediction import routes as prediction_routes
from module3_chemical import routes as nutrition_routes
from module4_recommendation import routes as recommendation_routes
from module5_auth import routes as auth_routes
from module5_auth import models as auth_models  # noqa: F401
from module6_blood import routes as blood_routes
from module6_blood import models as blood_models  # noqa: F401
from module7_specialist import routes as specialist_routes
from module7_specialist import models as specialist_models  # noqa: F401
from food_vision import routes as food_vision_routes
from food_vision import models as food_vision_models  # noqa: F401
from module9_rag import routes as rag_routes
from module10_live_data import routes as live_data_routes
from module11_pantry import routes as pantry_routes

# Create all tables on startup (SQLite, MVP-simple — no migrations tooling).
run_migrations()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AlteraVie - Personalized Longevity & Nutrition Platform",
    description="A modern clinical and AI platform mapping user profile and "
                "biomarkers to personalized nutrition and clinical guidelines.",
    version="0.1.0",
)

# Permissive CORS for local MVP development (React dev server on :5173).
allowed_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=os.getenv("ALLOWED_ORIGIN_REGEX", r"https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_routes.router)
app.include_router(prediction_routes.router)
app.include_router(nutrition_routes.router)
app.include_router(recommendation_routes.router)
app.include_router(auth_routes.router)
app.include_router(blood_routes.router)
app.include_router(specialist_routes.router)
app.include_router(food_vision_routes.router)
app.include_router(rag_routes.router)
app.include_router(live_data_routes.router)
app.include_router(pantry_routes.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "message": "Nutrition MVP API is running.",
        "modules": ["auth", "user", "predict", "nutrition", "recommend", "blood-report", "specialists", "food-vision", "chat", "live-data", "pantry"],
        "docs": "/docs",
    }

# trigger reload
