"""
Module 4 — Recommendation Engine.

Combines Module 2 (ML prediction) output with Module 3 (chemical
nutrition engine) output into a single personalized, human-readable
recommendation set. Pure combination/formatting logic — no ML here.
"""
from .deals import get_deals_for_deficiencies

COOKING_TIP_BY_NUTRIENT = {
    "Iron": "Steam or lightly boil iron-rich vegetables — avoid overcooking, which "
            "degrades absorption further. Pair with a vitamin C source.",
    "Vitamin D": "Favor sun-exposed mushrooms and fatty fish prepared by steaming or "
                 "light grilling; frying degrades vitamin D content.",
    "Calcium": "Steam leafy/calcium-rich vegetables rather than boiling, since boiling "
               "leaches calcium into the water.",
    "Vitamin B12": "B12 is heat-sensitive in animal foods — prefer gentle cooking "
                    "(steaming, poaching) over prolonged frying or boiling.",
    "Protein": "Steaming or boiling preserves more protein quality than deep frying, "
               "which can degrade amino acid availability.",
}

AVOID_BY_NUTRIENT = {
    "Iron": ["Tea or coffee immediately after meals", "Excessive raw bran/whole grain without soaking"],
    "Vitamin D": ["Prolonged deep-frying of vitamin D sources", "Very low-fat preparation (impairs absorption)"],
    "Calcium": ["Coffee within 1-2 hours of calcium-rich meals", "Excess sodium intake (increases calcium excretion)"],
    "Vitamin B12": ["Prolonged high-heat cooking of animal-source foods"],
    "Protein": ["Deep-frying protein sources repeatedly (degrades amino acids)"],
}

LIFESTYLE_ADVICE_BY_NUTRIENT = {
    "Iron": "Get adequate sleep and moderate exercise; chronic fatigue can mask "
            "as tiredness even when iron intake improves — recheck levels after 6-8 weeks.",
    "Vitamin D": "Aim for 15-20 minutes of midday sun exposure a few times a week "
                 "in addition to dietary sources.",
    "Calcium": "Combine calcium intake with regular weight-bearing activity (walking, "
               "light resistance training) to support bone density.",
    "Vitamin B12": "If following a vegan diet long-term, consider a B12 supplement "
                    "as plant foods rarely contain reliable amounts.",
    "Protein": "Distribute protein intake across meals rather than one large serving, "
               "for better utilization, especially if physically active.",
}


from module3_chemical.food_database import get_filtered_meal_recipes, MealRecipe


def build_daily_meal_plan(
    diet: str, top_deficiencies: list[str], allergies: list[str] | None = None,
    disliked_foods: list[str] | None = None, daily_targets: dict | None = None,
) -> dict:
    """Builds a live food shortlist from USDA; never invents a recipe or nutrient total."""
    from module10_live_data.client import live_food_recommendations
    from module3_chemical.food_database import _excluded
    allergies = allergies or []; disliked_foods = disliked_foods or []
    focus = top_deficiencies or ["Iron", "Protein"]
    foods=[]; seen=set()
    for nutrient in focus:
        try: rows=live_food_recommendations(nutrient, diet=diet, limit=8)
        except Exception: rows=[]
        for r in rows:
            name=(r.get("name") or "")
            if _excluded(name, diet, allergies, disliked_foods):
                continue
            if r.get("fdc_id") in seen: continue
            seen.add(r.get("fdc_id")); foods.append(r)
    slots=["breakfast","lunch","snack","dinner"]
    meals={}
    for i,slot in enumerate(slots):
        item=foods[i] if i < len(foods) else None
        meals[slot] = ({
            "name": item.get("name"), "portion": "See USDA serving/food record",
            "ingredients": [], "allergens": [], "nutrients": item.get("nutrients",{}),
            "source": item.get("source"), "source_url": item.get("source_url"),
            "prep_tip": "Choose a preparation compatible with your allergies and clinical advice."
        } if item else {"name": "No live USDA result available", "source": "USDA FoodData Central"})
    return {"meals": meals, "daily_totals": {}, "target_coverage_percent": {}, "active_allergy_filters": allergies, "active_dislike_filters": disliked_foods, "data_note": "No synthetic meal nutrition totals are calculated. Open the source record for serving-specific values."}

