from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json
import uuid
from datetime import datetime

from database import get_db, Project, Message, Document
from models import DocumentGenerateRequest, DocumentGenerateResponse, SectionImprovementRequest, SectionImprovementResponse
from services.gemini_service import GeminiService

router = APIRouter(prefix="/api/documents", tags=["Documents"])
gemini_service = GeminiService()

@router.post("/generate", response_model=DocumentGenerateResponse)
async def generate_document(
    request: DocumentGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Сгенерировать полный документ бизнес-требований на основе истории чата
    """
    # Проверить существование проекта
    project = db.query(Project).filter(
        Project.id == request.project_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Получить историю чата
    messages = db.query(Message).filter(
        Message.project_id == request.project_id,
        Message.deleted == False
    ).order_by(Message.timestamp).all()
    
    if not messages:
        raise HTTPException(
            status_code=400, 
            detail="No chat history found. Start a conversation first."
        )
    
    # Подготовить историю для Gemini
    chat_history = [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]
    
    try:
        # Генерировать документ через Gemini
        document_content = await gemini_service.generate_document(chat_history)
        
        # Вычислить базовую оценку качества
        quality_score = await gemini_service.validate_document(document_content)
        
        # Сохранить документ в БД
        document_record = Document(
            id=str(uuid.uuid4()),
            project_id=request.project_id,
            content_json=json.dumps(document_content, ensure_ascii=False),
            quality_score=quality_score.get("qualityScore", {}).get("health", 75),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version=1
        )
        
        db.add(document_record)
        db.commit()
        db.refresh(document_record)
        
        return DocumentGenerateResponse(
            document=document_content,
            quality_score=document_record.quality_score,
            created_at=document_record.created_at,
            document_id=document_record.id
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Document generation failed: {str(e)}"
        )

@router.get("/{document_id}")
async def get_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    Получить документ по ID
    """
    document = db.query(Document).filter(
        Document.id == document_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        document_content = json.loads(document.content_json)
        
        return {
            "document_id": document.id,
            "project_id": document.project_id,
            "content": document_content,
            "quality_score": document.quality_score,
            "version": document.version,
            "created_at": document.created_at,
            "updated_at": document.updated_at
        }
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Document content is corrupted"
        )

@router.get("/project/{project_id}")
async def get_project_documents(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Получить все документы проекта
    """
    # Проверить существование проекта
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    documents = db.query(Document).filter(
        Document.project_id == project_id
    ).order_by(Document.created_at.desc()).all()
    
    result = []
    for doc in documents:
        try:
            content = json.loads(doc.content_json)
            result.append({
                "document_id": doc.id,
                "project_name": content.get("projectName", "Unknown"),
                "quality_score": doc.quality_score,
                "version": doc.version,
                "created_at": doc.created_at,
                "updated_at": doc.updated_at
            })
        except json.JSONDecodeError:
            continue
    
    return {
        "project_id": project_id,
        "documents": result
    }

@router.post("/improve-section", response_model=SectionImprovementResponse)
async def improve_section(
    request: SectionImprovementRequest,
    db: Session = Depends(get_db)
):
    """
    Улучшить секцию документа на основе выявленной проблемы
    """
    try:
        # Улучшить секцию через Gemini
        improved_text = await gemini_service.improve_section(
            section_text=request.section_text,
            issue_description=request.issue_description
        )
        
        # Определить основные изменения (простая эвристика)
        changes_made = []
        
        if len(improved_text) > len(request.section_text) * 1.2:
            changes_made.append("Добавлены детали и пояснения")
        
        if "требование" in improved_text.lower() and "требование" not in request.section_text.lower():
            changes_made.append("Добавлены конкретные требования")
        
        if improved_text != request.section_text:
            changes_made.append("Улучшена ясность формулировок")
        
        if not changes_made:
            changes_made = ["Минорные улучшения текста"]
        
        return SectionImprovementResponse(
            improved_text=improved_text,
            changes_made=changes_made
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Section improvement failed: {str(e)}"
        )

@router.put("/{document_id}")
async def update_document(
    document_id: str,
    document_content: dict,
    db: Session = Depends(get_db)
):
    """
    Обновить документ
    """
    document = db.query(Document).filter(
        Document.id == document_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Обновить документ
        document.content_json = json.dumps(document_content, ensure_ascii=False)
        document.updated_at = datetime.utcnow()
        document.version += 1
        
        db.commit()
        db.refresh(document)
        
        return {
            "message": "Document updated successfully",
            "document_id": document.id,
            "version": document.version,
            "updated_at": document.updated_at
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Document update failed: {str(e)}"
        )