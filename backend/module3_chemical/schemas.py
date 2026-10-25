"""
Pydantic schemas for Module 3 (nutrition analysis engine).
"""
from pydantic import BaseModel, Field


class NutritionAnalysisRequest(BaseModel):
    age: int = Field(..., ge=1, le=120)
    gender: str
    weight_kg: float = Field(..., gt=2, lt=500)
    activity_level: str
    diet: str
    focus_nutrients: list[str] = Field(
        default_factory=list,
        description="Nutrients to analyze, e.g. ['Iron', 'Vitamin D']. "
                    "Typically the top deficiencies from /predict.",
    )
    cooking_method: str = Field(default="steamed", description="raw | boiled | steamed | fried")
    allergies: list[str] = Field(default_factory=list)
    disliked_foods: list[str] = Field(default_factory=list)
    occupation: str = "Desk / Office Worker"


class NutritionAnalysisResponse(BaseModel):
    daily_requirements: dict
    nutrient_analysis: list[dict]
    interaction_rules: list[dict]
    cooking_method_used: str
    occupation_guidance: dict = Field(default_factory=dict)
