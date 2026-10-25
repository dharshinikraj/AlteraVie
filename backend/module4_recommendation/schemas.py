"""
Pydantic schemas for Module 4 (recommendation engine).

The /recommend endpoint accepts the same profile shape as /predict, plus
an optional cooking_method, and internally orchestrates Module 2 (ML
prediction) and Module 3 (chemical nutrition engine) so the frontend can
call a single endpoint for the final "Recommendations" screen.
"""
from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    age: int = Field(..., ge=1, le=120)
    gender: str
    height_cm: float = Field(..., gt=30, lt=272)
    weight_kg: float = Field(..., gt=2, lt=500)
    activity_level: str
    sleep_hours: float = Field(..., ge=0, le=24)
    water_intake_l: float = Field(..., ge=0, le=15)
    diet: str

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

    levothyroxine: bool = False
    warfarin: bool = False
    metformin: bool = False
    omeprazole: bool = False
    statins: bool = False
    diuretics: bool = False
    corticosteroids: bool = False

    cooking_method: str = Field(default="steamed", description="raw | boiled | steamed | fried")
    allergies: list[str] = Field(default_factory=list)
    disliked_foods: list[str] = Field(default_factory=list)
    cuisine_preference: str = Field(default="indian", description="indian | continental | asian | global")
    user_location: str = Field(default="India - South", description="User region for locally accessible resources")
    occupation: str = Field(default="Desk / Office Worker", description="Desk / Office Worker | Active / Field Work | Physical Labor | Night Shift")


class RecommendationResponse(BaseModel):
    summary: str
    predictions: list[dict]
    detailed_recommendations: list[dict]
    daily_nutrient_targets: dict
    relevant_nutrient_interactions: list[dict]
    drug_safety_warnings: list[dict] = Field(default_factory=list)
    daily_meal_plan: dict = Field(default_factory=dict)
    deals_on_sale: list[dict] = Field(default_factory=list)
    occupation_guidance: dict = Field(default_factory=dict)
