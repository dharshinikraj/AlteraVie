"""
Pydantic schemas for Module 2 (deficiency prediction).
"""
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    age: int = Field(..., ge=1, le=120)
    gender: str  # male / female / other
    height_cm: float = Field(..., gt=30, lt=272)
    weight_kg: float = Field(..., gt=2, lt=500)
    activity_level: str  # low / moderate / high
    sleep_hours: float = Field(..., ge=0, le=24)
    water_intake_l: float = Field(..., ge=0, le=15)
    diet: str  # vegetarian / non-vegetarian / vegan
    occupation: str = Field(default="Desk / Office Worker", description="Job type: Desk / Active / Physical / Night Shift")

    fatigue: bool = False
    hair_loss: bool = False
    pale_skin: bool = False
    muscle_cramps: bool = False
    bone_pain: bool = False
    frequent_illness: bool = False
    brittle_nails: bool = False
    dizziness: bool = False
    numbness_tingling: bool = False
    slow_wound_healing: bool = False
    bleeding_gums: bool = False
    brain_fog: bool = False
    dry_skin: bool = False

    diabetes: bool = False
    hypertension: bool = False
    thyroid_disorder: bool = False
    celiac_disease: bool = False
    kidney_disease: bool = False
    gastrointestinal_disorder: bool = False
    fatty_liver: bool = False
    osteoporosis: bool = False
    anemia_history: bool = False
    cardiovascular_disease: bool = False


class DeficiencyProbability(BaseModel):
    nutrient: str
    probability_percent: float


class PredictionResponse(BaseModel):
    predictions: list[DeficiencyProbability]
    top_deficiencies: list[str]  # nutrients above the risk threshold
