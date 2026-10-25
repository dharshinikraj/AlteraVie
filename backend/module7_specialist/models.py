from sqlalchemy import Column, Integer, String, Float
from database.db import Base

class Specialist(Base):
    __tablename__ = "specialists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    credentials = Column(String, nullable=False)
    specialties = Column(String, nullable=False)  # comma separated list of specialties
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
