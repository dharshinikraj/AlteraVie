"""
Pydantic schemas for Module 9 (RAG Chatbot).
"""
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., description="User question or text input")
    user_profile: dict | None = Field(default=None, description="Optional active user profile context")
    image_base64: str | None = Field(default=None, description="Optional base64 image string for food vision plate scan")
    conversation_history: list[dict] | None = Field(default_factory=list)


class CitationSource(BaseModel):
    title: str
    category: str
    citation: str
    snippet: str
    source_url: str | None = None


class ChatResponse(BaseModel):
    reply: str
    citations: list[CitationSource] = Field(default_factory=list)
    widget: dict | None = Field(default=None, description="Optional interactive React widget data: meal_card, blood_card, specialist_card")
    suggested_prompts: list[str] = Field(default_factory=list)
    is_emergency: bool = False
