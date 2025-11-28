import { useEffect, useState } from "react";
import { Upload, Search, Sparkles, CheckCircle, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  file: File;
  uploadState: any;
  onComplete: (summary: any) => void;
}

interface ProcessStage {
  progress: number;
  icon: any;
  text: string;
  color: string;
}

const stages: ProcessStage[] = [
  { progress: 25, icon: Upload, text: "Загрузка файла...", color: "text-primary" },
  { progress: 50, icon: Search, text: "Анализ содержимого...", color: "text-purple-500" },
  { progress: 75, icon: Sparkles, text: "Извлечение требований...", color: "text-warning" },
  { progress: 100, icon: CheckCircle, text: "Структурирование данных...", color: "text-success" },
];

export function UploadProgress({ file, uploadState, onComplete }: UploadProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsComplete(true), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stage = stages.findIndex(s => progress < s.progress);
    setCurrentStage(stage === -1 ? stages.length - 1 : Math.max(0, stage));
  }, [progress]);

  const getFileIcon = () => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'docx' || ext === 'doc') return '📝';
    if (ext === 'xlsx' || ext === 'xls') return '📊';
    return '📄';
  };

  const getFileColor = () => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'text-red-500';
    if (ext === 'docx' || ext === 'doc') return 'text-primary';
    if (ext === 'xlsx' || ext === 'xls') return 'text-success';
    return 'text-muted-foreground';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isComplete) {
    return (
      <div className="p-12 text-center">
        <div className="mb-6 inline-flex items-center justify-center w-32 h-32 rounded-full bg-success/10 animate-in zoom-in-50">
          <CheckCircle className="w-20 h-20 text-success" />
        </div>
        
        <h3 className="text-2xl font-bold mb-4">
          ✅ Документ успешно проанализирован!
        </h3>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
          {[
            { icon: '📝', label: '127 требований' },
            { icon: '🎯', label: '5 целей' },
            { icon: '👥', label: '3 стейкхолдера' },
            { icon: '📊', label: '12 Use Cases' },
          ].map((stat, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-muted/50 animate-in fade-in-50 slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-sm font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => onComplete({ requirements: 127, goals: 5 })}
          >
            Начать диалог на основе документа
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full"
            onClick={() => onComplete({ requirements: 127, goals: 5 })}
          >
            Создать документ сразу
          </Button>
        </div>
      </div>
    );
  }

  const CurrentIcon = stages[currentStage].icon;

  return (
    <div className="p-12 text-center">
      {/* Animated File Icon */}
      <div className="mb-6 inline-flex items-center justify-center">
        <div className="relative">
          <FileText className={cn("w-32 h-32 animate-pulse", getFileColor())} />
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            {getFileIcon()}
          </div>
        </div>
      </div>

      {/* File Info */}
      <h3 className="text-xl font-bold mb-2">{file.name}</h3>
      <p className="text-sm text-muted-foreground mb-8">{formatFileSize(file.size)}</p>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto mb-4">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Progress Percentage */}
      <p className="text-lg font-semibold mb-8">
        Загрузка... {Math.round(progress)}%
      </p>

      {/* Current Stage */}
      <div className="flex items-center justify-center gap-3 text-muted-foreground">
        <CurrentIcon className={cn("w-6 h-6 animate-spin", stages[currentStage].color)} />
        <span>{stages[currentStage].text}</span>
      </div>
    </div>
  );
}
