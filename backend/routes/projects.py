from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from database import get_db, Project
from models import ProjectCreate, ProjectResponse

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.post("/create", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    """
    Создать новый проект
    """
    project = Project(
        id=str(uuid.uuid4()),
        name=project_data.name,
        type=project_data.type,
        priority=project_data.priority.value,
        description=project_data.description,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        type=project.type,
        priority=project.priority,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at
    )

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Получить информацию о проекте
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        type=project.type,
        priority=project.priority,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at
    )

@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Получить список всех проектов
    """
    projects = db.query(Project).order_by(
        Project.updated_at.desc()
    ).offset(skip).limit(limit).all()
    
    return [
        ProjectResponse(
            id=project.id,
            name=project.name,
            type=project.type,
            priority=project.priority,
            description=project.description,
            created_at=project.created_at,
            updated_at=project.updated_at
        )
        for project in projects
    ]

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    """
    Обновить проект
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Обновляем поля
    project.name = project_data.name
    project.type = project_data.type
    project.priority = project_data.priority.value
    project.description = project_data.description
    project.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(project)
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        type=project.type,
        priority=project.priority,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at
    )

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Удалить проект и всю связанную информацию
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Удаляем проект (каскадное удаление сообщений и документов происходит автоматически)
    db.delete(project)
    db.commit()
    
    return {
        "message": f"Project {project_id} deleted successfully"
    }