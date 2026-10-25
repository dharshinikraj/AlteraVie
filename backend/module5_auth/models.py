from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    salt = Column(String, nullable=False)
    session_token = Column(String, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
