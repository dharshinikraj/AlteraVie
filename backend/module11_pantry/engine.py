"""
Module 11 - Pantry Chef.

Given the ingredients a person has at home, this module
  1. removes anything their diet / allergies / dislikes rule out,
  2. looks up each remaining ingredient's nutrient profile live from USDA
     FoodData Central (per 100 g) and ranks them against the user's
     deficiency nutrients,
  3. finds real recipes that use those ingredients from TheMealDB, scores them
     by how much of the recipe the pantry already covers and how much it helps
     the focus nutrients, and lists what is still missing.

Consistent with the rest of AlteraVie: no recipe or nutrient value is invented.
If a provider is unreachable the response says so instead of filling the gap.
"""
from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache

from module3_chemical.food_database import _excluded
from module10_live_data.client import usda_search_foods, USER_AGENT

MEALDB = "https://www.themealdb.com/api/json/v1/1"

# Everyone is assumed to have these; they never count as "missing".
ASSUMED_BASICS = {
    "salt", "water", "pepper", "black pepper", "oil", "olive oil", "vegetable oil",
    "sunflower oil", "cooking oil", "sugar", "ice", "cold water", "hot water",
}

# Regional / Indian names -> the English term used by USDA and TheMealDB.
ALIASES = {
    "dal": "lentils", "daal": "lentils", "toor dal": "lentils", "moong dal": "lentils",
    "masoor dal": "lentils", "chana dal": "chickpeas", "chana": "chickpeas",
    "kabuli chana": "chickpeas", "rajma": "kidney beans", "lobia": "black eyed peas",
    "atta": "flour", "maida": "flour", "besan": "gram flour", "suji": "semolina",
    "rava": "semolina", "poha": "rice flakes", "curd": "yogurt", "dahi": "yogurt",
    "paneer": "cottage cheese", "ghee": "butter", "brinjal": "aubergine",
    "eggplant": "aubergine", "capsicum": "green pepper", "bell pepper": "green pepper",
    "ladies finger": "okra", "bhindi": "okra", "palak": "spinach", "methi": "fenugreek",
    "jeera": "cumin", "haldi": "turmeric", "dhania": "coriander", "coriander leaves": "coriander",
    "hari mirch": "green chilli", "green chili": "green chilli", "aloo": "potatoes",
    "potato": "potatoes", "pyaaz": "onion", "onions": "onion", "tamatar": "tomatoes",
    "tomato": "tomatoes", "adrak": "ginger", "lehsun": "garlic", "nimbu": "lemon",
    "lemon juice": "lemon", "gobi": "cauliflower", "patta gobi": "cabbage",
    "gajar": "carrots", "carrot": "carrots", "matar": "peas", "bajra": "millet",
    "ragi": "finger millet", "jowar": "sorghum", "sabudana": "tapioca", "til": "sesame seeds",
    "sesame": "sesame seeds", "moongfali": "peanuts", "peanut": "peanuts", "kela": "banana",
    "egg": "eggs", "chicken": "chicken", "mutton": "lamb", "prawns": "shrimp", "prawn": "shrimp",
    "milk": "milk", "chawal": "rice", "doodh": "milk", "anda": "eggs",
}

# Quick local reference: per-100 g amount at which we call an ingredient a
# "good source". Rough labelling thresholds (not clinical advice).
GOOD_SOURCE_PER_100G = {
    "iron": 2.0, "calcium": 100.0, "vitamin d": 1.0, "vitamin b12": 0.5,
    "protein": 10.0, "vitamin c": 20.0, "fiber": 3.0,
}
UNITS = {"iron": "mg", "calcium": "mg", "vitamin d": "µg", "vitamin b12": "µg",
         "protein": "g", "vitamin c": "mg", "fiber": "g"}

MEAT_CATEGORIES = {"beef", "chicken", "lamb", "pork", "goat", "seafood"}
PREFERRED_USDA_TYPES = {"Foundation": 0, "SR Legacy": 1, "Survey (FNDDS)": 2}


