from fastapi import APIRouter, Query, HTTPException
from module10_live_data.client import live_food_recommendations, usda_search_foods
router=APIRouter(prefix="/live-data",tags=["Live nutrition data"])
@router.get("/foods/search")
def search_foods(q:str=Query(...,min_length=2)):
    try:return {"query":q,"foods":usda_search_foods(q,page_size=10),"source":"USDA FoodData Central"}
    except Exception as exc:raise HTTPException(status_code=503,detail=f"USDA FoodData Central is temporarily unavailable: {exc}")
@router.get("/foods/recommendations")
def recommend_foods(nutrient:str="iron",diet:str="vegetarian"):
    try:return {"nutrient":nutrient,"diet":diet,"foods":live_food_recommendations(nutrient,diet=diet,limit=8),"source":"USDA FoodData Central"}
    except Exception as exc:raise HTTPException(status_code=503,detail=f"USDA FoodData Central is temporarily unavailable: {exc}")
