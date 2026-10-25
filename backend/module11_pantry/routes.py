"""Module 11 - Pantry Chef API.

    POST /pantry/suggest  -> dish ideas + nutrient ranking from ingredients on hand
"""
from fastapi import APIRouter, HTTPException

from module11_pantry.schemas import PantryRequest, PantryResponse
from module11_pantry.engine import suggest

router = APIRouter(prefix="/pantry", tags=["Module 11 - Pantry Chef"])


@router.post("/suggest", response_model=PantryResponse)
def pantry_suggest(payload: PantryRequest):
    if payload.diet.lower() not in {"vegetarian", "non-vegetarian", "vegan"}:
        raise HTTPException(status_code=400, detail="diet must be vegetarian, non-vegetarian or vegan")
    try:
        return suggest(
            ingredients=payload.ingredients, diet=payload.diet,
            allergies=payload.allergies, disliked=payload.disliked_foods,
            focus_nutrients=payload.focus_nutrients, limit=payload.limit,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pantry suggestion failed: {exc}")