# ----------------------------------------------------------------- helpers
def _get_json(url: str, timeout: int = 10) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def normalize(term: str) -> str:
    t = re.sub(r"[^a-z\s]", " ", (term or "").lower())
    t = re.sub(r"\s+", " ", t).strip()
    return ALIASES.get(t, t)


def _singular(word: str) -> str:
    if len(word) > 4 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 4 and word.endswith("oes"):
        return word[:-2]
    if len(word) > 3 and word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word


def _tokens(text: str) -> set[str]:
    return {_singular(w) for w in normalize(text).split() if w}


def ingredient_matches(pantry_item: str, recipe_ingredient: str) -> bool:
    """True when the recipe ingredient is covered by the pantry item."""
    p, r = _tokens(pantry_item), _tokens(recipe_ingredient)
    if not p or not r:
        return False
    return p <= r or r <= p


def is_basic(recipe_ingredient: str) -> bool:
    return normalize(recipe_ingredient) in ASSUMED_BASICS


def clean_ingredients(raw: list[str]) -> list[str]:
    seen, out = set(), []
    for item in raw:
        n = normalize(item)
        if n and n not in seen and len(n) <= 40:
            seen.add(n)
            out.append(n)
    return out


def _diet_blocks_text(text: str, diet: str, allergies: list[str], disliked: list[str]) -> bool:
    return _excluded(text, diet, allergies, disliked)


# ------------------------------------------------------------ USDA profile
@lru_cache(maxsize=512)
def _usda_profile(term: str) -> dict | None:
    try:
        rows = usda_search_foods(term, 10)
    except Exception:
        return None
    rows = [r for r in rows if r.get("nutrients")]
    if not rows:
        return None
    rows.sort(key=lambda r: (PREFERRED_USDA_TYPES.get(r.get("data_type"), 9),
                             0 if term.split()[0] in (r.get("name") or "").lower() else 1))
    best = rows[0]
    return {"usda_name": best.get("name"), "nutrients": best.get("nutrients", {}),
            "source": best.get("source"), "source_url": best.get("source_url")}


def _insight(term: str, focus: list[str]) -> dict:
    prof = _usda_profile(term)
    if not prof:
        return {"ingredient": term, "available": False, "good_source_of": [], "focus_values": {}}
    n = prof["nutrients"]
    good = [k for k, thr in GOOD_SOURCE_PER_100G.items() if float(n.get(k) or 0) >= thr]
    focus_vals = {f: round(float(n.get(f.lower()) or 0), 2) for f in focus if f.lower() in GOOD_SOURCE_PER_100G}
    return {"ingredient": term, "available": True, "usda_name": prof["usda_name"],
            "per_100g": {k: round(float(v), 2) for k, v in n.items() if v is not None},
            "good_source_of": good, "focus_values": focus_vals,
            "source": prof["source"], "source_url": prof["source_url"]}


def _focus_score(insight: dict, focus: list[str]) -> float:
    """Sum of (value / good-source threshold) over the focus nutrients, capped per nutrient."""
    score = 0.0
    for f in focus:
        key = f.lower()
        thr = GOOD_SOURCE_PER_100G.get(key)
        if thr:
            score += min(float(insight.get("focus_values", {}).get(f, 0)) / thr, 3.0)
    return score


# ------------------------------------------------------------ recipe lookup
def _mealdb_filter(term: str) -> list[dict]:
    names = [term] + ([term.split()[-1]] if " " in term else [])
    for name in names:
        try:
            data = _get_json(f"{MEALDB}/filter.php?i={urllib.parse.quote(name.replace(' ', '_'))}")
        except Exception:
            continue
        if data.get("meals"):
            return data["meals"]
    return []


