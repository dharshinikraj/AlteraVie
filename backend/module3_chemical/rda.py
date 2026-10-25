"""
Module 3 — Daily Nutrient Requirement (RDA) Calculator.

Simplified Recommended Dietary Allowance values, banded by age group,
gender, and activity level. These are deliberately simplified for MVP
demonstration purposes and approximate widely published RDA tables
(ICMR / USDA style), not a substitute for clinical dietary guidance.
"""
from dataclasses import dataclass


@dataclass
class RDATargets:
    calories: float
    protein_g: float
    iron_mg: float
    calcium_mg: float
    vitamin_d_mcg: float
    vitamin_b12_mcg: float
    vitamin_c_mg: float


# Activity level multiplies the baseline caloric/protein requirement.
ACTIVITY_MULTIPLIER = {
    "low": 1.0,
    "moderate": 1.15,
    "high": 1.35,
}


def _age_band(age: int) -> str:
    if age <= 12:
        return "child"
    if age <= 18:
        return "adolescent"
    if age <= 50:
        return "adult"
    return "senior"


def calculate_rda(age: int, gender: str, activity_level: str, weight_kg: float) -> RDATargets:
    """
    Compute simplified daily nutrient targets based on age band, gender,
    and activity level.
    """
    gender = gender.lower()
    activity_level = activity_level.lower()
    band = _age_band(age)
    multiplier = ACTIVITY_MULTIPLIER.get(activity_level, 1.0)

    # Baseline protein: ~0.8g/kg body weight for adults, scaled up for
    # children/adolescents (growth) and by activity level.
    base_protein_per_kg = {
        "child": 1.0,
        "adolescent": 0.95,
        "adult": 0.8,
        "senior": 1.0,  # slightly higher to counter sarcopenia
    }[band]
    protein_g = round(weight_kg * base_protein_per_kg * multiplier, 1)

    # Baseline calories (very simplified Mifflin-style banding).
    base_calories = {
        "child": 1600,
        "adolescent": 2200,
        "adult": 2000 if gender == "female" else 2500,
        "senior": 1800 if gender == "female" else 2200,
    }[band]
    calories = round(base_calories * multiplier, 0)

    # Iron: notably higher for menstruating-age females.
    if gender == "female" and band in ("adolescent", "adult"):
        iron_mg = 18.0
    elif band == "child":
        iron_mg = 10.0
    else:
        iron_mg = 8.0

    # Calcium: higher for adolescents (bone growth) and seniors (bone density loss).
    calcium_mg = {
        "child": 1000,
        "adolescent": 1300,
        "adult": 1000,
        "senior": 1200,
    }[band]

    # Vitamin D: higher for seniors (reduced skin synthesis efficiency).
    vitamin_d_mcg = 15.0 if band != "senior" else 20.0

    # Vitamin B12: fairly stable across adult life, slightly lower for children.
    vitamin_b12_mcg = 1.2 if band in ("child",) else 2.4

    # Vitamin C: standard adult RDA with slight bump for smokers/high-activity
    # (not modeled here beyond activity multiplier on general metabolism).
    vitamin_c_mg = 65.0 if band == "child" else (75.0 if gender == "female" else 90.0)

    return RDATargets(
        calories=calories,
        protein_g=protein_g,
        iron_mg=iron_mg,
        calcium_mg=calcium_mg,
        vitamin_d_mcg=vitamin_d_mcg,
        vitamin_b12_mcg=vitamin_b12_mcg,
        vitamin_c_mg=vitamin_c_mg,
    )
