import pytest
from module3_chemical.food_database import is_food_safe, is_recipe_safe, get_food, get_filtered_meal_recipes
from module4_recommendation.engine import build_daily_meal_plan, build_recommendations


def test_allergy_filtering_food():
    egg_food = get_food("Eggs")
    assert egg_food is not None
    # Test egg allergy filter
    assert is_food_safe(egg_food, allergies=["eggs"], disliked_foods=[]) is False
    assert is_food_safe(egg_food, allergies=[], disliked_foods=[]) is True

    milk_food = get_food("Milk")
    assert milk_food is not None
    assert is_food_safe(milk_food, allergies=["dairy"], disliked_foods=[]) is False
    assert is_food_safe(milk_food, allergies=[], disliked_foods=[]) is True


def test_dislike_filtering_food():
    spinach_food = get_food("Spinach")
    assert spinach_food is not None
    assert is_food_safe(spinach_food, allergies=[], disliked_foods=["spinach"]) is False
    assert is_food_safe(spinach_food, allergies=[], disliked_foods=["banana"]) is True


def test_recipe_allergy_exclusion():
    # Fetch safe recipes for egg allergy
    recipes = get_filtered_meal_recipes(diet_filter="non-vegetarian", allergies=["eggs"], disliked_foods=[])
    for r in recipes:
        assert "eggs" not in [a.lower() for a in r.allergens]
        for ing in r.ingredients:
            assert "egg" not in ing.lower()


def test_daily_meal_plan_generation():
    plan = build_daily_meal_plan(
        diet="vegetarian",
        top_deficiencies=["Iron", "Calcium"],
        allergies=["dairy"],
        disliked_foods=["mushroom"],
        daily_targets={"calories": 2000, "protein_g": 60, "iron_mg": 15, "calcium_mg": 1000},
    )

    assert "meals" in plan
    assert "breakfast" in plan["meals"]
    assert "lunch" in plan["meals"]
    assert "snack" in plan["meals"]
    assert "dinner" in plan["meals"]

    # Verify no dairy in chosen breakfast/lunch/dinner
    for m_type, meal in plan["meals"].items():
        assert "dairy" not in [a.lower() for a in meal.get("allergens", [])]
        for ing in meal.get("ingredients", []):
            assert "paneer" not in ing.lower()
            assert "curd" not in ing.lower()
            assert "milk" not in ing.lower()


def test_build_recommendations_with_meal_plan():
    predictions = [{"nutrient": "Iron", "probability_percent": 80.0}]
    top_deficiencies = ["Iron"]
    nutrition_analysis = {
        "daily_requirements": {"calories": 2000, "protein_g": 60, "iron_mg": 18},
        "nutrient_analysis": [],
        "interaction_rules": [],
    }

    res = build_recommendations(
        predictions=predictions,
        top_deficiencies=top_deficiencies,
        nutrition_analysis=nutrition_analysis,
        allergies=["eggs"],
        disliked_foods=["mushroom"],
    )

    assert "daily_meal_plan" in res
    assert res["daily_meal_plan"]["active_allergy_filters"] == ["eggs"]
    assert res["daily_meal_plan"]["active_dislike_filters"] == ["mushroom"]