def build_recommendations(
    predictions: list[dict],
    top_deficiencies: list[str],
    nutrition_analysis: dict,
    levothyroxine: bool = False,
    warfarin: bool = False,
    metformin: bool = False,
    omeprazole: bool = False,
    statins: bool = False,
    diuretics: bool = False,
    corticosteroids: bool = False,
    diet: str = "vegetarian",
    allergies: list[str] | None = None,
    disliked_foods: list[str] | None = None,
) -> dict:
    """
    Build the final personalized recommendation payload with comprehensive drug interaction warnings.
    """
    recommendations = []
    allergies = allergies or []
    disliked_foods = disliked_foods or []

    analysis_by_nutrient = {
        section["nutrient"]: section
        for section in nutrition_analysis.get("nutrient_analysis", [])
    }

    for nutrient in top_deficiencies:
        section = analysis_by_nutrient.get(nutrient, {})
        recommended_foods = [f["name"] for f in section.get("top_foods", [])]

        recommendations.append({
            "nutrient": nutrient,
            "risk_level": _risk_label(predictions, nutrient),
            "recommended_foods": recommended_foods,
            "cooking_suggestion": COOKING_TIP_BY_NUTRIENT.get(nutrient, "Prefer steaming or boiling over frying."),
            "foods_to_avoid_or_time_carefully": AVOID_BY_NUTRIENT.get(nutrient, []),
            "lifestyle_advice": LIFESTYLE_ADVICE_BY_NUTRIENT.get(nutrient, ""),
        })

    # Generate drug safety warnings
    drug_safety_warnings = []

    if levothyroxine:
        has_iron_or_calcium = any(n in top_deficiencies for n in ["Iron", "Calcium"])
        advice = (
            "Take Levothyroxine on an empty stomach first thing in the morning. Space calcium-rich foods "
            "(dairy, tofu) and iron-rich foods/supplements by at least 4 hours from your medication."
            if has_iron_or_calcium else
            "Take Levothyroxine on an empty stomach. If you take iron or calcium supplements, "
            "ensure they are spaced at least 4 hours apart from your thyroid medication."
        )
        drug_safety_warnings.append({
            "medication": "Levothyroxine (Thyroid Hormone)",
            "severity": "Warning" if has_iron_or_calcium else "Info",
            "trigger_nutrient": "Calcium / Iron" if has_iron_or_calcium else "General",
            "description": "Calcium and iron supplements or calcium/iron-rich meals can bind to Levothyroxine in the GI tract, significantly reducing its absorption.",
            "advice": advice
        })

    if warfarin:
        recommended_foods_list = []
        for rec in recommendations:
            recommended_foods_list.extend(rec.get("recommended_foods", []))
        has_greens = any(f in recommended_foods_list for f in ["Spinach", "Broccoli"])
        advice = (
            "Your personalized plan recommends Vitamin K-rich greens (Spinach/Broccoli). "
            "To prevent fluctuating Warfarin levels, keep your daily intake of green leafy vegetables consistent. "
            "Do not suddenly increase or decrease consumption without consulting your physician."
            if has_greens else
            "Maintain a consistent intake of Vitamin K-rich foods (green leafy vegetables). "
            "Avoid making sudden drastic changes to your vegetable intake without medical guidance."
        )
        drug_safety_warnings.append({
            "medication": "Warfarin (Blood Thinner)",
            "severity": "Critical" if has_greens else "Warning",
            "trigger_nutrient": "Vitamin K",
            "description": "Warfarin functions as a Vitamin K antagonist. Sudden changes in dietary Vitamin K intake can alter blood clotting time (INR).",
            "advice": advice
        })

    if metformin:
        drug_safety_warnings.append({
            "medication": "Metformin (Diabetes Medication)",
            "severity": "Warning",
            "trigger_nutrient": "Vitamin B12 & Calcium",
            "description": "Long-term Metformin therapy impairs B12-intrinsic factor absorption in the ileum and can lead to progressive Vitamin B12 depletion.",
            "advice": "Ensure adequate Vitamin B12 intake (fortified foods/dairy or sublingual B12) and monitor serum B12 levels annually with your physician."
        })

    if omeprazole:
        drug_safety_warnings.append({
            "medication": "Omeprazole / PPIs (Stomach Acid Suppressants)",
            "severity": "Warning",
            "trigger_nutrient": "Vitamin B12, Iron & Magnesium",
            "description": "Reduced gastric acid secretion impairs the cleavage of Vitamin B12 and Non-Heme Iron from dietary proteins, lowering absorption efficiency.",
            "advice": "Pair iron-rich plant foods with Vitamin C (lemon juice, bell peppers) to enhance non-acid dependent absorption."
        })

    if statins:
        drug_safety_warnings.append({
            "medication": "Statins (Cholesterol Medication)",
            "severity": "Info",
            "trigger_nutrient": "Vitamin D & CoQ10",
            "description": "HMG-CoA reductase inhibition can alter endogenous Vitamin D precursor synthesis and Coenzyme Q10 availability.",
            "advice": "Maintain daily Vitamin D adequacy through sunlight exposure or fortified food sources."
        })

    if diuretics:
        drug_safety_warnings.append({
            "medication": "Diuretics (Water Pills)",
            "severity": "Warning",
            "trigger_nutrient": "Magnesium, Potassium & Zinc",
            "description": "Increased renal excretion can deplete essential electrolytes and trace minerals including Potassium, Magnesium, and Zinc.",
            "advice": "Include mineral-dense foods (bananas, coconut water, pumpkin seeds, leafy greens) to support electrolyte balance."
        })

    if corticosteroids:
        drug_safety_warnings.append({
            "medication": "Corticosteroids (Steroid Anti-Inflammatories)",
            "severity": "Critical",
            "trigger_nutrient": "Calcium & Vitamin D",
            "description": "Steroids suppress intestinal calcium absorption and accelerate renal calcium loss, increasing risk of bone mineral density decline.",
            "advice": "Prioritize Calcium and Vitamin D rich foods in every daily meal to protect bone density."
        })

    daily_targets = nutrition_analysis.get("daily_requirements", {})
    daily_meal_plan = build_daily_meal_plan(
        diet=diet,
        top_deficiencies=top_deficiencies,
        allergies=allergies,
        disliked_foods=disliked_foods,
        daily_targets=daily_targets,
    )

    # Fetch deficiency-targeted products ON SALE
    deals_on_sale = get_deals_for_deficiencies(top_deficiencies)

    return {
        "summary": _build_summary(top_deficiencies),
        "detailed_recommendations": recommendations,
        "daily_nutrient_targets": daily_targets,
        "relevant_nutrient_interactions": nutrition_analysis.get("interaction_rules", []),
        "drug_safety_warnings": drug_safety_warnings,
        "daily_meal_plan": daily_meal_plan,
        "deals_on_sale": deals_on_sale,
    }


def _risk_label(predictions: list[dict], nutrient: str) -> str:
    for p in predictions:
        if p["nutrient"] == nutrient:
            pct = p["probability_percent"]
            if pct >= 75:
                return "High"
            if pct >= 50:
                return "Moderate"
            return "Low"
    return "Unknown"


def _build_summary(top_deficiencies: list[str]) -> str:
    if not top_deficiencies:
        return "No significant deficiency risk detected. Maintain a balanced, varied diet."
    if len(top_deficiencies) == 1:
        return f"{top_deficiencies[0]} deficiency risk detected."
    return f"Multiple deficiency risks detected: {', '.join(top_deficiencies)}."
