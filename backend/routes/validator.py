from fastapi import APIRouter, HTTPException
from models import ValidationRequest, ValidationResponse
from services.gemini_service import GeminiService

router = APIRouter(prefix="/api/validator", tags=["Validation"])
gemini_service = GeminiService()

@router.post("/analyze", response_model=ValidationResponse)
async def analyze_document_quality(request: ValidationRequest):
    """
    Проанализировать качество документа бизнес-требований
    """
    try:
        # Конвертируем Pydantic модель в словарь
        document_dict = request.document.dict()
        
        # Анализируем через Gemini
        validation_result = await gemini_service.validate_document(document_dict)
        
        # Преобразуем результат в нужный формат
        from models import QualityScore, ValidationIssue
        
        quality_score = QualityScore(**validation_result["qualityScore"])
        issues = [ValidationIssue(**issue) for issue in validation_result["issues"]]
        
        return ValidationResponse(
            qualityScore=quality_score,
            issues=issues
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Document validation failed: {str(e)}"
        )

@router.post("/quick-check")
async def quick_quality_check(document_section: dict):
    """
    Быстрая проверка качества отдельной секции документа
    """
    try:
        # Создаем минимальный документ для анализа
        minimal_doc = {
            "projectName": "Quick Check",
            "description": {"paragraphs": [document_section.get("content", "")]},
            "goals": [],
            "scope": {"inScope": [], "outOfScope": []},
            "businessRules": [],
            "useCases": [],
            "kpis": []
        }
        
        # Анализируем
        validation_result = await gemini_service.validate_document(minimal_doc)
        
        # Возвращаем только общую оценку и критичные проблемы
        critical_issues = [
            issue for issue in validation_result["issues"] 
            if issue["severity"] == "high"
        ]
        
        return {
            "overall_score": validation_result["qualityScore"]["health"],
            "clarity_score": validation_result["qualityScore"]["clarity"],
            "critical_issues": critical_issues,
            "recommendations": [
                "Добавьте больше деталей" if validation_result["qualityScore"]["detail"] < 60 else None,
                "Уточните формулировки" if validation_result["qualityScore"]["clarity"] < 70 else None,
                "Проверьте полноту информации" if validation_result["qualityScore"]["completeness"] < 70 else None
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Quick quality check failed: {str(e)}"
        )