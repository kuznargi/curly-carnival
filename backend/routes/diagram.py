from fastapi import APIRouter, HTTPException
from models import DiagramRequest, DiagramResponse, DiagramType
from services.gemini_service import GeminiService

router = APIRouter(prefix="/api/diagrams", tags=["Diagrams"])
gemini_service = GeminiService()

@router.post("/generate", response_model=DiagramResponse)
async def generate_diagram(request: DiagramRequest):
    """
    Сгенерировать Mermaid диаграмму на основе описания процесса
    """
    try:
        # Генерируем диаграмму через Gemini
        mermaid_code = await gemini_service.generate_diagram(
            description=request.description,
            diagram_type=request.diagram_type.value
        )
        
        return DiagramResponse(
            mermaid_code=mermaid_code,
            diagram_type=request.diagram_type.value
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Diagram generation failed: {str(e)}"
        )

@router.post("/generate-from-usecase")
async def generate_diagram_from_usecase(usecase: dict, diagram_type: DiagramType):
    """
    Сгенерировать диаграмму на основе use case
    """
    try:
        # Формируем описание из use case
        description = f"""
Название: {usecase.get('title', 'Неизвестный процесс')}
Актор: {usecase.get('actor', 'Пользователь')}
Предусловия: {'; '.join(usecase.get('preconditions', []))}
Основной сценарий: {'; '.join(usecase.get('mainScenario', []))}
Постусловия: {usecase.get('postconditions', '')}
"""
        
        # Генерируем диаграмму
        mermaid_code = await gemini_service.generate_diagram(
            description=description,
            diagram_type=diagram_type.value
        )
        
        return DiagramResponse(
            mermaid_code=mermaid_code,
            diagram_type=diagram_type.value
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Diagram generation from use case failed: {str(e)}"
        )

@router.post("/generate-process-flow")
async def generate_process_flow(business_rules: list):
    """
    Сгенерировать диаграмму бизнес-процесса на основе бизнес-правил
    """
    try:
        # Формируем описание из бизнес-правил
        rules_description = "\n".join([
            f"- {rule.get('title', '')}: {rule.get('description', '')}"
            for rule in business_rules
        ])
        
        description = f"""
Бизнес-процесс на основе следующих правил:
{rules_description}

Создайте flowchart, показывающий последовательность выполнения этих правил и принятия решений.
"""
        
        # Генерируем flowchart
        mermaid_code = await gemini_service.generate_diagram(
            description=description,
            diagram_type="flowchart"
        )
        
        return DiagramResponse(
            mermaid_code=mermaid_code,
            diagram_type="flowchart"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Process flow generation failed: {str(e)}"
        )

@router.get("/types")
async def get_diagram_types():
    """
    Получить список доступных типов диаграмм с описанием
    """
    return {
        "diagram_types": [
            {
                "type": "flowchart",
                "name": "Блок-схема",
                "description": "Диаграмма бизнес-процесса с условными переходами",
                "use_cases": ["Моделирование процессов", "Алгоритмы принятия решений"]
            },
            {
                "type": "sequenceDiagram",
                "name": "Диаграмма последовательности",
                "description": "Взаимодействие между участниками системы",
                "use_cases": ["API взаимодействия", "Пользовательские сценарии"]
            },
            {
                "type": "journey",
                "name": "Пользовательский путь",
                "description": "Эмоциональный опыт пользователя",
                "use_cases": ["UX анализ", "Customer journey mapping"]
            },
            {
                "type": "erDiagram",
                "name": "ER диаграмма",
                "description": "Структура данных и связи между сущностями",
                "use_cases": ["Проектирование БД", "Моделирование данных"]
            }
        ]
    }