import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { aiService } from '@/services/ai';
import { DocumentContent } from '@/services/apiService';
import { toast } from 'sonner';

interface ValidationResult {
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
}

interface SmartValidatorProps {
  documentContent: DocumentContent;
  onValidationComplete?: (result: ValidationResult) => void;
}

export const SmartValidator = ({ documentContent, onValidationComplete }: SmartValidatorProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handleValidate = async () => {
    const config = aiService.getConfig();
    if (!config) {
      toast.error('Сначала настройте AI провайдер', {
        icon: <AlertCircle className="w-4 h-4" />
      });
      return;
    }

    setIsValidating(true);
    try {
      const result = await aiService.validateDocument(documentContent);
      setValidationResult(result);
      onValidationComplete?.(result);
      toast.success('✅ Валидация завершена');
    } catch (error) {
      console.error('Validation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Ошибка валидации';
      toast.error(errorMsg, {
        icon: <AlertCircle className="w-4 h-4" />
      });
    } finally {
      setIsValidating(false);
    }
  };

  const averageScore = validationResult?.overallScore || 0;

  return (
    <div className="mb-12 p-6 rounded-xl bg-gradient-to-br from-success/20 to-primary/20 border-2 border-success/30">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-8 w-8 text-success" />
            <span className="text-5xl font-bold">{averageScore}%</span>
          </div>
          <p className="text-sm opacity-90">Quality Score</p>
        </div>

        <Button 
          onClick={handleValidate} 
          disabled={isValidating}
          className="bg-primary hover:bg-primary/90"
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Анализирую...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Проверить качество
            </>
          )}
        </Button>
      </div>

      {validationResult && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-lg font-semibold mb-1">{validationResult.completeness}%</div>
              <p className="text-xs">Полнота</p>
              <div className="h-2 bg-background/20 rounded-full mt-2">
                <div className="h-full bg-success rounded-full" style={{ width: `${validationResult.completeness}%` }}></div>
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold mb-1">{validationResult.clarity}%</div>
              <p className="text-xs">Ясность</p>
              <div className="h-2 bg-background/20 rounded-full mt-2">
                <div className="h-full bg-primary rounded-full" style={{ width: `${validationResult.clarity}%` }}></div>
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold mb-1">{validationResult.detail}%</div>
              <p className="text-xs">Детализация</p>
              <div className="h-2 bg-background/20 rounded-full mt-2">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${validationResult.detail}%` }}></div>
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold mb-1">{validationResult.consistency}%</div>
              <p className="text-xs">Согласованность</p>
              <div className="h-2 bg-background/20 rounded-full mt-2">
                <div className="h-full bg-secondary rounded-full" style={{ width: `${validationResult.consistency}%` }}></div>
              </div>
            </div>
          </div>

          {validationResult.issues && validationResult.issues.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Найдены проблемы:
              </h4>
              {validationResult.issues.map((issue, idx) => (
                <div key={idx} className="bg-background/40 rounded-lg p-3 text-sm">
                  {issue.section && (
                    <div className="font-semibold text-foreground mb-1">
                      {issue.section}
                    </div>
                  )}
                  <div className="text-muted-foreground mb-2">
                    {issue.message}
                  </div>
                  <div className="text-xs text-primary/80">
                    {issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'} {issue.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
