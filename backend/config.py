import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Gemini API
    GEMINI_API_KEY: str
    GEMINI_MODEL_FLASH: str = "gemini-1.5-flash"
    GEMINI_MODEL_PRO: str = "gemini-1.5-pro"
    GEMINI_TIMEOUT: int = 30
    GEMINI_MAX_RETRIES: int = 3
    
    # Database
    DATABASE_URL: str = "sqlite:///./database.db"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080", "*"]
    
    # File upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "docx", "xlsx"]
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 60  # requests per minute
    RATE_LIMIT_WINDOW: int = 60   # seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Debug mode
    DEBUG: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Validate critical settings
if not settings.GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")