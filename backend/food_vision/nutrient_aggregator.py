"""Live USDA-backed nutrient lookup for a vision-classified dish label.
The image model predicts a label; nutrition is then retrieved from USDA FoodData Central.
No static recipe composition table is used.
"""
from module10_live_data.client import usda_search_foods
from food_vision.glycemic import get_dish_glycemic_profile

NUTRITION_DISCLAIMER = (
    "Nutrition values come from the closest USDA FoodData Central text match for the predicted dish label. "
    "They are reference values, not a measurement of the photographed plate. Portion size is represented as 100 g × the selected multiplier."
)

def calculate_dish_nutrients(dish_name: str, portion_multiplier: float = 1.0) -> dict:
    rows = usda_search_foods(dish_name.replace('_',' '), page_size=5)
    if not rows:
        raise KeyError(f"No live USDA FoodData Central match found for '{dish_name}'.")
    r = rows[0]; n = r.get("nutrients", {})
    scale=float(portion_multiplier)
    totals={
        "calories": round(float(n.get("calories") or 0)*scale,2),
        "protein": round(float(n.get("protein") or 0)*scale,2),
        "fat": round(float(n.get("fat") or 0)*scale,2),
        "carbs": round(float(n.get("carbs") or 0)*scale,2),
        "iron": round(float(n.get("iron") or 0)*scale,2),
        "calcium": round(float(n.get("calcium") or 0)*scale,2),
        "vitamin_d": round(float(n.get("vitamin d") or 0)*scale,2),
        "vitamin_b12": round(float(n.get("vitamin b12") or 0)*scale,2),
        "vitamin_c": round(float(n.get("vitamin c") or 0)*scale,2),
        "fiber": round(float(n.get("fiber") or 0)*scale,2),
    }
    glycemic_data = get_dish_glycemic_profile(dish_name, totals)
    return {
        "dish_name": dish_name,
        "portion_multiplier": scale,
        "typical_serving_g": 100.0,
        "estimated_total_weight_g": round(100.0*scale,1),
        "total_nutrients": totals,
        "glycemic": glycemic_data,
        "ingredients_breakdown": [{
            "ingredient_name": r.get("name") or dish_name,
            "raw_serving_grams": 100.0,
            "cooked_scaled_grams": round(100.0*scale,1),
            "cooking_method": "USDA reference food",
            "nutrients": totals,
        }],
        "disclaimer": NUTRITION_DISCLAIMER + f" Source: {r.get('source_url')}",
    }
