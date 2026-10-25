"""Source-grounded RAG chatbot.
Retrieval is performed at request time from PubMed/NCBI and USDA FoodData Central.
The module deliberately avoids invented papers, foods, clinics, lab values, and recipes.
"""
from __future__ import annotations
import re
from module10_live_data.client import pubmed_retrieve, live_food_recommendations

MEDICAL_EMERGENCY_KEYWORDS = [
    "chest pain", "fainting", "passed out", "severe shortness of breath",
    "difficulty breathing", "unconscious", "severe bleeding", "suicidal"
]

NUTRIENT_ALIASES = {
    "iron": "iron", "ferritin": "iron", "anemia": "iron",
    "vitamin d": "vitamin d", "vit d": "vitamin d",
    "calcium": "calcium", "b12": "vitamin b12", "vitamin b12": "vitamin b12",
    "protein": "protein", "vitamin c": "vitamin c", "vit c": "vitamin c",
}


def _detect_nutrient(message: str) -> str | None:
    lower = message.lower()
    for alias, nutrient in NUTRIENT_ALIASES.items():
        if alias in lower:
            return nutrient
    if any(k in lower for k in ["food", "eat", "meal", "breakfast", "lunch", "dinner", "recipe"]):
        return "iron"
    return None


def _is_food_request(message: str) -> bool:
    return any(k in message.lower() for k in [
        "food", "eat", "meal", "breakfast", "lunch", "dinner", "snack",
        "recipe", "diet", "source of", "foods for", "recommend"
    ])


def _citations(docs: list[dict]) -> list[dict]:
    return [{
        "title": d.get("title") or d.get("name") or "Source",
        "category": d.get("category", d.get("source", "Retrieved source")),
        "citation": d.get("citation", d.get("source", "")),
        "snippet": (d.get("snippet") or "")[:220],
        "source_url": d.get("source_url"),
    } for d in docs]


def process_chat_rag_request(message: str, user_profile: dict | None = None,
                             image_base64: str | None = None,
                             conversation_history: list[dict] | None = None) -> dict:
    msg = message.strip()
    lower = msg.lower()
    profile = user_profile or {}
    diet = profile.get("diet", "vegetarian")

    if any(term in lower for term in MEDICAL_EMERGENCY_KEYWORDS):
        return {
            "reply": "Your message includes a symptom that can require urgent medical assessment. This nutrition assistant cannot safely evaluate an emergency. Please seek immediate in-person medical care or your local emergency service.",
            "citations": [], "widget": None,
            "suggested_prompts": ["Show nutrition questions I can safely ask"],
            "is_emergency": True,
        }

    if image_base64:
        return {
            "reply": "The chatbot no longer fabricates a dish identity from an uploaded image. Use the Food Vision module for image inference; its result can then be discussed here with source-grounded nutrition data.",
            "citations": [], "widget": None,
            "suggested_prompts": ["What nutrients are in the food I identified?"],
            "is_emergency": False,
        }

    literature_query = f"nutrition {msg}"
    try:
        papers = pubmed_retrieve(literature_query, top_k=4)
    except Exception:
        papers = []

    food_docs = []
    nutrient = _detect_nutrient(msg)
    if _is_food_request(msg) and nutrient:
        try:
            food_docs = live_food_recommendations(nutrient, diet=diet, limit=6)
        except Exception:
            food_docs = []

    parts = []
    if food_docs:
        parts.append(f"For **{nutrient.title()}**, I retrieved these current entries from USDA FoodData Central:")
        for f in food_docs[:5]:
            nutrients = f.get("nutrients", {})
            values = []
            for key in [nutrient, "protein", "iron", "calcium", "vitamin d", "vitamin b12"]:
                if key in nutrients and nutrients[key] is not None:
                    values.append(f"{key}: {nutrients[key]}")
            suffix = f" ({'; '.join(values[:3])})" if values else ""
            parts.append(f"• {f.get('name')}{suffix}")
        parts.append("Use the USDA record linked in Sources for the serving basis and full nutrient panel before comparing foods.")

    if papers:
        if parts:
            parts.append("\n**What the literature says:**")
        else:
            parts.append("I retrieved the following evidence from PubMed for your question:")
        for p in papers[:3]:
            snippet = p.get("snippet", "")
            # Keep answer extractive/grounded rather than inventing a clinical conclusion.
            sentence = re.split(r"(?<=[.!?])\s+", snippet)[0] if snippet else ""
            if sentence:
                parts.append(f"• **{p.get('title')}** — {sentence}")

    if not parts:
        parts.append("I could not retrieve a reliable live source for that request right now. I have not substituted a static or synthetic answer. Please retry with a specific nutrient, food, or nutrition question when the data services are reachable.")

    parts.append("\nThis is educational nutrition information, not a diagnosis or a substitute for a clinician or dietitian.")
    all_docs = papers + food_docs
    return {
        "reply": "\n".join(parts),
        "citations": _citations(all_docs),
        "widget": {"type": "live_food_results", "foods": food_docs[:6], "nutrient": nutrient} if food_docs else None,
        "suggested_prompts": [
            "Show live USDA foods high in iron",
            "Find PubMed evidence about vitamin D deficiency",
            "Show live foods high in calcium",
        ],
        "is_emergency": False,
    }
