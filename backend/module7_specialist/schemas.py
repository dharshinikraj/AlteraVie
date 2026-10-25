from pydantic import BaseModel

class SpecialistResponse(BaseModel):
    id: int
    name: str
    credentials: str
    specialties: str
    latitude: float
    longitude: float
    phone: str | None = None
    email: str | None = None
    distance_miles: float | None = None

    class Config:
        from_attributes = True
