"""
Module 4 — Recommendation Engine API routes.

Exposes:
    POST /recommend -> orchestrates Module 2 (prediction) and Module 3
                        (nutrition engine), then combines their output
                        into final personalized recommendations.
"""
from fastapi import APIRouter, HTTPException

from module4_recommendation.schemas import RecommendationRequest, RecommendationResponse
from module4_recommendation.engine import build_recommendations
from module2_prediction.predictor import predictor
from module2_prediction.schemas import PredictionRequest
from module3_chemical.engine import run_nutrition_analysis
from module3_chemical.cooking import VALID_METHODS

router = APIRouter(prefix="/recommend", tags=["Module 4 - Recommendation Engine"])


@router.post("", response_model=RecommendationResponse)
def get_recommendations(payload: RecommendationRequest):
    if payload.cooking_method.lower() not in VALID_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid cooking_method. Must be one of {VALID_METHODS}",
        )

    try:
        # Step 1: run Module 2 prediction
        exclude_fields = {
            "cooking_method", "levothyroxine", "warfarin", "metformin", "omeprazole",
            "statins", "diuretics", "corticosteroids", "allergies", "disliked_foods",
            "cuisine_preference", "user_location", "occupation"
        }
        pred_request = PredictionRequest(**payload.model_dump(exclude=exclude_fields))
        prediction_result = predictor.predict(pred_request)

        predictions_dicts = [p.model_dump() for p in prediction_result.predictions]
        top_deficiencies = prediction_result.top_deficiencies

        # If nothing crosses the risk threshold, still surface the single
        # highest-probability nutrient so the user gets actionable output.
        focus_nutrients = top_deficiencies or [predictions_dicts[0]["nutrient"]]

        # Step 2: run Module 3 chemical nutrition analysis
        nutrition_result = run_nutrition_analysis(
            age=payload.age,
            gender=payload.gender,
            weight_kg=payload.weight_kg,
            activity_level=payload.activity_level,
            diet=payload.diet,
            focus_nutrients=focus_nutrients,
            cooking_method=payload.cooking_method.lower(),
            allergies=payload.allergies,
            disliked_foods=payload.disliked_foods,
            occupation=payload.occupation,
        )

        # Step 3: combine into final recommendations
        combined = build_recommendations(
            predictions=predictions_dicts,
            top_deficiencies=focus_nutrients,
            nutrition_analysis=nutrition_result,
            levothyroxine=payload.levothyroxine,
            warfarin=payload.warfarin,
            metformin=payload.metformin,
            omeprazole=payload.omeprazole,
            statins=payload.statins,
            diuretics=payload.diuretics,
            corticosteroids=payload.corticosteroids,
            diet=payload.diet,
            allergies=payload.allergies,
            disliked_foods=payload.disliked_foods,
        )

        return RecommendationResponse(
            summary=combined["summary"],
            predictions=predictions_dicts,
            detailed_recommendations=combined["detailed_recommendations"],
            daily_nutrient_targets=combined["daily_nutrient_targets"],
            relevant_nutrient_interactions=combined["relevant_nutrient_interactions"],
            drug_safety_warnings=combined.get("drug_safety_warnings", []),
            daily_meal_plan=combined.get("daily_meal_plan", {}),
            deals_on_sale=combined.get("deals_on_sale", []),
            occupation_guidance=nutrition_result.get("occupation_guidance", {}),
        )
    except HTTPException:
        raise
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=f"Recommendation prerequisites unavailable: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {exc}")
