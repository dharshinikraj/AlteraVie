"""
Module 3 — Chemical Engineering Nutrition Analysis Engine.

Orchestrates the food database, RDA calculator, cooking-loss module, and
interaction rules into a single structured analysis. Pure rule-based
logic — no machine learning is used anywhere in this module.
"""
from module3_chemical.food_database import foods_rich_in_cooked
from module3_chemical.rda import calculate_rda
from module3_chemical.cooking import apply_cooking_loss, VALID_METHODS, RETENTION_FACTORS
from module3_chemical.interactions import get_relevant_interactions

NUTRIENT_ATTR_MAP = {
    "Iron": "iron",
    "Vitamin D": "vitamin_d",
    "Calcium": "calcium",
    "Vitamin B12": "vitamin_b12",
    "Protein": "protein",
}



def run_nutrition_analysis(
    age: int,
    gender: str,
    weight_kg: float,
    activity_level: str,
    diet: str,
    focus_nutrients: list[str],
    cooking_method: str = "steamed",
    allergies: list[str] | None = None,
    disliked_foods: list[str] | None = None,
    occupation: str = "Desk / Office Worker",
) -> dict:
    """
    Produce a structured nutrition analysis for the given profile and a
    set of focus nutrients (typically the top predicted deficiencies).
    """
    rda = calculate_rda(age=age, gender=gender, activity_level=activity_level, weight_kg=weight_kg)

    diet_key = diet.lower()
    method_factors = RETENTION_FACTORS.get(cooking_method, RETENTION_FACTORS["steamed"])

    nutrient_sections = []
    for nutrient in focus_nutrients:
        attr = NUTRIENT_ATTR_MAP.get(nutrient)
        if not attr:
            continue

        # Rank foods by post-cooking nutrient value (method-aware + safe filtered)
        top_foods = foods_rich_in_cooked(
            attr,
            cooking_method=cooking_method,
            retention_factors=method_factors,
            diet_filter=diet_key if diet_key != "non-vegetarian" else None,
            allergies=allergies,
            disliked_foods=disliked_foods,
            top_n=5,
        )

        # Compute cooking-adjusted values for ALL top foods
        retention = method_factors.get(attr, 1.0)
        cooked_examples = []
        if cooking_method in VALID_METHODS:
            cooked_examples = [apply_cooking_loss(f, cooking_method) for f in top_foods]

        nutrient_sections.append({
            "nutrient": nutrient,
            "top_foods": [
                {
                    "name": f.name,
                    "amount_per_100g_raw": round(getattr(f, attr), 2),
                    "amount_per_100g_cooked": round(getattr(f, attr) * retention, 2),
                }
                for f in top_foods
            ],
            "cooking_adjusted_examples": cooked_examples,
        })

    interactions = get_relevant_interactions(focus_nutrients + ["tea", "coffee"])

    return {
        "daily_requirements": {
            "calories": rda.calories,
            "protein_g": rda.protein_g,
            "iron_mg": rda.iron_mg,
            "calcium_mg": rda.calcium_mg,
            "vitamin_d_mcg": rda.vitamin_d_mcg,
            "vitamin_b12_mcg": rda.vitamin_b12_mcg,
            "vitamin_c_mg": rda.vitamin_c_mg,
        },
        "nutrient_analysis": nutrient_sections,
        "interaction_rules": [
            {
                "type": r.type,
                "factors": r.factors,
                "description": r.description,
                "advice": r.advice,
            }
            for r in interactions
        ],
        "occupation_guidance": {},
        "cooking_method_used": cooking_method,
    }
