"""
Module 3 — Cooking Loss Module.

Applies retention factors to a food's nutrient profile based on cooking
method. Retention factors are approximate, drawn from well-known ranges
in food-science literature on nutrient loss during cooking (heat- and
water-soluble vitamins degrade the most; minerals leach into cooking
water when boiled; frying adds fat/calories while degrading vitamin C).
"""
from module3_chemical.food_database import Food

# Retention factor = fraction of nutrient remaining after cooking (0-1).
# Keyed by cooking method -> nutrient attribute -> retention factor.
RETENTION_FACTORS = {
    "raw": {
        "calories": 1.0, "protein": 1.0, "fat": 1.0, "carbs": 1.0,
        "iron": 1.0, "calcium": 1.0, "vitamin_d": 1.0,
        "vitamin_b12": 1.0, "vitamin_c": 1.0, "fiber": 1.0,
    },
    "boiled": {
        "calories": 0.98, "protein": 0.94, "fat": 0.97, "carbs": 0.96,
        "iron": 0.75, "calcium": 0.70, "vitamin_d": 0.85,
        "vitamin_b12": 0.70, "vitamin_c": 0.45, "fiber": 0.95,
    },
    "steamed": {
        "calories": 0.99, "protein": 0.97, "fat": 0.98, "carbs": 0.98,
        "iron": 0.90, "calcium": 0.92, "vitamin_d": 0.92,
        "vitamin_b12": 0.85, "vitamin_c": 0.75, "fiber": 0.98,
    },
    "fried": {
        "calories": 1.25, "protein": 0.90, "fat": 1.60, "carbs": 1.05,
        "iron": 0.85, "calcium": 0.80, "vitamin_d": 0.70,
        "vitamin_b12": 0.65, "vitamin_c": 0.35, "fiber": 0.95,
    },
}

VALID_METHODS = list(RETENTION_FACTORS.keys())


def apply_cooking_loss(food: Food, method: str) -> dict:
    """
    Returns a dict of the food's nutrient values adjusted for the given
    cooking method's retention/gain factors.
    """
    method = method.lower()
    if method not in RETENTION_FACTORS:
        raise ValueError(f"Unknown cooking method '{method}'. Valid options: {VALID_METHODS}")

    factors = RETENTION_FACTORS[method]
    return {
        "food": food.name,
        "cooking_method": method,
        "calories": round(food.calories * factors["calories"], 1),
        "protein": round(food.protein * factors["protein"], 2),
        "fat": round(food.fat * factors["fat"], 2),
        "carbs": round(food.carbs * factors["carbs"], 2),
        "iron": round(food.iron * factors["iron"], 2),
        "calcium": round(food.calcium * factors["calcium"], 2),
        "vitamin_d": round(food.vitamin_d * factors["vitamin_d"], 2),
        "vitamin_b12": round(food.vitamin_b12 * factors["vitamin_b12"], 2),
        "vitamin_c": round(food.vitamin_c * factors["vitamin_c"], 2),
        "fiber": round(food.fiber * factors["fiber"], 2),
    }
