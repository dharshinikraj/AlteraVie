"""GI/GL calculations for Food Vision dish estimates."""

# Approximate reference GI values for commonly published ingredients
INGREDIENT_GI = {
    "White Rice (cooked)": 73,
    "Sushi Rice (cooked)": 65,
    "Refined Flour (maida)": 70,
    "Whole Wheat Flour": 69,
    "Gram Flour (besan)": 28,
    "Semolina (suji)": 66,
    "Pizza Dough": 60,
    "Burger Bun": 70,
    "Puri (wheat)": 65,
    "Lentils": 32,
    "Chickpeas": 28,
    "Onion": 10,
    "Tomato": 15,
    "Potato": 78,
    "Capsicum": 15,
    "Spinach": 15,
    "Cauliflower": 15,
    "Green Peas": 48,
    "Carrot": 39,
    "Sweet Corn": 52,
    "Sugar": 65,
    "Tamarind Paste": 23,
    "Pomegranate Seeds": 35,
    "Sev (chickpea noodles)": 45,
    "Peanuts (roasted)": 14,
    "Lemon Juice": 20,
}

# Reference GI mapping for classifier dish categories
DISH_GI = {
    "Biryani": 60,
    "Caesar Salad": 30,
    "Chole Bhature": 68,
    "Dabeli": 65,
    "Dal": 32,
    "Dhokla": 35,
    "Dosa": 55,
    "French Fries": 75,
    "Fried Rice": 68,
    "Hamburger": 66,
    "Ice Cream": 62,
    "Jalebi": 75,
    "Kathi Roll": 62,
    "Kofta": 58,
    "Naan": 70,
    "Omelette": 15,
    "Pakora": 58,
    "Paneer (curry)": 40,
    "Pani Puri": 60,
    "Pav Bhaji": 65,
    "Pancakes": 68,
    "Pizza": 60,
    "Steak": 10,
    "Sushi": 65,
    "Vada Pav": 68,
}


def _category(value: float | None, low: float, medium: float) -> str | None:
    if value is None:
        return None
    if value <= low:
        return "Low"
    if value <= medium:
        return "Medium"
    return "High"


def gl_category(value: float | None) -> str | None:
    return _category(value, 10, 19)


def gi_category(value: float | None) -> str | None:
    return _category(value, 55, 69)


def get_dish_glycemic_profile(dish_name: str, totals: dict) -> dict:
    """Computes GI, GL, Available Carbs, and categories for a dish based on USDA totals."""
    carbs = float(totals.get("carbs") or 0.0)
    fiber = float(totals.get("fiber") or 0.0)
    available_carbs = max(0.0, carbs - fiber)
    
    # Lookup GI from dish database or estimate from fiber ratio
    gi = DISH_GI.get(dish_name)
    if gi is None:
        norm_name = dish_name.replace("_", " ").title()
        gi = DISH_GI.get(norm_name, 55)
    
    available_carbs = round(available_carbs, 2)
    gl = round((float(gi) * available_carbs) / 100.0, 2)
    
    return {
        "gi": float(gi),
        "gi_category": gi_category(gi),
        "available_carbs_g": available_carbs,
        "gl": gl,
        "gl_category": gl_category(gl),
    }


def calculate_dish_glycemic_profile(ingredients: list[dict], portion_multiplier: float) -> dict:
    """Calculate carbohydrate-weighted dish GI and portion-dependent GL."""
    weighted_gi = 0.0
    known_available_carbs = 0.0

    for ingredient in ingredients:
        gi = INGREDIENT_GI.get(ingredient["ingredient_name"])
        nutrients = ingredient["nutrients"]
        available_carbs = max(0.0, nutrients.get("carbs", 0.0) - nutrients.get("fiber", 0.0))
        if gi is not None and available_carbs > 0:
            weighted_gi += gi * available_carbs
            known_available_carbs += available_carbs

    if known_available_carbs == 0:
        return {"gi": None, "gi_category": None, "available_carbs_g": None, "gl": None, "gl_category": None}

    gi = round(weighted_gi / known_available_carbs, 2)
    available_carbs = round(known_available_carbs, 2)
    gl = round(gi * available_carbs / 100.0, 2)
    return {
        "gi": gi,
        "gi_category": gi_category(gi),
        "available_carbs_g": available_carbs,
        "gl": gl,
        "gl_category": gl_category(gl),
    }
