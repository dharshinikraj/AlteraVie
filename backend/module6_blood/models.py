from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime
from database.db import Base

class BloodReport(Base):
    __tablename__ = "blood_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    
    # Blood biomarkers
    iron_level = Column(Float, nullable=True)        # Ferritin in ng/mL
    calcium_level = Column(Float, nullable=True)     # Calcium in mg/dL
    vitamin_d_level = Column(Float, nullable=True)   # 25-OH Vitamin D in ng/mL
    vitamin_b12_level = Column(Float, nullable=True) # Vitamin B12 in pg/mL
    
    created_at = Column(DateTime, default=datetime.utcnow)
