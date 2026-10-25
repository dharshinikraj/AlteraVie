"""Schemas for Module 11 - Pantry Chef (cook with the ingredients you have)."""
from pydantic import BaseModel, Field


class PantryRequest(BaseModel):
    ingredients: list[str] = Field(..., min_length=1, max_length=25,
                                   description="Ingredients the user has at home")
    diet: str = Field(default="vegetarian", description="vegetarian | non-vegetarian | vegan")
    allergies: list[str] = Field(default_factory=list)
    disliked_foods: list[str] = Field(default_factory=list)
    focus_nutrients: list[str] = Field(default_factory=list,
                                       description="Deficiency nutrients to prioritise, e.g. ['Iron','Vitamin D']")
    limit: int = Field(default=8, ge=1, le=15)


class PantryResponse(BaseModel):
    ingredients_used: list[str]
    ingredients_excluded: list[dict] = Field(default_factory=list)
    focus_nutrients: list[str] = Field(default_factory=list)
    ingredient_insights: list[dict] = Field(default_factory=list)
    pairing_tips: list[str] = Field(default_factory=list)
    recipes: list[dict] = Field(default_factory=list)
    recipes_available: bool = True
    notes: list[str] = Field(default_factory=list)
