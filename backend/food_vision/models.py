from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime
from database.db import Base


class FoodLog(Base):
    __tablename__ = "food_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dish_name = Column(String, nullable=False)
    portion_multiplier = Column(Float, default=1.0)
    estimated_weight_g = Column(Float, nullable=True)
    calories = Column(Float, default=0.0)
    protein_g = Column(Float, default=0.0)
    fat_g = Column(Float, default=0.0)
    carbs_g = Column(Float, default=0.0)
    gi = Column(Float, nullable=True)
    gl = Column(Float, nullable=True)
    gl_category = Column(String, nullable=True)
    available_carbs_g = Column(Float, nullable=True)
    logged_at = Column(DateTime, default=datetime.utcnow)

