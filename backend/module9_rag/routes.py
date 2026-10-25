"""
Module 9 — RAG Chatbot API Routes.

Exposes:
    POST /chat               -> Main personalized RAG chatbot endpoint
    GET  /chat/suggestions   -> Quick starter prompt chips
"""
from fastapi import APIRouter, HTTPException
from module9_rag.schemas import ChatRequest, ChatResponse
from module9_rag.engine import process_chat_rag_request

router = APIRouter(prefix="/chat", tags=["Module 9 - RAG Chatbot Companion"])


@router.post("", response_model=ChatResponse)
def handle_chat_message(payload: ChatRequest):
    try:
        response_dict = process_chat_rag_request(
            message=payload.message,
            user_profile=payload.user_profile,
            image_base64=payload.image_base64,
            conversation_history=payload.conversation_history
        )
        return ChatResponse(**response_dict)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"RAG Chatbot processing error: {str(exc)}"
        )


@router.get("/suggestions")
def get_chat_suggestions():
    return {
        "suggestions": [
            "Show live USDA foods high in iron",
            "Find PubMed evidence about vitamin D deficiency",
            "Show vegetarian foods high in vitamin B12",
            "Show live foods high in calcium",
            "What does research say about iron deficiency and fatigue?"
        ]
    }
