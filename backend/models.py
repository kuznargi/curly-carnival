from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class DiagramType(str, Enum):
    FLOWCHART = "flowchart"
    SEQUENCE = "sequenceDiagram"
    JOURNEY = "journey"
    ER = "erDiagram"

class Severity(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

# Chat models
class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    project_id: str = Field(..., description="Project ID")
    message: str = Field(..., description="User message")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Chat history")

class ChatResponse(BaseModel):
    message: str = Field(..., description="AI response")
    message_id: str = Field(..., description="Message ID")
    timestamp: datetime = Field(..., description="Response timestamp")
    tokens_used: Optional[int] = None

# Project models
class ProjectCreate(BaseModel):
    name: str = Field(..., description="Project name")
    type: Optional[str] = Field(None, description="Project type")
    priority: Priority = Field(default=Priority.MEDIUM, description="Project priority")
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    type: Optional[str]
    priority: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

# Document models
class Goal(BaseModel):
    text: str
    priority: Priority

class BusinessRule(BaseModel):
    id: str
    title: str
    description: str
    priority: Priority

class UseCase(BaseModel):
    id: str
    title: str
    actor: str
    preconditions: List[str]
    mainScenario: List[str]
    postconditions: str

class KPI(BaseModel):
    name: str
    current: float
    target: float
    unit: str

class DocumentContent(BaseModel):
    projectName: str
    description: Dict[str, List[str]]  # {"paragraphs": ["text1", "text2"]}
    goals: List[Goal]
    scope: Dict[str, List[str]]  # {"inScope": [...], "outOfScope": [...]}
    businessRules: List[BusinessRule]
    useCases: List[UseCase]
    kpis: List[KPI]

class DocumentGenerateRequest(BaseModel):
    project_id: str

class DocumentGenerateResponse(BaseModel):
    document: DocumentContent
    quality_score: Optional[int] = None
    created_at: datetime
    document_id: str

# Validation models
class QualityScore(BaseModel):
    health: int = Field(..., ge=0, le=100)
    completeness: int = Field(..., ge=0, le=100)
    clarity: int = Field(..., ge=0, le=100)
    detail: int = Field(..., ge=0, le=100)
    consistency: int = Field(..., ge=0, le=100)

class ValidationIssue(BaseModel):
    text: str
    severity: Severity
    section: str
    fixable: bool

class ValidationRequest(BaseModel):
    document: DocumentContent

class ValidationResponse(BaseModel):
    qualityScore: QualityScore
    issues: List[ValidationIssue]

# Diagram models
class DiagramRequest(BaseModel):
    description: str = Field(..., description="Process description")
    diagram_type: DiagramType = Field(..., description="Type of diagram")

class DiagramResponse(BaseModel):
    mermaid_code: str = Field(..., description="Generated Mermaid code")
    diagram_type: str

# File models
class FileAnalysisResponse(BaseModel):
    project_name: str
    goals: List[str]
    requirements: List[str]
    stakeholders: List[str]
    description: str
    extracted_text_length: int
    file_type: str

# Section improvement models
class SectionImprovementRequest(BaseModel):
    section_text: str = Field(..., description="Text of the section to improve")
    issue_description: str = Field(..., description="Description of the issue")

class SectionImprovementResponse(BaseModel):
    improved_text: str = Field(..., description="Improved section text")
    changes_made: List[str] = Field(..., description="List of changes made")

# Chat history models
class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessage]
    total: int
    project_id: str