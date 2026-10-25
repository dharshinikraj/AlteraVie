"""
Cooking-method nutrient retention factors.

These retention factors adjust nutrient values based on the cooking method.
Frying increases fat content and calories, while high heat degrades Vitamin C.
Boiling and steaming cause leaching of water-soluble vitamins (Vitamin C, Vitamin B12)
and minerals (Iron, Calcium), with boiling having a more pronounced effect.

Source Assumptions:
- Approximate published food-science ranges from USDA Table of Nutrient Retention Factors
  and general literature on food chemistry (e.g., thermal degradation and solubility rates).
"""

RETENTION_FACTORS = {
    "raw": {
        "calories": 1.0,
        "protein": 1.0,
        "fat": 1.0,
        "carbs": 1.0,
        "iron": 1.0,
        "calcium": 1.0,
        "vitamin_d": 1.0,
        "vitamin_b12": 1.0,
        "vitamin_c": 1.0,
        "fiber": 1.0
    },
    "boiled": {
        "calories": 1.0,
        "protein": 1.0,
        "fat": 0.95,  # Slight fat loss into boiling water for some items
        "carbs": 1.0,
        "iron": 0.80,  # 20% leaching of minerals into water
        "calcium": 0.80,
        "vitamin_d": 0.95,
        "vitamin_b12": 0.70,  # 30% loss of water-soluble B-vitamins
        "vitamin_c": 0.50,  # 50% thermal degradation and leaching of Vitamin C
        "fiber": 0.95
    },
    "steamed": {
        "calories": 1.0,
        "protein": 1.0,
        "fat": 1.0,
        "carbs": 1.0,
        "iron": 0.95,  # Minimal mineral leaching
        "calcium": 0.95,
        "vitamin_d": 1.0,
        "vitamin_b12": 0.90,  # B-vitamins are slightly more stable in steam
        "vitamin_c": 0.80,  # 20% degradation of Vitamin C
        "fiber": 1.0
    },
    "fried": {
        "calories": 1.10,  # 10% overall calorie increase due to fat absorption
        "protein": 1.0,
        "fat": 1.15,  # 15% fat absorption factor
        "carbs": 1.0,
        "iron": 0.90,  # Slight loss due to high heat
        "calcium": 0.90,
        "vitamin_d": 0.85,  # Vitamin D degrades slightly at high frying temps
        "vitamin_b12": 0.85,
        "vitamin_c": 0.40,  # High heat degrades Vitamin C significantly
        "fiber": 1.0
    }
}


def apply_retention(nutrient_name: str, value: float, method: str) -> float:
    """
    Applies the retention factor of a given cooking method to a nutrient value.
    """
    method = method.lower()
    if method not in RETENTION_FACTORS:
        raise ValueError(f"Unknown cooking method: '{method}'. Supported methods: raw, boiled, steamed, fried")
    
    factors = RETENTION_FACTORS[method]
    factor = factors.get(nutrient_name.lower(), 1.0)
    return value * factor
