"""
Module 3 — Nutrient Interaction Rules.

Encodes well-established positive (synergistic) and negative (antagonistic)
nutrient interactions as a rule-based lookup, no ML involved.
"""
from dataclasses import dataclass


@dataclass
class InteractionRule:
    type: str  # "positive" | "negative"
    factors: list[str]
    description: str
    advice: str


INTERACTION_RULES: list[InteractionRule] = [
    InteractionRule(
        type="positive",
        factors=["iron", "vitamin_c"],
        description="Vitamin C converts non-heme iron into a more absorbable form, "
                     "significantly increasing iron uptake in the gut.",
        advice="Pair iron-rich foods (lentils, spinach) with a vitamin C source "
               "(lemon, orange, amla) in the same meal.",
    ),
    InteractionRule(
        type="positive",
        factors=["calcium", "vitamin_d"],
        description="Vitamin D enables active transport of calcium across the "
                     "intestinal wall; without it, calcium absorption drops sharply.",
        advice="Combine calcium-rich foods (dairy, tofu) with a vitamin D source "
               "(sunlight exposure, fortified milk, eggs) regularly.",
    ),
    InteractionRule(
        type="negative",
        factors=["tea", "iron"],
        description="Tannins in tea bind non-heme iron and inhibit its absorption "
                     "by up to 60-70% when consumed with or right after a meal.",
        advice="Avoid tea within 1 hour before or after iron-rich meals.",
    ),
    InteractionRule(
        type="negative",
        factors=["coffee", "calcium"],
        description="Caffeine mildly increases urinary and fecal calcium excretion, "
                     "reducing net calcium retention.",
        advice="Space coffee consumption at least 1-2 hours apart from calcium-rich meals or supplements.",
    ),
    InteractionRule(
        type="negative",
        factors=["phytates", "iron", "zinc"],
        description="Phytates in raw whole grains and legumes can bind minerals "
                     "like iron and zinc, reducing their bioavailability.",
        advice="Soak, sprout, or ferment grains/legumes before cooking to reduce phytate content.",
    ),
    InteractionRule(
        type="positive",
        factors=["fat", "vitamin_d"],
        description="Vitamin D is fat-soluble and is absorbed more efficiently "
                     "when consumed alongside dietary fat.",
        advice="Eat vitamin D-rich foods with a source of healthy fat (nuts, dairy, oily fish).",
    ),
]


def get_relevant_interactions(nutrient_focus: list[str]) -> list[InteractionRule]:
    """
    Return interaction rules relevant to any of the nutrients in
    `nutrient_focus` (case-insensitive match against rule factors).
    """
    focus_lower = {n.lower().replace(" ", "_") for n in nutrient_focus}
    return [
        rule for rule in INTERACTION_RULES
        if focus_lower.intersection(set(rule.factors))
    ]
