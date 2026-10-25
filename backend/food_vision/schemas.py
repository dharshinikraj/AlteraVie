"""
Pydantic schemas for Food Vision API request and responses.
"""

from pydantic import BaseModel, Field


class NutrientTotals(BaseModel):
    calories: float = Field(..., description="Energy in kcal")
    protein: float = Field(..., description="Protein in grams (g)")
    fat: float = Field(..., description="Fat in grams (g)")
    carbs: float = Field(..., description="Carbohydrates in grams (g)")
    iron: float = Field(..., description="Iron in milligrams (mg)")
    calcium: float = Field(..., description="Calcium in milligrams (mg)")
    vitamin_d: float = Field(..., description="Vitamin D in micrograms (mcg)")
    vitamin_b12: float = Field(..., description="Vitamin B12 in micrograms (mcg)")
    vitamin_c: float = Field(..., description="Vitamin C in milligrams (mg)")
    fiber: float = Field(..., description="Dietary fiber in grams (g)")


class IngredientBreakdown(BaseModel):
    ingredient_name: str = Field(..., description="Name of the ingredient")
    raw_serving_grams: float = Field(..., description="Raw weight of ingredient in typical serving (g)")
    cooked_scaled_grams: float = Field(..., description="Cooked and scaled weight of ingredient in current serving (g)")
    cooking_method: str = Field(..., description="Cooking method applied")
    nutrients: NutrientTotals = Field(..., description="Nutrients contributed by this ingredient")


class PredictionResponse(BaseModel):
    predicted_dish: str = Field(..., description="Predicted dish name")
    confidence: float = Field(..., description="Classifier confidence score")
    portion_multiplier: float = Field(..., description="Portion multiplier applied")
    typical_serving_g: float = Field(..., description="Typical serving weight in grams (g)")
    estimated_total_weight_g: float = Field(..., description="Estimated total serving weight in grams (g)")
    total_nutrients: NutrientTotals = Field(..., description="Aggregated nutrients for the plate")
    gi: float | None = Field(None, description="Glycemic Index for the dish")
    gi_category: str | None = None
    available_carbs_g: float | None = None
    gl: float | None = Field(None, description="Portion-dependent Glycemic Load")
    gl_category: str | None = None
    ingredients_breakdown: list[IngredientBreakdown] = Field(..., description="Transparent breakdown of ingredient nutrition")
    disclaimer: str = Field(..., description="Disclaimer regarding estimated values")


class DishGlycemicInfo(BaseModel):
    """GI/GL summary for a single dish at its typical (1x) serving size."""
    dish_name: str = Field(..., description="Dish name")
    gi: float | None = Field(None, description="Glycemic Index for the dish, or None if unavailable")
    gi_category: str | None = Field(None, description="'Low' / 'Medium' / 'High', or None if GI unavailable")
    available_carbs_g: float | None = Field(None, description="Available (net) carbohydrates in grams at typical serving")
    gl: float | None = Field(None, description="Glycemic Load at typical (1x) serving")
    gl_category: str | None = Field(None, description="'Low' / 'Medium' / 'High', or None if GL unavailable")


class DishesListResponse(BaseModel):
    dishes: list[str] = Field(..., description="List of all supported dish names")
    count: int = Field(..., description="Number of supported dishes")
    dish_glycemic_info: list[DishGlycemicInfo] = Field(
        default_factory=list,
        description="Per-dish GI/GL and category, computed at typical (1x) serving size."
    )


class FoodLogCreate(BaseModel):
    dish_name: str = Field(..., description="Dish name")
    portion_multiplier: float = Field(1.0, description="Portion multiplier")
    estimated_weight_g: float | None = Field(None, description="Estimated total weight in grams")
    calories: float = Field(0.0, description="Calories in kcal")
    protein_g: float = Field(0.0, description="Protein in grams")
    fat_g: float = Field(0.0, description="Fat in grams")
    carbs_g: float = Field(0.0, description="Carbohydrates in grams")
    gi: float | None = Field(None, description="Glycemic Index")
    gl: float | None = Field(None, description="Portion-dependent Glycemic Load")
    available_carbs_g: float | None = Field(None, description="Available carbohydrate in grams")


class DailyNutritionSummary(BaseModel):
    """Aggregated nutrition (incl. GI/GL) for a user's food journal entries on a given day."""
    date: str = Field(..., description="Date (ISO format, YYYY-MM-DD) this summary covers")
    entry_count: int = Field(..., description="Number of food log entries included")
    total_calories: float = Field(..., description="Sum of calories across entries (kcal)")
    total_protein_g: float = Field(..., description="Sum of protein across entries (g)")
    total_fat_g: float = Field(..., description="Sum of fat across entries (g)")
    total_carbs_g: float = Field(..., description="Sum of carbohydrates across entries (g)")
    average_gi: float | None = Field(None, description="Average Glycemic Index across entries with known GI")
    average_gi_category: str | None = Field(None, description="'Low' / 'Medium' / 'High' for average GI")
    total_gl: float | None = Field(None, description="Sum of Glycemic Load across entries with known GL")
    total_gl_category: str | None = Field(None, description="'Low' / 'Medium' / 'High' for total GL")
    entries_missing_gi: int = Field(0, description="Number of entries where GI data was unavailable")


class FoodLogResponse(BaseModel):
    id: int
    user_id: int
    dish_name: str
    portion_multiplier: float
    estimated_weight_g: float | None
    calories: float
    protein_g: float
    fat_g: float
    carbs_g: float
    gi: float | None = None
    gl: float | None = None
    gl_category: str | None = None
    available_carbs_g: float | None = None
    logged_at: str

    class Config:
        from_attributes = True
