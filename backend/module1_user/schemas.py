"""
Pydantic schemas for Module 1 (request/response validation).
"""
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class ActivityLevel(str, Enum):
    low = "low"
    moderate = "moderate"
    high = "high"


class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"


class DietType(str, Enum):
    vegetarian = "vegetarian"
    non_vegetarian = "non-vegetarian"
    vegan = "vegan"


class Symptoms(BaseModel):
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


class MedicalHistory(BaseModel):
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
    none_: bool = Field(False, alias="none")

    # Medications
    levothyroxine: bool = False
    warfarin: bool = False
    metformin: bool = False
    omeprazole: bool = False
    statins: bool = False
    diuretics: bool = False
    corticosteroids: bool = False

    class Config:
        populate_by_name = True


class UserProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=1, le=120)
    gender: Gender
    height_cm: float = Field(..., gt=30, lt=272)
    weight_kg: float = Field(..., gt=2, lt=500)

    activity_level: ActivityLevel
    sleep_hours: float = Field(..., ge=0, le=24)
    water_intake_l: float = Field(..., ge=0, le=15)
    diet: DietType

    symptoms: Symptoms = Field(default_factory=Symptoms)
    medical_history: MedicalHistory = Field(default_factory=MedicalHistory)
    user_id: int | None = None
    iron_level: float | None = None
    calcium_level: float | None = None
    vitamin_d_level: float | None = None
    vitamin_b12_level: float | None = None
    allergies: list[str] = Field(default_factory=list)
    disliked_foods: list[str] = Field(default_factory=list)
    cooking_method: str = "steamed"
    cuisine_preference: str = "indian"
    user_location: str | None = None
    occupation: str = "Desk / Office Worker"

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be blank")
        return v.strip()


class UserProfileResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    activity_level: str
    sleep_hours: float
    water_intake_l: float
    diet: str
    user_id: int | None = None
    iron_level: float | None = None
    calcium_level: float | None = None
    vitamin_d_level: float | None = None
    vitamin_b12_level: float | None = None
    allergies: list[str] = Field(default_factory=list)
    disliked_foods: list[str] = Field(default_factory=list)
    cooking_method: str = "steamed"
    cuisine_preference: str = "indian"
    user_location: str | None = None
    occupation: str = "Desk / Office Worker"
    symptom_fatigue: bool = False
    symptom_hair_loss: bool = False
    symptom_pale_skin: bool = False
    symptom_muscle_cramps: bool = False
    symptom_bone_pain: bool = False
    symptom_frequent_illness: bool = False
    symptom_brittle_nails: bool = False
    symptom_dizziness: bool = False
    symptom_numbness_tingling: bool = False
    symptom_slow_wound_healing: bool = False
    symptom_bleeding_gums: bool = False
    symptom_brain_fog: bool = False
    symptom_dry_skin: bool = False
    medical_diabetes: bool = False
    medical_hypertension: bool = False
    medical_thyroid_disorder: bool = False
    medical_celiac_disease: bool = False
    medical_kidney_disease: bool = False
    medical_gastrointestinal_disorder: bool = False
    medical_fatty_liver: bool = False
    medical_osteoporosis: bool = False
    medical_anemia_history: bool = False
    medical_cardiovascular_disease: bool = False
    medical_none: bool = False
    medication_levothyroxine: bool = False
    medication_warfarin: bool = False
    medication_metformin: bool = False
    medication_omeprazole: bool = False
    medication_statins: bool = False
    medication_diuretics: bool = False
    medication_corticosteroids: bool = False
    created_at: datetime | None = None

    class Config:
        from_attributes = True