@lru_cache(maxsize=512)
def _mealdb_lookup(meal_id: str) -> dict | None:
    try:
        data = _get_json(f"{MEALDB}/lookup.php?i={meal_id}")
    except Exception:
        return None
    meals = data.get("meals") or []
    return meals[0] if meals else None


def _recipe_ingredients(meal: dict) -> list[dict]:
    out = []
    for i in range(1, 21):
        name = (meal.get(f"strIngredient{i}") or "").strip()
        if name:
            out.append({"name": name, "measure": (meal.get(f"strMeasure{i}") or "").strip()})
    return out


def _diet_blocks_recipe(meal: dict, ings: list[dict], diet: str, allergies: list[str], disliked: list[str]) -> bool:
    d = (diet or "").lower()
    cat = (meal.get("strCategory") or "").lower()
    if d in {"vegetarian", "vegan"} and cat in MEAT_CATEGORIES:
        return True
    if _diet_blocks_text(meal.get("strMeal") or "", diet, allergies, disliked):
        return True
    return any(_diet_blocks_text(i["name"], diet, allergies, disliked) for i in ings)


def _score_recipe(meal: dict, pantry: list[str], insights: dict[str, dict], focus: list[str],
                  diet: str, allergies: list[str], disliked: list[str]) -> dict | None:
    ings = _recipe_ingredients(meal)
    if not ings or _diet_blocks_recipe(meal, ings, diet, allergies, disliked):
        return None
    have, missing = [], []
    matched_pantry: set[str] = set()
    for ing in ings:
        hit = next((p for p in pantry if ingredient_matches(p, ing["name"])), None)
        if hit:
            have.append(ing); matched_pantry.add(hit)
        elif not is_basic(ing["name"]):
            missing.append(ing)
    counted = len(have) + len(missing)
    if not matched_pantry or counted == 0:
        return None
    coverage = len(have) / counted
    focus_total = sum(_focus_score(insights.get(p, {}), focus) for p in matched_pantry)
    helps = sorted({n for p in matched_pantry for n in insights.get(p, {}).get("good_source_of", [])
                    if not focus or n in {f.lower() for f in focus}})
    # Coverage matters most; deficiency boost breaks ties and lifts relevant dishes.
    score = coverage * 100 + min(focus_total, 6.0) * 4 + len(matched_pantry) * 2
    return {
        "id": meal.get("idMeal"), "name": meal.get("strMeal"),
        "category": meal.get("strCategory"), "cuisine": meal.get("strArea"),
        "thumbnail": meal.get("strMealThumb"),
        "you_have": [i["name"] for i in have],
        "still_needed": [{"name": i["name"], "measure": i["measure"]} for i in missing],
        "coverage_percent": round(coverage * 100),
        "pantry_items_used": sorted(matched_pantry),
        "helps_with": [n.title() for n in helps],
        "ingredients": ings,
        "instructions": (meal.get("strInstructions") or "").strip(),
        "source": "TheMealDB",
        "source_url": meal.get("strSource") or f"https://www.themealdb.com/meal/{meal.get('idMeal')}",
        "youtube_url": meal.get("strYoutube") or None,
        "_score": score,
    }


# ------------------------------------------------------------ pairing tips
def _pairing_tips(insights: dict[str, dict], focus: list[str]) -> list[str]:
    tips = []
    avail = {k: v for k, v in insights.items() if v.get("available")}
    def best(nutrient, exclude=()):
        c = [(float(v.get("per_100g", {}).get(nutrient) or 0), k) for k, v in avail.items() if k not in exclude]
        c = [x for x in c if x[0] >= GOOD_SOURCE_PER_100G[nutrient]]
        return max(c)[1] if c else None
    focus_l = {f.lower() for f in focus}
    if "iron" in focus_l:
        iron, vit_c = best("iron"), best("vitamin c")
        if iron and vit_c and iron != vit_c:
            tips.append(f"Pair {iron} (iron) with {vit_c} (vitamin C) in the same meal - vitamin C improves absorption of plant iron.")
        elif iron and not vit_c:
            tips.append(f"{iron.title()} is your best iron source here. A squeeze of lemon or any vitamin C fruit/vegetable alongside would help absorption.")
    if "calcium" in focus_l or "vitamin d" in focus_l:
        ca, d = best("calcium"), best("vitamin d")
        if ca and d and ca != d:
            tips.append(f"{ca.title()} (calcium) with {d} (vitamin D) makes a good bone-support combination.")
    for f in focus:
        k = f.lower()
        if k in GOOD_SOURCE_PER_100G and not best(k):
            tips.append(f"None of your current ingredients is a strong source of {f}. Consider adding one on your next shop.")
    return tips


