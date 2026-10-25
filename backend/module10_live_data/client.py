"""Live, source-backed nutrition and literature retrieval.
No synthetic food, clinic, or literature records are generated here.
"""
from __future__ import annotations
import json, os, re, urllib.parse, urllib.request
from xml.etree import ElementTree as ET

USER_AGENT = "AlteraVie-NutriAssess/2.0 (educational nutrition application)"
USDA_API_KEY = os.getenv("USDA_FDC_API_KEY", "DEMO_KEY")

NUTRIENT_IDS = {
    "calories": {1008},
    "protein": {1003},
    "fat": {1004},
    "carbs": {1005},
    "iron": {1089},
    "calcium": {1087},
    "vitamin d": {1114},
    "vitamin b12": {1178},
    "vitamin c": {1162},
    "fiber": {1079},
}

FOOD_QUERY_BY_NUTRIENT = {
    "iron": ["lentils", "spinach", "chickpeas", "pumpkin seeds", "tofu"],
    "vitamin d": ["salmon", "sardines", "fortified milk", "mushrooms"],
    "calcium": ["milk", "yogurt", "tofu", "sesame seeds", "sardines"],
    "vitamin b12": ["salmon", "eggs", "milk", "yogurt", "sardines"],
    "protein": ["lentils", "chickpeas", "tofu", "eggs", "chicken breast"],
    "vitamin c": ["orange", "guava", "bell pepper", "broccoli"],
}


def _json_get(url: str, timeout: int = 12) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def usda_search_foods(query: str, page_size: int = 8) -> list[dict]:
    params = urllib.parse.urlencode({"api_key": USDA_API_KEY, "query": query, "pageSize": page_size})
    data = _json_get(f"https://api.nal.usda.gov/fdc/v1/foods/search?{params}")
    out = []
    for food in data.get("foods", []):
        nutrients = {}
        for n in food.get("foodNutrients", []):
            nid = n.get("nutrientId")
            for label, ids in NUTRIENT_IDS.items():
                if nid in ids:
                    nutrients[label] = n.get("value")
        out.append({
            "fdc_id": food.get("fdcId"),
            "name": food.get("description"),
            "brand": food.get("brandOwner") or food.get("brandName"),
            "data_type": food.get("dataType"),
            "nutrients": nutrients,
            "source": "USDA FoodData Central",
            "source_url": f"https://fdc.nal.usda.gov/fdc-app.html#/food-details/{food.get('fdcId')}/nutrients" if food.get("fdcId") else "https://fdc.nal.usda.gov/",
        })
    return out


def live_food_recommendations(nutrient: str, diet: str = "vegetarian", limit: int = 6) -> list[dict]:
    key = nutrient.strip().lower()
    queries = FOOD_QUERY_BY_NUTRIENT.get(key, [nutrient])
    excluded = []
    if diet.lower() in {"vegetarian", "vegan"}:
        excluded = ["salmon", "sardine", "chicken", "beef", "egg"] if diet.lower() == "vegan" else ["salmon", "sardine", "chicken", "beef"]
    results = []
    seen = set()
    seen_queries = set()
    for q in queries:
        if any(x in q.lower() for x in excluded):
            continue
        try:
            foods = usda_search_foods(q, 4)
        except Exception:
            continue
        for f in foods:
            name = (f.get("name") or "").lower()
            if any(x in name for x in excluded):
                continue
            if f.get("fdc_id") in seen:
                continue
            if q in seen_queries:
                continue
            seen.add(f.get("fdc_id"))
            seen_queries.add(q)
            results.append(f)
            if len(results) >= limit:
                return results
    return results


def pubmed_retrieve(query: str, top_k: int = 4) -> list[dict]:
    """Retrieve current PubMed records via NCBI E-utilities."""
    term = urllib.parse.quote_plus(query)
    search = _json_get(
        f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax={top_k}&sort=relevance&term={term}"
    )
    ids = search.get("esearchresult", {}).get("idlist", [])
    if not ids:
        return []
    id_csv = ",".join(ids)
    req = urllib.request.Request(
        f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id={id_csv}",
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        root = ET.fromstring(r.read())
    out = []
    for article in root.findall(".//PubmedArticle"):
        pmid = article.findtext(".//PMID") or ""
        title_el = article.find(".//ArticleTitle")
        title = "".join(title_el.itertext()).strip() if title_el is not None else "PubMed article"
        abstract = " ".join("".join(x.itertext()).strip() for x in article.findall(".//Abstract/AbstractText"))
        journal = article.findtext(".//Journal/Title") or "PubMed"
        year = article.findtext(".//PubDate/Year") or article.findtext(".//PubDate/MedlineDate") or ""
        if abstract:
            out.append({
                "title": re.sub(r"\s+", " ", title),
                "snippet": re.sub(r"\s+", " ", abstract)[:700],
                "citation": f"{journal} {year}".strip(),
                "category": "Peer-reviewed literature",
                "source": "PubMed / NCBI",
                "source_url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else "https://pubmed.ncbi.nlm.nih.gov/",
            })
    return out
