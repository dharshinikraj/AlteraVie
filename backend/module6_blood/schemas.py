from pydantic import BaseModel
from datetime import datetime

class BloodReportManualInput(BaseModel):
    iron_level: float | None = None
    calcium_level: float | None = None
    vitamin_d_level: float | None = None
    vitamin_b12_level: float | None = None

class BloodReportResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    iron_level: float | None
    calcium_level: float | None
    vitamin_d_level: float | None
    vitamin_b12_level: float | None
    created_at: datetime

    class Config:
        from_attributes = True