# ------------------------------------------------------------ orchestration
def suggest(ingredients: list[str], diet: str, allergies: list[str], disliked: list[str],
            focus_nutrients: list[str], limit: int = 8) -> dict:
    notes: list[str] = []
    focus = [f for f in dict.fromkeys(focus_nutrients or []) if f.lower() in GOOD_SOURCE_PER_100G]
    cleaned = clean_ingredients(ingredients)

    usable, excluded = [], []
    for ing in cleaned:
        if _diet_blocks_text(ing, diet, allergies, disliked):
            excluded.append({"ingredient": ing, "reason": "Excluded by your diet, allergy or dislike settings"})
        else:
            usable.append(ing)
    if not usable:
        return {"ingredients_used": [], "ingredients_excluded": excluded, "focus_nutrients": focus,
                "ingredient_insights": [], "pairing_tips": [], "recipes": [], "recipes_available": False,
                "notes": ["Every ingredient you entered is excluded by your safety filters."]}

    with ThreadPoolExecutor(max_workers=6) as pool:
        insight_list = list(pool.map(lambda t: _insight(t, focus), usable))
        mealdb_lists = list(pool.map(_mealdb_filter, usable))
    insights = {i["ingredient"]: i for i in insight_list}

    if not any(i["available"] for i in insight_list):
        notes.append("USDA FoodData Central could not be reached, so nutrient details are unavailable right now.")

    # Candidate recipes: how many pantry ingredients does each hit?
    hits: dict[str, int] = {}
    for meals in mealdb_lists:
        for m in meals:
            hits[m["idMeal"]] = hits.get(m["idMeal"], 0) + 1
    recipes_available = bool(hits)
    if not hits:
        notes.append("No recipes could be retrieved (TheMealDB unreachable or no matches). "
                     "Your ingredient nutrient ranking is still shown below.")

    top_ids = [mid for mid, _ in sorted(hits.items(), key=lambda kv: -kv[1])[:25]]
    with ThreadPoolExecutor(max_workers=6) as pool:
        meals = list(pool.map(_mealdb_lookup, top_ids))

    scored = []
    for meal in meals:
        if not meal:
            continue
        r = _score_recipe(meal, usable, insights, focus, diet, allergies, disliked)
        if r:
            scored.append(r)
    scored.sort(key=lambda r: -r["_score"])
    recipes = []
    for r in scored[:limit]:
        r.pop("_score", None)
        recipes.append(r)
    if hits and not recipes:
        notes.append("Recipes were found, but none fit your diet/allergy filters with these ingredients. Try adding more ingredients.")
    if recipes:
        notes.append("Recipe ingredient lists are checked against your allergy and diet filters, but always read the full method and labels yourself.")

    ranked = sorted(insight_list, key=lambda i: (-_focus_score(i, focus), -len(i.get("good_source_of", []))))
    return {
        "ingredients_used": usable, "ingredients_excluded": excluded, "focus_nutrients": focus,
        "ingredient_insights": ranked, "pairing_tips": _pairing_tips(insights, focus),
        "recipes": recipes, "recipes_available": recipes_available and bool(recipes), "notes": notes,
    }
