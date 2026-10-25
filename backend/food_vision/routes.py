"""
FastAPI router and endpoints for the Food Vision module.
Includes GI/GL estimation, dish glycemic info, and daily food journal summary endpoints.
"""

import os
from datetime import datetime, date
from fastapi import APIRouter, File, UploadFile, Query, HTTPException, Depends
from sqlalchemy.orm import Session

from database.db import get_db
from module5_auth.routes import get_current_user
from module5_auth.models import User

from food_vision.classifier import (
    ALL_CLASSES,
    TrainedDishClassifier,
    DishClassifier
)
from food_vision.nutrient_aggregator import calculate_dish_nutrients
from food_vision.glycemic import gl_category, gi_category
from food_vision.models import FoodLog
from food_vision.schemas import (
    PredictionResponse,
    DishesListResponse,
    DishGlycemicInfo,
    FoodLogCreate,
    FoodLogResponse,
    DailyNutritionSummary,
)

router = APIRouter(prefix="/food-vision", tags=["Food Vision - Nutrient Estimation"])

# Define path for trained model weights
WEIGHTS_FILENAME = "model_weights.pth"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(BASE_DIR, WEIGHTS_FILENAME)

# Global classifier instance
classifier_instance: DishClassifier | None = None


def get_classifier() -> DishClassifier:
    """
    Dependency or helper to retrieve the active classifier instance.
    Loads TrainedDishClassifier with MobileNetV3-Small PyTorch model weights.
    """
    global classifier_instance
    
    if classifier_instance is not None:
        return classifier_instance
        
    if os.path.exists(WEIGHTS_PATH):
        try:
            print(f"Loading trained classifier weights from {WEIGHTS_PATH}...")
            classifier_instance = TrainedDishClassifier(WEIGHTS_PATH)
            print("Successfully loaded trained classifier.")
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize trained PyTorch dish classifier: {exc}"
            )
    else:
        raise HTTPException(
            status_code=500,
            detail=f"Trained model weights not found at {WEIGHTS_PATH}. Please run training script first."
        )
        
    return classifier_instance


@router.get("/dishes", response_model=DishesListResponse)
def list_dishes():
    """Return image-classifier labels. GI/GL is intentionally not fabricated without a live validated source."""
    info=[DishGlycemicInfo(dish_name=d, gi=None, gi_category=None, available_carbs_g=None, gl=None, gl_category=None) for d in ALL_CLASSES]
    return DishesListResponse(dishes=ALL_CLASSES, count=len(ALL_CLASSES), dish_glycemic_info=info)


@router.post("/predict", response_model=PredictionResponse)
async def predict_food(
    file: UploadFile = File(..., description="Image file of the plate of food"),
    portion_multiplier: float = Query(1.0, gt=0, le=10, description="Portion multiplier (e.g. 0.5 for half serving, 2.0 for double)")
):
    """
    Accepts an uploaded food photo, classifies the dish, and returns estimated nutrients + GI/GL profile.
    Validates file type and file size (<10MB).
    """
    # 1. Validate file extension and MIME type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        suffix = os.path.splitext(file.filename or "")[1].lower()
        if suffix not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: '{file.content_type or 'unknown'}'. Allowed types: JPEG, PNG, WebP."
            )
            
    # 2. Validate file size (limit: 10MB)
    max_size = 10 * 1024 * 1024
    try:
        content = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {exc}")
        
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded file is too large ({len(content)} bytes). Maximum allowed size is 10MB."
        )
        
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # 3. Get classifier and predict
    clf = get_classifier()
    try:
        dish_name, confidence = clf.predict(content)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Error processing image for classification: {exc}"
        )

    # 4. Perform nutrient estimation and scaling
    try:
        nutrition_data = calculate_dish_nutrients(dish_name, portion_multiplier)
    except KeyError as exc:
        raise HTTPException(status_code=422, detail=f"No USDA nutrition match was found for the predicted dish: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Dish was classified, but live USDA nutrition lookup failed: {exc}")

    # 5. Build and return structured prediction response
    return PredictionResponse(
        predicted_dish=dish_name,
        confidence=confidence,
        portion_multiplier=portion_multiplier,
        typical_serving_g=nutrition_data["typical_serving_g"],
        estimated_total_weight_g=nutrition_data["estimated_total_weight_g"],
        total_nutrients=nutrition_data["total_nutrients"],
        gi=nutrition_data["glycemic"]["gi"],
        gi_category=nutrition_data["glycemic"]["gi_category"],
        available_carbs_g=nutrition_data["glycemic"]["available_carbs_g"],
        gl=nutrition_data["glycemic"]["gl"],
        gl_category=nutrition_data["glycemic"]["gl_category"],
        ingredients_breakdown=nutrition_data["ingredients_breakdown"],
        disclaimer=nutrition_data["disclaimer"]
    )


