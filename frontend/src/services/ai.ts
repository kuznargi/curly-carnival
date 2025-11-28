// AI Service - теперь работает ТОЛЬКО через Backend API
import ApiService, { 
  ChatMessage, 
  ChatMessageRequest,
  DocumentContent,
  DiagramGenerateRequest 
} from './apiService';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

class AIService {
   async analyzeFile(file: File, projectId?: string) {
    try {
      console.log('Uploading file:', file.name, file.type);
      const result = await ApiService.uploadFile(file, projectId);
      console.log('Upload result:', result);
      return result;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(`Ошибка загрузки файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }
  async chat(messages: AIMessage[], projectId: string): Promise<string> {
    try {
      const chatMessages: ChatMessage[] = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp?.toISOString()
      }));

      const request: ChatMessageRequest = {
        project_id: projectId,
        message: messages[messages.length - 1]?.content || '',
        history: chatMessages.slice(0, -1)
      };

      const response = await ApiService.sendChatMessage(request);
      return response.message;
    } catch (error) {
      console.error('AI Chat error:', error);
      throw new Error(`Ошибка AI чата: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  async streamChat(
    messages: AIMessage[],
    projectId: string,
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await this.chat(messages, projectId);
      this.simulateTyping(response, onChunk, onComplete);
    } catch (error) {
      onError(error as Error);
    }
  }

  private simulateTyping(
    text: string, 
    onChunk: (text: string) => void, 
    onComplete: () => void
  ): void {
    const words = text.split(' ');
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < words.length) {
        const word = words[index];
        onChunk(index === 0 ? word : ` ${word}`);
        index++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 80);
  }

  // VALIDATION METHODS
  async validateDocument(document: DocumentContent): Promise<{
    overallScore: number;
    completeness: number;
    clarity: number;
    detail: number;
    consistency: number;
    issues: Array<{
      type: string;
      message: string;
      section?: string;
      severity?: string;
      fixable?: boolean;
    }>;
  }> {
    try {
      console.log('Validating document:', document);
      const response = await ApiService.analyzeDocument(document);

      return {
        overallScore: response.qualityScore.health,
        completeness: response.qualityScore.completeness,
        clarity: response.qualityScore.clarity,
        detail: response.qualityScore.detail,
        consistency: response.qualityScore.consistency,
        issues: response.issues.map(issue => ({
          type: issue.severity,
          message: issue.text,
          section: issue.section,
          severity: issue.severity,
          fixable: issue.fixable
        }))
      };
    } catch (error) {
      console.error('Document validation error:', error);
      throw new Error(`Ошибка валидации документа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  // DIAGRAM GENERATION METHODS
  async generateDiagram(description: string, diagramType: string): Promise<string> {
    try {
      const request = {
        description,
        diagram_type: diagramType
      };
      
      const response = await ApiService.generateDiagram(request);
      return response.mermaid_code;
    } catch (error) {
      console.error('Diagram generation error:', error);
      throw new Error(`Ошибка генерации диаграммы: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  // DOCUMENT GENERATION METHODS
  async generateDocument(projectId: string) {
    try {
      return await ApiService.generateDocument({ project_id: projectId });
    } catch (error) {
      console.error('Document generation error:', error);
      throw new Error(`Ошибка генерации документа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  // Методы для совместимости
  setConfig(config: any) {
    console.log('AI настроен через backend');
  }

  getConfig() {
    return { provider: 'backend-gemini', configured: true };
  }

  clearConfig() {
    // Ничего не делаем
  }
}

export const aiService = new AIService();
export type AIProvider = 'backend-gemini';
export { AIMessage };
