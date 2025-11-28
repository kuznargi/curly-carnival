import { FileText, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface FilePreviewProps {
  uploadState: {
    file: File | null;
    progress: number;
    status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
    analysis: string | null;
  };
  onReset: () => void;
  onStartChat?: (analysis: any) => void;
}

export const FilePreview = ({ uploadState, onReset, onStartChat }: FilePreviewProps) => {
  const { file, progress, status, analysis } = uploadState;

  if (!file) return null;

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const colors = {
      pdf: 'text-red-500',
      docx: 'text-blue-500',
      xlsx: 'text-green-500'
    };
    return colors[ext as keyof typeof colors] || 'text-muted-foreground';
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading': return 'bg-primary';
      case 'processing': return 'bg-yellow-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading': return `Загрузка... ${progress}%`;
      case 'processing': return 'Анализирую документ с помощью AI...';
      case 'success': return 'Анализ завершен!';
      case 'error': return 'Ошибка при обработке';
      default: return '';
    }
  };

  return (
    <div className="mb-3 bg-card border border-primary rounded-lg p-4 shadow-md animate-fade-in">
      <div className="flex items-start gap-3">
        <FileText className={`w-6 h-6 flex-shrink-0 ${getFileIcon(file.name)}`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            
            <button
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground transition-smooth hover-scale"
              title="Удалить"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          {status !== 'success' && status !== 'error' && (
            <div className="mb-2">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getStatusColor()}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
                {getStatusText()}
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && analysis && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="w-4 h-4" />
                <p className="text-sm font-medium">{getStatusText()}</p>
              </div>

              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-4">
                  {analysis}
                </p>
              </div>

              <Button
                onClick={() => onStartChat?.(analysis)}
                className="w-full hover-scale"
                size="sm"
              >
                Начать диалог на основе анализа
              </Button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-destructive">Ошибка обработки</p>
                <p className="text-xs text-destructive/80 mt-1">
                  {analysis || 'Не удалось проанализировать файл'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
