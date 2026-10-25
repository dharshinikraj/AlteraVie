"""
Module 3 — Chemical Engineering Nutrition Analysis Engine API routes.

Exposes:
    POST /nutrition -> RDA targets, top foods per nutrient (with cooking-
                        adjusted values), and relevant interaction rules.
"""
from fastapi import APIRouter, HTTPException

from module3_chemical.schemas import NutritionAnalysisRequest, NutritionAnalysisResponse
from module3_chemical.engine import run_nutrition_analysis
from module3_chemical.cooking import VALID_METHODS

router = APIRouter(prefix="/nutrition", tags=["Module 3 - Chemical Nutrition Engine"])


@router.post("", response_model=NutritionAnalysisResponse)
def analyze_nutrition(payload: NutritionAnalysisRequest):
    if payload.cooking_method.lower() not in VALID_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid cooking_method. Must be one of {VALID_METHODS}",
        )
    try:
        result = run_nutrition_analysis(
            age=payload.age,
            gender=payload.gender,
            weight_kg=payload.weight_kg,
            activity_level=payload.activity_level,
            diet=payload.diet,
            focus_nutrients=payload.focus_nutrients,
            cooking_method=payload.cooking_method.lower(),
            allergies=payload.allergies,
            disliked_foods=payload.disliked_foods,
            occupation=payload.occupation,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Nutrition analysis failed: {exc}")
