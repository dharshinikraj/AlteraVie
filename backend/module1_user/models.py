"""
SQLAlchemy ORM model for a user's health & lifestyle profile.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime

from database.db import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)

    # Personal information
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)  # male / female / other
    height_cm = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)

    # Lifestyle
    activity_level = Column(String, nullable=False)  # low / moderate / high
    sleep_hours = Column(Float, nullable=False)
    water_intake_l = Column(Float, nullable=False)
    diet = Column(String, nullable=False)  # vegetarian / non-vegetarian / vegan

    # Symptoms (stored as booleans for simple querying)
    symptom_fatigue = Column(Boolean, default=False)
    symptom_hair_loss = Column(Boolean, default=False)
    symptom_pale_skin = Column(Boolean, default=False)
    symptom_muscle_cramps = Column(Boolean, default=False)
    symptom_bone_pain = Column(Boolean, default=False)
    symptom_frequent_illness = Column(Boolean, default=False)
    symptom_brittle_nails = Column(Boolean, default=False)
    symptom_dizziness = Column(Boolean, default=False)
    symptom_numbness_tingling = Column(Boolean, default=False)
    symptom_slow_wound_healing = Column(Boolean, default=False)
    symptom_bleeding_gums = Column(Boolean, default=False)
    symptom_brain_fog = Column(Boolean, default=False)
    symptom_dry_skin = Column(Boolean, default=False)

    # Medical history
    medical_diabetes = Column(Boolean, default=False)
    medical_hypertension = Column(Boolean, default=False)
    medical_thyroid_disorder = Column(Boolean, default=False)
    medical_celiac_disease = Column(Boolean, default=False)
    medical_kidney_disease = Column(Boolean, default=False)
    medical_gastrointestinal_disorder = Column(Boolean, default=False)
    medical_fatty_liver = Column(Boolean, default=False)
    medical_osteoporosis = Column(Boolean, default=False)
    medical_anemia_history = Column(Boolean, default=False)
    medical_cardiovascular_disease = Column(Boolean, default=False)
    medical_none = Column(Boolean, default=False)

    # Medications
    medication_levothyroxine = Column(Boolean, default=False)
    medication_warfarin = Column(Boolean, default=False)
    medication_metformin = Column(Boolean, default=False)
    medication_omeprazole = Column(Boolean, default=False)
    medication_statins = Column(Boolean, default=False)
    medication_diuretics = Column(Boolean, default=False)
    medication_corticosteroids = Column(Boolean, default=False)
    user_id = Column(Integer, nullable=True)
    iron_level = Column(Float, nullable=True)
    calcium_level = Column(Float, nullable=True)
    vitamin_d_level = Column(Float, nullable=True)
    vitamin_b12_level = Column(Float, nullable=True)
    allergies = Column(String, nullable=True)
    disliked_foods = Column(String, nullable=True)
    cooking_method = Column(String, nullable=True, default="steamed")
    cuisine_preference = Column(String, nullable=True, default="indian")
    user_location = Column(String, nullable=True)
    occupation = Column(String, nullable=True, default="Desk / Office Worker")

    created_at = Column(DateTime, default=datetime.utcnow)
