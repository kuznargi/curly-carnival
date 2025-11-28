import { Upload, Paperclip } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { FilePreview } from './FilePreview';
import { useState } from 'react';

interface FileUploadProps {
  onFileProcessed?: (summary: any) => void;
}

export const FileUpload = ({ onFileProcessed }: FileUploadProps) => {
  const { uploadState, uploadFile, resetUpload } = useFileUpload();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  if (uploadState.status !== 'idle') {
    return (
      <FilePreview
        uploadState={uploadState}
        onReset={resetUpload}
        onStartChat={onFileProcessed}
      />
    );
  }

  return (
    <div className="relative">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".pdf,.docx,.xlsx"
        onChange={handleInputChange}
      />
      
      <button
        type="button"
        onClick={() => document.getElementById('file-upload')?.click()}
        className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center transition-all duration-200 hover:scale-105"
        title="Прикрепить файл"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {/* Drag & Drop Overlay (appears when dragging) */}
      <div
        className={`
          fixed inset-0 z-50 bg-background/80 backdrop-blur-sm
          flex items-center justify-center transition-opacity duration-200
          ${isDragOver ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className={`
          border-2 border-dashed rounded-2xl p-12 bg-card transition-all duration-200
          ${isDragOver ? 'border-primary scale-105 bg-primary/5' : 'border-muted'}
        `}>
          <div className="flex flex-col items-center gap-4">
            <Upload className={`w-12 h-12 transition-transform duration-200 ${isDragOver ? 'scale-110' : ''} text-muted-foreground`} />
            <div className="text-center">
              <p className="text-lg font-semibold">Перетащите файл сюда</p>
              <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, Excel до 10MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
