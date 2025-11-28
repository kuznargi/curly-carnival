// API Service для взаимодействия с Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Type definitions
export interface ChatMessageRequest {
  project_id: string;
  message: string;
  history: ChatMessage[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatMessageResponse {
  message: string;
  message_id: string;
  timestamp: string;
  tokens_used?: number;
}

export interface ProjectCreateRequest {
  name: string;
  type?: string;
  priority?: 'high' | 'medium' | 'low';
  description?: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  type?: string;
  priority: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentGenerateRequest {
  project_id: string;
}

export interface Goal {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

export interface BusinessRule {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface UseCase {
  id: string;
  title: string;
  actor: string;
  preconditions: string[];
  mainScenario: string[];
  postconditions: string;
}

export interface KPI {
  name: string;
  current: number;
  target: number;
  unit: string;
}

export interface DocumentContent {
  projectName: string;
  description: { paragraphs: string[] };
  goals: Goal[];
  scope: { inScope: string[]; outOfScope: string[] };
  businessRules: BusinessRule[];
  useCases: UseCase[];
  kpis: KPI[];
  diagrams?: {
    bpmn?: string;
    sequence?: string;
    journey?: string;
  };
}

export interface DocumentGenerateResponse {
  document: DocumentContent;
  quality_score?: number;
  created_at: string;
  document_id: string;
}

export interface QualityScore {
  health: number;
  completeness: number;
  clarity: number;
  detail: number;
  consistency: number;
}

export interface ValidationIssue {
  text: string;
  severity: 'high' | 'medium' | 'low';
  section: string;
  fixable: boolean;
}

export interface ValidationResponse {
  qualityScore: QualityScore;
  issues: ValidationIssue[];
}

export interface DiagramGenerateRequest {
  description: string;
  diagram_type: 'flowchart' | 'sequenceDiagram' | 'journey' | 'erDiagram';
}

export interface DiagramGenerateResponse {
  mermaid_code: string;
  diagram_type: string;
}

export interface FileAnalysisResponse {
  project_name: string;
  goals: string[];
  requirements: string[];
  stakeholders: string[];
  description: string;
  extracted_text_length: number;
  file_type: string;
}

export interface SectionImprovementRequest {
  section_text: string;
  issue_description: string;
}

export interface SectionImprovementResponse {
  improved_text: string;
  changes_made: string[];
}

// API Error class
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'Ошибка сервера';
    let errorDetails = null;
    
    try {
      const errorData = await response.json();
      console.log('Error data from server:', errorData);
      console.log('Full error details:', JSON.stringify(errorData, null, 2));
      
      if (Array.isArray(errorData.detail)) {
        const details = errorData.detail.map(err => `${err.loc?.join('.')} - ${err.msg}`).join('; ');
        errorMessage = `Validation error: ${details}`;
      } else {
        errorMessage = errorData.detail || errorData.message || errorMessage;
      }
      errorDetails = errorData;
    } catch (parseError) {
      console.log('Could not parse error JSON:', parseError);
      // Если не удается распарсить JSON, используем статус код
      switch (response.status) {
        case 400:
          errorMessage = 'Неверный запрос';
          break;
        case 401:
          errorMessage = 'Не авторизован';
          break;
        case 404:
          errorMessage = 'Ресурс не найден';
          break;
        case 422:
          errorMessage = 'Ошибка обработки данных на сервере';
          break;
        case 429:
          errorMessage = 'Слишком много запросов. Попробуйте позже';
          break;
        case 503:
          errorMessage = 'AI сервис недоступен';
          break;
        default:
          errorMessage = `Ошибка сервера: ${response.status}`;
      }
    }
    
    console.error(`API Error ${response.status}:`, errorMessage, errorDetails);
    throw new ApiError(errorMessage, response.status);
  }
  
  return response.json();
}

// Helper function to make API requests
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new ApiError('Сервер недоступен. Проверьте подключение к интернету', 0);
    }
    
    throw new ApiError(`Неизвестная ошибка: ${error}`, 0);
  }
}

// API Service class
export class ApiService {
  
  // Health check
  static async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    return makeRequest('/health');
  }
  
  // CHAT ENDPOINTS
  static async sendChatMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    return makeRequest('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
  
  static async getChatHistory(
    projectId: string, 
    skip = 0, 
    limit = 100
  ): Promise<{
    messages: ChatMessage[];
    total: number;
    project_id: string;
  }> {
    return makeRequest(`/api/chat/history/${projectId}?skip=${skip}&limit=${limit}`);
  }
  
  static async clearChatHistory(projectId: string): Promise<{ message: string; deleted_messages: number }> {
    return makeRequest(`/api/chat/clear/${projectId}`, {
      method: 'DELETE',
    });
  }
  
  // PROJECT ENDPOINTS
  static async createProject(request: ProjectCreateRequest): Promise<ProjectResponse> {
    return makeRequest('/api/projects/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
  
  static async getProject(projectId: string): Promise<ProjectResponse> {
    return makeRequest(`/api/projects/${projectId}`);
  }
  
  static async getAllProjects(skip = 0, limit = 20): Promise<ProjectResponse[]> {
    return makeRequest(`/api/projects/?skip=${skip}&limit=${limit}`);
  }
  
  // DOCUMENT ENDPOINTS
  static async generateDocument(request: DocumentGenerateRequest): Promise<DocumentGenerateResponse> {
    return makeRequest('/api/documents/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
  
  static async getDocument(documentId: string): Promise<{
    document_id: string;
    project_id: string;
    content: DocumentContent;
    quality_score: number;
    version: number;
    created_at: string;
    updated_at: string;
  }> {
    return makeRequest(`/api/documents/${documentId}`);
  }
  
  static async improveSection(request: SectionImprovementRequest): Promise<SectionImprovementResponse> {
    return makeRequest('/api/documents/improve-section', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  static async updateDocument(documentId: string, content: DocumentContent): Promise<{
    message: string;
    document_id: string;
    version: number;
    updated_at: string;
  }> {
    return makeRequest(`/api/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(content),
    });
  }
  
  // VALIDATOR ENDPOINTS
  static async analyzeDocument(document: DocumentContent): Promise<ValidationResponse> {
    return makeRequest('/api/validator/analyze', {
      method: 'POST',
      body: JSON.stringify({ document }),
    });
  }
  
  // DIAGRAM ENDPOINTS
  static async generateDiagram(request: DiagramGenerateRequest): Promise<DiagramGenerateResponse> {
    return makeRequest('/api/diagrams/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
  
  // FILE ENDPOINTS
  static async uploadFile(file: File, projectId?: string): Promise<FileAnalysisResponse> {
    console.log('Creating FormData for file:', file.name, 'size:', file.size, 'type:', file.type);
    
    const formData = new FormData();
    formData.append('file', file, file.name); // Добавляем filename явно
    if (projectId) {
      formData.append('project_id', projectId);
    }
    
    // Log FormData contents
    for (let pair of formData.entries()) {
      console.log('FormData entry:', pair[0], pair[1]);
    }
    
    // Исключаем Content-Type чтобы браузер сам установил границы для multipart
    return fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      body: formData,
      // НЕ устанавливаем Content-Type - браузер сделает это автоматически
    }).then(handleResponse<FileAnalysisResponse>);
  }
}

export default ApiService;