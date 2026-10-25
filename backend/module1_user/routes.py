"""
Module 1 — User Health & Lifestyle Profiling API routes.

Exposes:
    POST /user  -> create a user profile and persist it to SQLite.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from module1_user.models import UserProfile
from module1_user.schemas import UserProfileCreate, UserProfileResponse
from module5_auth.routes import get_current_user
from module5_auth.models import User

router = APIRouter(prefix="/user", tags=["Module 1 - User Profiling"])


@router.post("", response_model=UserProfileResponse, status_code=201)
def create_user_profile(payload: UserProfileCreate, db: Session = Depends(get_db)):
    """
    Validate and store a new user health & lifestyle profile.
    """
    try:
        db_user = UserProfile(
            name=payload.name,
            age=payload.age,
            gender=payload.gender.value,
            height_cm=payload.height_cm,
            weight_kg=payload.weight_kg,
            activity_level=payload.activity_level.value,
            sleep_hours=payload.sleep_hours,
            water_intake_l=payload.water_intake_l,
            diet=payload.diet.value,
            symptom_fatigue=payload.symptoms.fatigue,
            symptom_hair_loss=payload.symptoms.hair_loss,
            symptom_pale_skin=payload.symptoms.pale_skin,
            symptom_muscle_cramps=payload.symptoms.muscle_cramps,
            symptom_bone_pain=payload.symptoms.bone_pain,
            symptom_frequent_illness=payload.symptoms.frequent_illness,
            symptom_brittle_nails=payload.symptoms.brittle_nails,
            symptom_dizziness=payload.symptoms.dizziness,
            symptom_numbness_tingling=payload.symptoms.numbness_tingling,
            symptom_slow_wound_healing=payload.symptoms.slow_wound_healing,
            symptom_bleeding_gums=payload.symptoms.bleeding_gums,
            symptom_brain_fog=payload.symptoms.brain_fog,
            symptom_dry_skin=payload.symptoms.dry_skin,
            medical_diabetes=payload.medical_history.diabetes,
            medical_hypertension=payload.medical_history.hypertension,
            medical_thyroid_disorder=payload.medical_history.thyroid_disorder,
            medical_celiac_disease=payload.medical_history.celiac_disease,
            medical_kidney_disease=payload.medical_history.kidney_disease,
            medical_gastrointestinal_disorder=payload.medical_history.gastrointestinal_disorder,
            medical_fatty_liver=payload.medical_history.fatty_liver,
            medical_osteoporosis=payload.medical_history.osteoporosis,
            medical_anemia_history=payload.medical_history.anemia_history,
            medical_cardiovascular_disease=payload.medical_history.cardiovascular_disease,
            medical_none=payload.medical_history.none_,
            medication_levothyroxine=payload.medical_history.levothyroxine,
            medication_warfarin=payload.medical_history.warfarin,
            medication_metformin=payload.medical_history.metformin,
            medication_omeprazole=payload.medical_history.omeprazole,
            medication_statins=payload.medical_history.statins,
            medication_diuretics=payload.medical_history.diuretics,
            medication_corticosteroids=payload.medical_history.corticosteroids,
            user_id=payload.user_id,
            iron_level=payload.iron_level,
            calcium_level=payload.calcium_level,
            vitamin_d_level=payload.vitamin_d_level,
            vitamin_b12_level=payload.vitamin_b12_level,
            allergies=",".join(payload.allergies) if payload.allergies else "",
            disliked_foods=",".join(payload.disliked_foods) if payload.disliked_foods else "",
            cooking_method=payload.cooking_method,
            cuisine_preference=payload.cuisine_preference,
            user_location=payload.user_location,
            occupation=payload.occupation,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return _format_user_profile_response(db_user)
    except Exception as exc:  # pragma: no cover - defensive guard for MVP
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save user profile: {exc}")


def _format_user_profile_response(db_user: UserProfile) -> dict:
    allergies = [a.strip() for a in db_user.allergies.split(",") if a.strip()] if db_user.allergies else []
    disliked_foods = [d.strip() for d in db_user.disliked_foods.split(",") if d.strip()] if db_user.disliked_foods else []
    return {
        "id": db_user.id,
        "name": db_user.name,
        "age": db_user.age,
        "gender": db_user.gender,
        "height_cm": db_user.height_cm,
        "weight_kg": db_user.weight_kg,
        "activity_level": db_user.activity_level,
        "sleep_hours": db_user.sleep_hours,
        "water_intake_l": db_user.water_intake_l,
        "diet": db_user.diet,
        "user_id": db_user.user_id,
        "iron_level": db_user.iron_level,
        "calcium_level": db_user.calcium_level,
        "vitamin_d_level": db_user.vitamin_d_level,
        "vitamin_b12_level": db_user.vitamin_b12_level,
        "allergies": allergies,
        "disliked_foods": disliked_foods,
        "cooking_method": db_user.cooking_method or "steamed",
        "cuisine_preference": db_user.cuisine_preference or "indian",
        "user_location": db_user.user_location,
        "occupation": db_user.occupation or "Desk / Office Worker",
        "symptom_fatigue": bool(db_user.symptom_fatigue), "symptom_hair_loss": bool(db_user.symptom_hair_loss),
        "symptom_pale_skin": bool(db_user.symptom_pale_skin), "symptom_muscle_cramps": bool(db_user.symptom_muscle_cramps),
        "symptom_bone_pain": bool(db_user.symptom_bone_pain), "symptom_frequent_illness": bool(db_user.symptom_frequent_illness),
        "symptom_brittle_nails": bool(db_user.symptom_brittle_nails), "symptom_dizziness": bool(db_user.symptom_dizziness),
        "symptom_numbness_tingling": bool(db_user.symptom_numbness_tingling), "symptom_slow_wound_healing": bool(db_user.symptom_slow_wound_healing),
        "symptom_bleeding_gums": bool(db_user.symptom_bleeding_gums), "symptom_brain_fog": bool(db_user.symptom_brain_fog), "symptom_dry_skin": bool(db_user.symptom_dry_skin),
        "medical_diabetes": bool(db_user.medical_diabetes), "medical_hypertension": bool(db_user.medical_hypertension),
        "medical_thyroid_disorder": bool(db_user.medical_thyroid_disorder), "medical_celiac_disease": bool(db_user.medical_celiac_disease),
        "medical_kidney_disease": bool(db_user.medical_kidney_disease), "medical_gastrointestinal_disorder": bool(db_user.medical_gastrointestinal_disorder),
        "medical_fatty_liver": bool(db_user.medical_fatty_liver), "medical_osteoporosis": bool(db_user.medical_osteoporosis),
        "medical_anemia_history": bool(db_user.medical_anemia_history), "medical_cardiovascular_disease": bool(db_user.medical_cardiovascular_disease),
        "medical_none": bool(db_user.medical_none),
        "medication_levothyroxine": bool(db_user.medication_levothyroxine), "medication_warfarin": bool(db_user.medication_warfarin),
        "medication_metformin": bool(db_user.medication_metformin), "medication_omeprazole": bool(db_user.medication_omeprazole),
        "medication_statins": bool(db_user.medication_statins), "medication_diuretics": bool(db_user.medication_diuretics),
        "medication_corticosteroids": bool(db_user.medication_corticosteroids),
        "created_at": db_user.created_at,
    }


@router.get("/history", response_model=list[UserProfileResponse])
def get_user_assessment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve history of assessments for the logged in user."""
    profiles = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).order_by(UserProfile.created_at.desc()).all()
    return [_format_user_profile_response(p) for p in profiles]


@router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return _format_user_profile_response(user)
