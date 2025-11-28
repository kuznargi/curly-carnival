from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

from database import get_db, Project
from models import FileAnalysisResponse
from services.gemini_service import GeminiService
from utils.file_processor import FileProcessor
from config import settings

router = APIRouter(prefix="/api/files", tags=["Files"])
gemini_service = GeminiService()
file_processor = FileProcessor()

@router.post("/upload", response_model=FileAnalysisResponse)
async def upload_and_analyze_file(
    file: UploadFile = File(...),
    project_id: str = None,
    db: Session = Depends(get_db)
):
    """
    Загрузить и проанализировать файл (PDF, DOCX, XLSX)
    """
    # Проверить проект если указан
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
    
    # Читаем содержимое файла
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read file: {str(e)}"
        )
    
    # Проверка размера файла
    if not file_processor.validate_file_size(contents, settings.MAX_FILE_SIZE):
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    try:
        # Обработать файл
        extracted_text, file_type, metadata = file_processor.process_file(
            contents, file.filename or ""
        )
        
        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from the file"
            )
        
        # Проанализировать содержимое через Gemini
        analysis_result = await gemini_service.analyze_file(extracted_text)

        # Extract fields from Gemini analysis
        project_name = analysis_result.get("projectName", "Неизвестный проект")
        goals = analysis_result.get("goals", ["Анализ файла выполнен"])
        requirements = analysis_result.get("requirements", ["Требует дополнительной обработки"])
        stakeholders = analysis_result.get("stakeholders", ["Не определены"])
        description = analysis_result.get("description", "Анализ завершен успешно")
        
        # Convert to strings if they're objects
        if isinstance(goals, list) and len(goals) > 0 and isinstance(goals[0], dict):
            goals = [goal.get("text", str(goal)) for goal in goals]
        
        return FileAnalysisResponse(
            project_name=project_name,
            goals=goals if isinstance(goals, list) else [str(goals)],
            requirements=requirements if isinstance(requirements, list) else [str(requirements)],
            stakeholders=stakeholders if isinstance(stakeholders, list) else [str(stakeholders)],
            description=description,
            extracted_text_length=len(extracted_text),
            file_type=file_type
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"File processing failed: {str(e)}"
        )

@router.post("/extract-text")
async def extract_text_only(file: UploadFile = File(...)):
    """
    Просто извлечь текст из файла без AI анализа
    """
    # Читаем файл
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read file: {str(e)}"
        )
    
    # Проверка размера
    if not file_processor.validate_file_size(contents, settings.MAX_FILE_SIZE):
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    try:
        # Извлечь текст
        extracted_text, file_type, metadata = file_processor.process_file(
            contents, file.filename or ""
        )
        
        return {
            "filename": file.filename,
            "file_type": file_type,
            "extracted_text": extracted_text,
            "text_length": len(extracted_text),
            "metadata": metadata
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Text extraction failed: {str(e)}"
        )

@router.post("/analyze-requirements")
async def analyze_requirements_from_text(
    text_content: dict,  # {"text": "content to analyze"}
):
    """
    Проанализировать требования из предоставленного текста
    """
    try:
        text = text_content.get("text", "")
        
        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Text content is required"
            )
        
        # Ограничиваем размер текста
        if len(text) > 100000:  # 100k символов
            text = text[:100000] + "...[текст обрезан]"
        
        # Анализируем через Gemini
        analysis_result = await gemini_service.analyze_file(text)
        
        return {
            "analysis": analysis_result,
            "processed_text_length": len(text),
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Requirements analysis failed: {str(e)}"
        )

@router.get("/supported-formats")
async def get_supported_formats():
    """
    Получить список поддерживаемых форматов файлов
    """
    return {
        "supported_formats": [
            {
                "format": "PDF",
                "extensions": [".pdf"],
                "description": "Portable Document Format - извлечение текста со всех страниц",
                "max_size_mb": settings.MAX_FILE_SIZE // (1024*1024)
            },
            {
                "format": "DOCX",
                "extensions": [".docx"],
                "description": "Microsoft Word - текст из параграфов и таблиц",
                "max_size_mb": settings.MAX_FILE_SIZE // (1024*1024)
            },
            {
                "format": "XLSX",
                "extensions": [".xlsx"],
                "description": "Microsoft Excel - данные из всех листов",
                "max_size_mb": settings.MAX_FILE_SIZE // (1024*1024)
            }
        ],
        "limitations": [
            "Файлы должны содержать читаемый текст",
            "Изображения и диаграммы не обрабатываются",
            "Защищенные паролем файлы не поддерживаются",
            f"Максимальный размер файла: {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        ]
    }