@router.post("/log", response_model=FoodLogResponse)
def log_food_item(
    payload: FoodLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a meal to user's daily food journal with timestamp and GI/GL metrics."""
    log_entry = FoodLog(
        user_id=current_user.id,
        dish_name=payload.dish_name,
        portion_multiplier=payload.portion_multiplier,
        estimated_weight_g=payload.estimated_weight_g,
        calories=payload.calories,
        protein_g=payload.protein_g,
        fat_g=payload.fat_g,
        carbs_g=payload.carbs_g,
        gi=payload.gi,
        gl=payload.gl,
        gl_category=gl_category(payload.gl),
        available_carbs_g=payload.available_carbs_g,
        logged_at=datetime.now()
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return FoodLogResponse(
        id=log_entry.id,
        user_id=log_entry.user_id,
        dish_name=log_entry.dish_name,
        portion_multiplier=log_entry.portion_multiplier,
        estimated_weight_g=log_entry.estimated_weight_g,
        calories=log_entry.calories,
        protein_g=log_entry.protein_g,
        fat_g=log_entry.fat_g,
        carbs_g=log_entry.carbs_g,
        gi=log_entry.gi,
        gl=log_entry.gl,
        gl_category=log_entry.gl_category,
        available_carbs_g=log_entry.available_carbs_g,
        logged_at=log_entry.logged_at.isoformat()
    )


@router.get("/log/today", response_model=list[FoodLogResponse])
def get_today_food_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all food log entries created today by the current user."""
    today = datetime.now().date()
    logs = (
        db.query(FoodLog)
        .filter(FoodLog.user_id == current_user.id)
        .order_by(FoodLog.logged_at.desc())
        .all()
    )
    today_logs = [l for l in logs if l.logged_at.date() == today]
    return [
        FoodLogResponse(
            id=l.id,
            user_id=l.user_id,
            dish_name=l.dish_name,
            portion_multiplier=l.portion_multiplier,
            estimated_weight_g=l.estimated_weight_g,
            calories=l.calories,
            protein_g=l.protein_g,
            fat_g=l.fat_g,
            carbs_g=l.carbs_g,
            gi=l.gi,
            gl=l.gl,
            gl_category=l.gl_category,
            available_carbs_g=l.available_carbs_g,
            logged_at=l.logged_at.isoformat()
        )
        for l in today_logs
    ]


@router.get("/log/summary/today", response_model=DailyNutritionSummary)
def get_today_nutrition_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Aggregated daily nutrition summary for the current user, including average GI and
    total GL for today's logged meals.
    """
    today = datetime.now().date()
    logs = (
        db.query(FoodLog)
        .filter(FoodLog.user_id == current_user.id)
        .all()
    )
    today_logs = [l for l in logs if l.logged_at.date() == today]

    total_calories = round(sum(l.calories or 0.0 for l in today_logs), 2)
    total_protein_g = round(sum(l.protein_g or 0.0 for l in today_logs), 2)
    total_fat_g = round(sum(l.fat_g or 0.0 for l in today_logs), 2)
    total_carbs_g = round(sum(l.carbs_g or 0.0 for l in today_logs), 2)

    gi_values = [l.gi for l in today_logs if l.gi is not None]
    gl_values = [l.gl for l in today_logs if l.gl is not None]
    entries_missing_gi = sum(1 for l in today_logs if l.gi is None)

    average_gi = round(sum(gi_values) / len(gi_values), 2) if gi_values else None
    total_gl = round(sum(gl_values), 2) if gl_values else None

    return DailyNutritionSummary(
        date=today.isoformat(),
        entry_count=len(today_logs),
        total_calories=total_calories,
        total_protein_g=total_protein_g,
        total_fat_g=total_fat_g,
        total_carbs_g=total_carbs_g,
        average_gi=average_gi,
        average_gi_category=gi_category(average_gi),
        total_gl=total_gl,
        total_gl_category=gl_category(total_gl),
        entries_missing_gi=entries_missing_gi,
    )


@router.delete("/log/{log_id}")
def delete_food_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a logged food item by ID."""
    log_entry = db.query(FoodLog).filter(FoodLog.id == log_id, FoodLog.user_id == current_user.id).first()
    if not log_entry:
        raise HTTPException(status_code=404, detail="Food log entry not found.")
    db.delete(log_entry)
    db.commit()
    return {"message": "Food log deleted successfully."}
