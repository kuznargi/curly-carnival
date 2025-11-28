import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ConfluenceProgressProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { label: 'Подготовка документа', duration: 1000 },
  { label: 'Форматирование контента', duration: 1500 },
  { label: 'Загрузка на Confluence', duration: 2000 },
  { label: 'Применение шаблона', duration: 1000 },
  { label: 'Публикация страницы', duration: 1500 }
];

export const ConfluenceProgress = ({ open, onOpenChange }: ConfluenceProgressProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [mockUrl] = useState(`https://fortebank.atlassian.net/wiki/spaces/BANK/pages/${Math.floor(Math.random() * 900000) + 100000}`);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setProgress(0);
      setIsComplete(false);
      return;
    }

    let stepTimeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const runStep = (index: number) => {
      if (index >= steps.length) {
        setProgress(100);
        setIsComplete(true);
        
        // Confetti effect
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        return;
      }

      setCurrentStep(index);
      const stepProgress = (index / steps.length) * 100;
      const stepIncrement = (100 / steps.length) / (steps[index].duration / 50);
      
      progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev + stepIncrement;
          if (next >= stepProgress + (100 / steps.length)) {
            clearInterval(progressInterval);
            return stepProgress + (100 / steps.length);
          }
          return next;
        });
      }, 50);

      stepTimeout = setTimeout(() => {
        clearInterval(progressInterval);
        runStep(index + 1);
      }, steps[index].duration);
    };

    runStep(0);

    return () => {
      clearTimeout(stepTimeout);
      clearInterval(progressInterval);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-success" />
                Успешно опубликовано!
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                Публикация в Confluence
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isComplete ? (
            <>
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {Math.round(progress)}%
                </p>
              </div>

              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 transition-all duration-300 ${
                      index === currentStep
                        ? 'text-primary font-medium scale-105'
                        : index < currentStep
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground/50'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    ) : index === currentStep ? (
                      <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-muted flex-shrink-0" />
                    )}
                    <span className="text-sm">{step.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-semibold">Документ опубликован!</p>
                <p className="text-sm text-muted-foreground">
                  Ваш документ успешно загружен в Confluence
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Ссылка на страницу:</p>
                <a
                  href={mockUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center justify-center gap-2 font-mono break-all"
                >
                  {mockUrl}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>

              <Button
                onClick={() => window.open(mockUrl, '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Открыть в Confluence
              </Button>
            </div>
          )}
        </div>

        {isComplete && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
