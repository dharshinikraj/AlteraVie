"""Database configuration for AlteraVie."""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_SQLITE = BACKEND_DIR / "nutrition_mvp.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE.as_posix()}").strip()
# Accept standard provider connection strings while using psycopg v3 (no psycopg2 dependency).
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgres://"):]
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def run_migrations():
    """Lightweight compatibility migrations for the bundled SQLite database."""
    if not DATABASE_URL.startswith("sqlite"):
        return
    import sqlite3
    db_path = DATABASE_URL.replace("sqlite:///", "", 1)
    if not os.path.exists(db_path):
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    tables = {r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
    if "user_profiles" in tables:
        cols = [
            *( (c, "BOOLEAN DEFAULT 0") for c in [
                "symptom_fatigue","symptom_hair_loss","symptom_pale_skin","symptom_muscle_cramps","symptom_bone_pain","symptom_frequent_illness",
                "symptom_brittle_nails","symptom_dizziness","symptom_numbness_tingling","symptom_slow_wound_healing","symptom_bleeding_gums","symptom_brain_fog","symptom_dry_skin",
                "medical_diabetes","medical_hypertension","medical_thyroid_disorder","medical_celiac_disease","medical_kidney_disease","medical_gastrointestinal_disorder",
                "medical_fatty_liver","medical_osteoporosis","medical_anemia_history","medical_cardiovascular_disease","medical_none",
                "medication_levothyroxine","medication_warfarin","medication_metformin","medication_omeprazole","medication_statins","medication_diuretics","medication_corticosteroids"
            ]),
            ("user_id", "INTEGER"),
            ("iron_level", "FLOAT"),("calcium_level", "FLOAT"),("vitamin_d_level", "FLOAT"),("vitamin_b12_level", "FLOAT"),
            ("allergies", "TEXT"),("disliked_foods", "TEXT"),
            ("cooking_method", "TEXT"),("cuisine_preference", "TEXT"),("user_location", "TEXT"),("occupation", "TEXT"),
        ]
        for col, typ in cols:
            try: cursor.execute(f"ALTER TABLE user_profiles ADD COLUMN {col} {typ}")
            except sqlite3.OperationalError: pass
    if "food_logs" in tables:
        for col, typ in [("gi","FLOAT"),("gl","FLOAT"),("gl_category","TEXT"),("available_carbs_g","FLOAT")]:
            try: cursor.execute(f"ALTER TABLE food_logs ADD COLUMN {col} {typ}")
            except sqlite3.OperationalError: pass
    conn.commit(); conn.close()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()
