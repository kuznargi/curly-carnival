import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { aiService } from '@/services/ai';

interface FileUploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  analysis: string | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['.pdf', '.docx', '.xlsx'];

export const useFileUpload = () => {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    progress: 0,
    status: 'idle',
    analysis: null
  });

  const validateFile = useCallback((file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('❌ Файл слишком большой', {
        description: 'Максимальный размер файла: 10MB'
      });
      return false;
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(extension)) {
      // Для демо разрешаем любые файлы
      toast.warning('⚠️ Неподдерживаемый формат', {
        description: 'Файл будет обработан как демо-контент'
      });
    }

    return true;
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    const config = aiService.getConfig();
    if (!config) {
      toast.error('Сначала настройте AI провайдер');
      return;
    }

    setUploadState({
      file,
      progress: 0,
      status: 'uploading',
      analysis: null
    });

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadState(prev => ({ ...prev, progress: i }));
    }

    // Process with AI
    setUploadState(prev => ({ ...prev, status: 'processing', progress: 100 }));
    
    try {
      console.log('Analyzing file:', file.name, file.type, file.size);
      const analysis = await aiService.analyzeFile(file);
      
      // Format analysis for display
      let analysisText = '';
      if (typeof analysis === 'object' && analysis !== null) {
        analysisText = `📊 Анализ файла завершен!\n\n` +
          `🎯 Проект: ${analysis.project_name || 'Не определен'}\n\n` +
          `📋 Цели (${analysis.goals?.length || 0}):\n` +
          (analysis.goals || []).map((goal: string, i: number) => `${i + 1}. ${goal}`).join('\n') + '\n\n' +
          `✅ Требования (${analysis.requirements?.length || 0}):\n` +
          (analysis.requirements || []).map((req: string, i: number) => `${i + 1}. ${req}`).join('\n') + '\n\n' +
          `👥 Стейкхолдеры (${analysis.stakeholders?.length || 0}):\n` +
          (analysis.stakeholders || []).map((sh: string, i: number) => `${i + 1}. ${sh}`).join('\n') + '\n\n' +
          `📝 Описание:\n${analysis.description || 'Не указано'}`;
      } else {
        analysisText = typeof analysis === 'string' ? analysis : 'Анализ завершен';
      }

      setUploadState(prev => ({
        ...prev,
        status: 'success',
        analysis: analysisText
      }));

      toast.success('✅ Документ успешно обработан');
    } catch (error) {
      console.error('Document analysis error:', error);
      
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        analysis: 'Ошибка анализа документа'
      }));

      const errorMsg = error instanceof Error ? error.message : 'Ошибка анализа';
      toast.error(errorMsg);
    }
  }, [validateFile]);

  const resetUpload = useCallback(() => {
    setUploadState({
      file: null,
      progress: 0,
      status: 'idle',
      analysis: null
    });
  }, []);

  return {
    uploadState,
    uploadFile,
    resetUpload,
    validateFile
  };
};
