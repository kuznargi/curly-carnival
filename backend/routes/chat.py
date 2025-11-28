from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import uuid
from datetime import datetime

from database import get_db, Message, Project
from models import ChatRequest, ChatResponse, ChatMessage, ChatHistoryResponse
from services.gemini_service import GeminiService

router = APIRouter(prefix="/api/chat", tags=["Chat"])
gemini_service = GeminiService()

@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Отправить сообщение в чат и получить ответ от AI
    """
    # Проверить существование проекта
    project = db.query(Project).filter(
        Project.id == request.project_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Сохранить сообщение пользователя
    user_message = Message(
        id=str(uuid.uuid4()),
        project_id=request.project_id,
        role="user",
        content=request.message,
        timestamp=datetime.utcnow()
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    try:
        # Подготовить контекст из истории
        context = []
        if request.history:
            context = [
                {"role": msg.role, "content": msg.content} 
                for msg in request.history
            ]
        
        # Вызвать Gemini
        ai_response = await gemini_service.chat_completion(
            prompt=request.message,
            context=context,
            temperature=0.7
        )
        
        # Сохранить ответ AI
        ai_message = Message(
            id=str(uuid.uuid4()),
            project_id=request.project_id,
            role="assistant",
            content=ai_response,
            timestamp=datetime.utcnow()
        )
        db.add(ai_message)
        db.commit()
        db.refresh(ai_message)
        
        return ChatResponse(
            message=ai_response,
            message_id=ai_message.id,
            timestamp=ai_message.timestamp
        )
        
    except Exception as e:
        # Откатить транзакцию если произошла ошибка после сохранения пользовательского сообщения
        db.rollback()
        # Удалить пользовательское сообщение при ошибке
        db.delete(user_message)
        db.commit()
        
        raise HTTPException(
            status_code=503,
            detail=f"AI service unavailable: {str(e)}"
        )

@router.get("/history/{project_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    project_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Получить историю чата для проекта
    """
    # Проверить существование проекта
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Получить сообщения
    messages_query = db.query(Message).filter(
        Message.project_id == project_id,
        Message.deleted == False
    ).order_by(Message.timestamp)
    
    total = messages_query.count()
    messages = messages_query.offset(skip).limit(limit).all()
    
    chat_messages = [
        ChatMessage(
            role=msg.role,
            content=msg.content,
            timestamp=msg.timestamp
        )
        for msg in messages
    ]
    
    return ChatHistoryResponse(
        messages=chat_messages,
        total=total,
        project_id=project_id
    )

@router.delete("/clear/{project_id}")
async def clear_chat_history(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Очистить историю чата (soft delete)
    """
    # Проверить существование проекта
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Пометить все сообщения как удаленные
    deleted_count = db.query(Message).filter(
        Message.project_id == project_id
    ).update({"deleted": True})
    
    db.commit()
    
    return {
        "message": f"Chat history cleared for project {project_id}",
        "deleted_messages": deleted_count
    }