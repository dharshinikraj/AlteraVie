"""Live food composition adapter backed by USDA FoodData Central.
No embedded nutrient table or recipe catalog is stored in this module.
"""
from dataclasses import dataclass, field
from module10_live_data.client import usda_search_foods, live_food_recommendations

@dataclass
class Food:
    name: str; category: str = "USDA food"; calories: float = 0.0; protein: float = 0.0
    fat: float = 0.0; carbs: float = 0.0; iron: float = 0.0; calcium: float = 0.0
    vitamin_d: float = 0.0; vitamin_b12: float = 0.0; vitamin_c: float = 0.0; fiber: float = 0.0
    tags: list = field(default_factory=list); allergens: list = field(default_factory=list)
    source_url: str | None = None

@dataclass
class MealRecipe:
    name: str; meal_type: str; ingredients: list[str]; allergens: list[str]; diet_tags: list[str]
    portion_description: str; calories: float; protein: float; iron: float; calcium: float
    vitamin_d: float; vitamin_b12: float; vitamin_c: float; fiber: float
    target_nutrients: list[str]; prep_tip: str

ATTR_TO_LIVE = {"iron":"iron","calcium":"calcium","vitamin_d":"vitamin d","vitamin_b12":"vitamin b12","protein":"protein","vitamin_c":"vitamin c","fiber":"fiber"}

def _food_from_record(r: dict) -> Food:
    n=r.get("nutrients",{})
    return Food(name=r.get("name") or "USDA food", protein=float(n.get("protein") or 0), iron=float(n.get("iron") or 0), calcium=float(n.get("calcium") or 0), vitamin_d=float(n.get("vitamin d") or 0), vitamin_b12=float(n.get("vitamin b12") or 0), vitamin_c=float(n.get("vitamin c") or 0), fiber=float(n.get("fiber") or 0), source_url=r.get("source_url"))

ALLERGY_TERMS = {
    "eggs": {"egg", "omelette", "mayonnaise", "albumen"},
    "egg": {"egg", "omelette", "mayonnaise", "albumen"},
    "dairy": {"milk", "cheese", "yogurt", "yoghurt", "paneer", "whey", "casein", "butter", "cream"},
    "milk": {"milk", "cheese", "yogurt", "yoghurt", "paneer", "whey", "casein", "butter", "cream"},
    "nuts": {"peanut", "almond", "cashew", "walnut", "pistachio", "hazelnut", "pecan", "macadamia", "nut"},
    "tree nuts": {"almond", "cashew", "walnut", "pistachio", "hazelnut", "pecan", "macadamia"},
    "peanuts": {"peanut"},
    "seafood": {"fish", "salmon", "sardine", "tuna", "shrimp", "prawn", "crab", "lobster", "shellfish"},
    "shellfish": {"shrimp", "prawn", "crab", "lobster", "shellfish"},
    "soy": {"soy", "soya", "tofu", "tempeh", "edamame"},
    "wheat_gluten": {"wheat", "gluten", "barley", "rye"},
    "wheat/gluten": {"wheat", "gluten", "barley", "rye"},
    "gluten": {"wheat", "gluten", "barley", "rye"},
}

def _matches_exclusion(text: str, term: str) -> bool:
    key = (term or "").lower().strip()
    if not key:
        return False
    tokens = ALLERGY_TERMS.get(key, {key})
    return any(token in text for token in tokens)

def _excluded(name: str, diet_filter: str | None, allergies: list[str], disliked: list[str]) -> bool:
    low = name.lower(); diet = (diet_filter or "").lower()
    if diet in {"vegetarian", "vegan"} and any(x in low for x in ["beef", "chicken", "fish", "salmon", "sardine", "pork", "tuna", "mutton", "lamb"]):
        return True
    if diet == "vegan" and any(x in low for x in ["milk", "cheese", "yogurt", "yoghurt", "egg", "paneer", "whey", "casein", "butter", "cream"]):
        return True
    if any(_matches_exclusion(low, x) for x in allergies):
        return True
    if any((x or "").lower().strip() in low for x in disliked if (x or "").strip()):
        return True
    return False

def get_food(name: str) -> Food | None:
    try:
        rows=usda_search_foods(name,1)
        return _food_from_record(rows[0]) if rows else None
    except Exception: return None

def get_all_foods() -> list[Food]:
    # A live query set, not a stored food table.
    out=[]; seen=set()
    for q in ["lentils","spinach","milk","tofu","salmon","eggs","chickpeas"]:
        try: rows=usda_search_foods(q,2)
        except Exception: continue
        for r in rows:
            if r.get("fdc_id") in seen: continue
            seen.add(r.get("fdc_id")); out.append(_food_from_record(r))
    return out

def is_food_safe(food: Food, allergies: list[str], disliked_foods: list[str]) -> bool:
    return not _excluded(food.name,None,allergies or [],disliked_foods or [])

def is_recipe_safe(recipe: MealRecipe, allergies: list[str], disliked_foods: list[str]) -> bool:
    text=(recipe.name+" "+" ".join(recipe.ingredients)).lower()
    return not any(x.lower().strip() in text for x in (allergies or [])+(disliked_foods or []) if x.strip())

def foods_rich_in(nutrient_attr: str, diet_filter: str | None=None, allergies: list[str]|None=None, disliked_foods: list[str]|None=None, top_n: int=6) -> list[Food]:
    nutrient=ATTR_TO_LIVE.get(nutrient_attr,nutrient_attr)
    try: rows=live_food_recommendations(nutrient,diet_filter or "non-vegetarian",limit=max(top_n*2,6))
    except Exception: rows=[]
    foods=[_food_from_record(r) for r in rows if not _excluded(r.get("name") or "",diet_filter,allergies or [],disliked_foods or [])]
    foods.sort(key=lambda f:getattr(f,nutrient_attr,0),reverse=True)
    return foods[:top_n]

def foods_rich_in_cooked(nutrient_attr: str, cooking_method: str, retention_factors: dict, diet_filter: str|None=None, allergies: list[str]|None=None, disliked_foods: list[str]|None=None, top_n: int=6) -> list[Food]:
    # USDA record is the source; cooking factor is applied later by the chemical engine.
    return foods_rich_in(nutrient_attr,diet_filter,allergies,disliked_foods,top_n)

def get_filtered_meal_recipes(diet_filter: str|None=None, allergies: list[str]|None=None, disliked_foods: list[str]|None=None) -> list[MealRecipe]:
    # No static recipes are fabricated. The app recommends real source-backed foods instead.
    return []
