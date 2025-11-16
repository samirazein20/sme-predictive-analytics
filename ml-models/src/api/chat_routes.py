"""
Chat API routes for document Q&A
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from src.services.document_qa_service import DocumentQAService

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Initialize the Q&A service
qa_service = DocumentQAService()


class DocumentContextRequest(BaseModel):
    """Request model for analyzing document context"""
    csv_data: str
    file_metadata: Dict[str, Any]


class DocumentContextResponse(BaseModel):
    """Response model for document context"""
    context: Dict[str, Any]
    success: bool
    message: str


class QuestionRequest(BaseModel):
    """Request model for asking a question"""
    question: str
    document_context: Dict[str, Any]
    conversation_history: Optional[List[Dict[str, str]]] = None


class AnswerResponse(BaseModel):
    """Response model for question answer"""
    answer: str
    referenced_data: Dict[str, Any]
    confidence: str
    suggestions: List[str]
    success: bool


@router.post("/analyze-document", response_model=DocumentContextResponse)
async def analyze_document(request: DocumentContextRequest):
    """
    Analyze a document and create context for Q&A

    This endpoint processes uploaded CSV data and generates comprehensive
    context including statistics, summaries, and metadata that will be used
    for answering questions.
    """
    try:
        context = qa_service.analyze_document_context(
            csv_data=request.csv_data,
            file_metadata=request.file_metadata
        )

        return DocumentContextResponse(
            context=context,
            success=True,
            message="Document analyzed successfully"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing document: {str(e)}"
        )


@router.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    """
    Answer a question about an uploaded document

    This endpoint uses AI reasoning to answer questions about the data
    in the context of previously uploaded documents. It supports
    conversation history for context-aware responses.
    """
    try:
        if not request.question or request.question.strip() == "":
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty"
            )

        result = qa_service.answer_question(
            question=request.question,
            document_context=request.document_context,
            conversation_history=request.conversation_history
        )

        return AnswerResponse(
            answer=result["answer"],
            referenced_data=result.get("referenced_data", {}),
            confidence=result.get("confidence", "medium"),
            suggestions=result.get("suggestions", []),
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error answering question: {str(e)}"
        )


@router.get("/health")
async def chat_health_check():
    """Health check endpoint for chat service"""
    return {
        "status": "healthy",
        "service": "document-qa",
        "model": qa_service.model_name,
        "ollama_url": qa_service.ollama_url
    }
