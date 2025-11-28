import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MermaidDiagram } from '@/components/MermaidDiagram';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { aiService } from '@/services/ai';
import { toast } from 'sonner';

type DiagramType = 'flowchart' | 'sequence' | 'journey' | 'erd';

export const DiagramGenerator = () => {
  const [description, setDescription] = useState('');
  const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDiagram, setGeneratedDiagram] = useState('');
  const [isDark] = useState(document.documentElement.classList.contains('dark'));

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Введите описание процесса');
      return;
    }

    const config = aiService.getConfig();
    if (!config) {
      toast.error('Сначала настройте AI провайдер', {
        icon: <AlertCircle className="w-4 h-4" />
      });
      return;
    }

    setIsGenerating(true);
    try {
      const diagram = await aiService.generateDiagram(description, diagramType);
      setGeneratedDiagram(diagram);
      toast.success('✨ Диаграмма сгенерирована');
    } catch (error) {
      console.error('Diagram generation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Ошибка генерации';
      toast.error(errorMsg, {
        icon: <AlertCircle className="w-4 h-4" />
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Генератор диаграмм
        </h3>

        <div className="space-y-4">
         {
             //<div>
//             <label className="text-sm font-medium mb-2 block">Тип диаграммы</label>
//             <Select value={diagramType} onValueChange={(v) => setDiagramType(v as DiagramType)}>
//               <SelectTrigger>
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="flowchart">Бизнес-процесс (Flowchart)</SelectItem>
//                 <SelectItem value="sequence">Sequence Diagram</SelectItem>
//                 <SelectItem value="journey">User Journey</SelectItem>
//                 <SelectItem value="erDiagram">Entity Relationship</SelectItem>
//               </SelectContent>
//             </Select>   </div>
}


          <div>
            <label className="text-sm font-medium mb-2 block">Описание процесса</label>
            <Input
              placeholder="Опишите процесс, который нужно визуализировать..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  handleGenerate();
                }
              }}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !description.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Генерирую диаграмму...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Сгенерировать
              </>
            )}
          </Button>
        </div>
      </div>

      {generatedDiagram && (
        <div className="animate-in fade-in duration-500">
          <MermaidDiagram 
            chart={generatedDiagram}
            title="Сгенерированная диаграмма"
            isDark={isDark}
          />
        </div>
      )}
    </div>
  );
};
