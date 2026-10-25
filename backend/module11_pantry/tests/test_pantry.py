"""Offline tests for Pantry Chef. External providers (USDA, TheMealDB) are mocked."""
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from module11_pantry import engine, routes

USDA = {
    "lentils": {"iron": 3.3, "protein": 9.0, "fiber": 7.9},
    "spinach": {"iron": 2.7, "vitamin c": 28.0, "calcium": 99.0, "protein": 2.9},
    "lemon": {"vitamin c": 53.0},
    "yogurt": {"calcium": 121.0, "protein": 10.0, "vitamin b12": 0.5},
    "chicken": {"protein": 21.0},
    "rice": {"protein": 2.7},
}

def fake_usda(term, page_size=8):
    if term not in USDA:
        return []
    return [{"fdc_id": 1, "name": term.title() + ", raw", "data_type": "Foundation",
             "nutrients": USDA[term], "source": "USDA FoodData Central", "source_url": "https://fdc.nal.usda.gov/"}]

MEALS = {
    "1": {"idMeal": "1", "strMeal": "Lentil Soup", "strCategory": "Vegetarian", "strArea": "Indian",
          "strIngredient1": "Lentils", "strMeasure1": "1 cup", "strIngredient2": "Onion", "strMeasure2": "1",
          "strIngredient3": "Salt", "strMeasure3": "pinch", "strIngredient4": "Lemon", "strMeasure4": "1",
          "strInstructions": "Cook.", "strMealThumb": "x"},
    "2": {"idMeal": "2", "strMeal": "Chicken Curry", "strCategory": "Chicken", "strArea": "Indian",
          "strIngredient1": "Chicken", "strMeasure1": "500g", "strIngredient2": "Rice", "strMeasure2": "1 cup",
          "strInstructions": "Cook.", "strMealThumb": "x"},
    "3": {"idMeal": "3", "strMeal": "Palak Paneer", "strCategory": "Vegetarian", "strArea": "Indian",
          "strIngredient1": "Spinach", "strMeasure1": "1 bunch", "strIngredient2": "Paneer", "strMeasure2": "200g",
          "strInstructions": "Cook.", "strMealThumb": "x"},
}
BY_ING = {"lentils": ["1"], "chicken": ["2"], "rice": ["2"], "spinach": ["3"], "lemon": ["1"], "onion": ["1"]}

def fake_filter(term):
    return [{"idMeal": i} for i in BY_ING.get(term, [])]

def fake_lookup(mid):
    return MEALS.get(mid)

def run(payload):
    engine._usda_profile.cache_clear(); engine._mealdb_lookup.cache_clear()
    app = FastAPI(); app.include_router(routes.router)
    with patch.object(engine, "usda_search_foods", fake_usda), \
         patch.object(engine, "_mealdb_filter", fake_filter), \
         patch.object(engine, "_mealdb_lookup", fake_lookup):
        return TestClient(app).post("/pantry/suggest", json=payload)

def test_alias_and_matching():
    assert engine.normalize("Dal") == "lentils"
    assert engine.ingredient_matches("onion", "Red Onion")
    assert engine.ingredient_matches("tomatoes", "Tomato")
    assert not engine.ingredient_matches("rice", "Chicken")

def test_vegetarian_blocks_chicken():
    r = run({"ingredients": ["dal", "chicken", "rice", "onion", "lemon"], "diet": "vegetarian",
             "focus_nutrients": ["Iron"]})
    assert r.status_code == 200, r.text
    j = r.json()
    names = [x["name"] for x in j["recipes"]]
    assert "Lentil Soup" in names and "Chicken Curry" not in names
    assert any(e["ingredient"] == "chicken" for e in j["ingredients_excluded"])
    soup = next(x for x in j["recipes"] if x["name"] == "Lentil Soup")
    assert soup["coverage_percent"] == 100 and soup["still_needed"] == []  # salt is a basic
    assert "Iron" in soup["helps_with"]
    assert j["ingredient_insights"][0]["ingredient"] == "lentils"

def test_allergy_filters_recipe_ingredient():
    # Palak Paneer contains paneer (dairy) -> must be dropped for a dairy allergy
    r = run({"ingredients": ["spinach"], "diet": "vegetarian", "allergies": ["dairy"], "focus_nutrients": ["Iron"]})
    j = r.json()
    assert j["recipes"] == [] and j["recipes_available"] is False

def test_missing_listed_and_pairing():
    r = run({"ingredients": ["spinach", "lemon"], "diet": "vegetarian", "focus_nutrients": ["Iron"]})
    j = r.json()
    pal = next(x for x in j["recipes"] if x["name"] == "Palak Paneer")
    assert [m["name"] for m in pal["still_needed"]] == ["Paneer"]
    assert any("vitamin C" in t for t in j["pairing_tips"])

def test_providers_down_is_honest():
    engine._usda_profile.cache_clear()
    app = FastAPI(); app.include_router(routes.router)
    def boom(*a, **k): raise OSError("offline")
    with patch.object(engine, "usda_search_foods", boom), patch.object(engine, "_get_json", boom):
        r = TestClient(app).post("/pantry/suggest", json={"ingredients": ["rice"]})
    j = r.json()
    assert r.status_code == 200 and j["recipes"] == [] and j["notes"]

def test_validation():
    assert run({"ingredients": []}).status_code == 422
    assert run({"ingredients": ["rice"], "diet": "carnivore"}).status_code == 400
