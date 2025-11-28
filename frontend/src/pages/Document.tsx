import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { DocumentEditModal } from "@/components/DocumentEditModal";
import { SmartValidator } from "@/components/SmartValidator";
import { DiagramGenerator } from "@/components/DiagramGenerator";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import ApiService, { DocumentContent, QualityScore, ValidationIssue } from "@/services/apiService";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Upload,
  Edit,
  Target,
  Layers,
  GitBranch,
  TrendingUp,
  Activity,
  CheckCircle,
  User,
  ArrowLeft,
  Palette,
  Loader2,
  Users,
  Circle,
  Sparkles
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Document = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // Document state
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectDocument, setProjectDocument] = useState<DocumentContent | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Validation state
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  // Diagrams state
  const [bpmnDiagram, setBpmnDiagram] = useState<string>('');
  const [sequenceDiagram, setSequenceDiagram] = useState<string>('');
  const [journeyDiagram, setJourneyDiagram] = useState<string>('');

  const navLinks = [
    { id: "description", label: "Описание проекта" },
    { id: "goals", label: "Цели и задачи" },
    { id: "scope", label: "Scope (Границы)" },
    { id: "use-cases", label: "Use Cases" },
    { id: "kpi", label: "KPI и метрики" },
    { id: "diagrams", label: "Диаграммы" },
  ];

  const activeSection = useScrollSpy(navLinks.map(link => link.id));

  // Load document on mount
  useEffect(() => {
    const projId = location.state?.projectId;
    if (projId) {
      setProjectId(projId);
      loadOrGenerateDocument(projId);
    } else {
      toast.error('Project ID не указан');
      navigate('/chat');
    }
  }, []);

  const loadOrGenerateDocument = async (projId: string) => {
    setIsLoading(true);
    try {
      // Try to generate document
      await generateDocument(projId);
    } catch (error) {
      console.error('Failed to load/generate document:', error);
      toast.error('Ошибка загрузки документа');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDocument = async (projId: string) => {
    setIsGenerating(true);
    try {
      const response = await ApiService.generateDocument({ project_id: projId });
      setProjectDocument(response.document);
      setDocumentId(response.document_id);

      // Load existing diagrams if available
      if (response.document.diagrams) {
        console.log('Loading existing diagrams from document');
        if (response.document.diagrams.bpmn) {
          setBpmnDiagram(response.document.diagrams.bpmn);
        }
        if (response.document.diagrams.sequence) {
          setSequenceDiagram(response.document.diagrams.sequence);
        }
        if (response.document.diagrams.journey) {
          setJourneyDiagram(response.document.diagrams.journey);
        }
      }

      if (response.quality_score) {
        // Convert flat quality_score to QualityScore structure
        const score: QualityScore = {
          health: response.quality_score,
          completeness: response.quality_score,
          clarity: response.quality_score,
          detail: response.quality_score,
          consistency: response.quality_score,
        };
        setQualityScore(score);
      }

      toast.success('Документ сгенерирован!');

      // Generate diagrams only if they don't exist
      if (!response.document.diagrams || !response.document.diagrams.bpmn) {
        await generateDiagrams(response.document);
      }
    } catch (error) {
      console.error('Document generation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Ошибка генерации';
      toast.error(errorMsg);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToPDF = async () => {
    if (!projectDocument) return;

    // Собираем SVG диаграмм если они есть
    let diagramsHTML = '';
    if (bpmnDiagram || sequenceDiagram || journeyDiagram) {
      diagramsHTML = '<h2>6. Диаграммы и визуализация</h2>';

      if (bpmnDiagram) {
        try {
          const svgElement = document.querySelector('#bpmn-diagram svg');
          if (svgElement) {
            diagramsHTML += `
              <h3>Процесс обработки заявки (BPMN)</h3>
              <div class="diagram">${svgElement.outerHTML}</div>
            `;
          }
        } catch (e) {
          console.error('Error extracting BPMN diagram:', e);
        }
      }

      if (sequenceDiagram) {
        try {
          const svgElement = document.querySelector('#sequence-diagram svg');
          if (svgElement) {
            diagramsHTML += `
              <h3>Взаимодействие компонентов системы</h3>
              <div class="diagram">${svgElement.outerHTML}</div>
            `;
          }
        } catch (e) {
          console.error('Error extracting sequence diagram:', e);
        }
      }

      if (journeyDiagram) {
        try {
          const svgElement = document.querySelector('#journey-diagram svg');
          if (svgElement) {
            diagramsHTML += `
              <h3>Путь клиента (Customer Journey)</h3>
              <div class="diagram">${svgElement.outerHTML}</div>
            `;
          }
        } catch (e) {
          console.error('Error extracting journey diagram:', e);
        }
      }
    }

    // Создаем HTML для экспорта
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Бизнес-требования: ${projectDocument.projectName}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { color: #0085CA; border-bottom: 3px solid #0085CA; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; page-break-before: always; }
        h2:first-of-type { page-break-before: avoid; }
        h3 { color: #555; margin-top: 20px; }
        .goal, .rule, .usecase, .kpi { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; page-break-inside: avoid; }
        .priority { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
        .priority-high { background: #fecaca; color: #991b1b; }
        .priority-medium { background: #fef08a; color: #854d0e; }
        .priority-low { background: #d9f99d; color: #365314; }
        ul { padding-left: 25px; }
        li { margin: 5px 0; }
        .diagram {
            margin: 20px 0;
            padding: 15px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            page-break-inside: avoid;
            text-align: center;
        }
        .diagram svg {
            max-width: 100%;
            height: auto;
        }
        @media print {
            body { max-width: none; margin: 0; padding: 20px; }
            .diagram { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1>${projectDocument.projectName}</h1>

    <h2>1. Описание проекта</h2>
    ${projectDocument.description.paragraphs.map(p => `<p>${p}</p>`).join('')}

    <h2>2. Цели и задачи</h2>
    ${projectDocument.goals.map(g => `
        <div class="goal">
            <span class="priority priority-${g.priority}">${g.priority.toUpperCase()}</span>
            <p><strong>${g.text}</strong></p>
        </div>
    `).join('')}

    <h2>3. Границы проекта (Scope)</h2>
    <h3>Что входит в проект:</h3>
    <ul>${projectDocument.scope.inScope.map(item => `<li>${item}</li>`).join('')}</ul>
    <h3>Что НЕ входит в проект:</h3>
    <ul>${projectDocument.scope.outOfScope.map(item => `<li>${item}</li>`).join('')}</ul>

    <h2>4. Бизнес-правила</h2>
    ${projectDocument.businessRules.map(rule => `
        <div class="rule">
            <p><strong>${rule.id}: ${rule.title}</strong> <span class="priority priority-${rule.priority}">${rule.priority}</span></p>
            <p>${rule.description}</p>
        </div>
    `).join('')}

    <h2>5. Use Cases (Сценарии использования)</h2>
    ${projectDocument.useCases.map(uc => `
        <div class="usecase">
            <h3>${uc.id}: ${uc.title}</h3>
            <p><strong>Актор:</strong> ${uc.actor}</p>
            <p><strong>Предусловия:</strong></p>
            <ul>${uc.preconditions.map(p => `<li>${p}</li>`).join('')}</ul>
            <p><strong>Основной сценарий:</strong></p>
            <ol>${uc.mainScenario.map(s => `<li>${s}</li>`).join('')}</ol>
            <p><strong>Постусловия:</strong> ${uc.postconditions}</p>
        </div>
    `).join('')}

    <h2>6. KPI (Ключевые показатели эффективности)</h2>
    ${projectDocument.kpis.map(kpi => `
        <div class="kpi">
            <p><strong>${kpi.name}</strong></p>
            <p>Текущее значение: ${kpi.current}${kpi.unit}</p>
            <p>Целевое значение: ${kpi.target}${kpi.unit}</p>
        </div>
    `).join('')}

    ${diagramsHTML}

    <hr style="margin: 40px 0;">
    <p style="text-align: center; color: #666; font-size: 12px;">
        Документ сгенерирован AI Business Analyst • ForteBank
    </p>
</body>
</html>
    `;

    // Создаем Blob и скачиваем
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectDocument.projectName.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_requirements.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Документ экспортирован! Откройте его в браузере и сохраните как PDF');
  };

  const handleDocumentSave = async (updatedDocument: DocumentContent) => {
    setProjectDocument(updatedDocument);

    // Save to server with current diagrams
    if (documentId) {
      try {
        const docWithDiagrams = {
          ...updatedDocument,
          diagrams: {
            bpmn: bpmnDiagram,
            sequence: sequenceDiagram,
            journey: journeyDiagram
          }
        };

        await ApiService.updateDocument(documentId, docWithDiagrams);
        toast.success('Изменения сохранены в базе данных!');
      } catch (error) {
        console.error('Failed to save document:', error);
        toast.error('Не удалось сохранить изменения');
      }
    } else {
      toast.success('Изменения сохранены локально!');
    }
  };

  const generateDiagrams = async (doc: DocumentContent) => {
    if (!doc.useCases || doc.useCases.length === 0) {
      console.log('No use cases found, skipping diagram generation');
      return;
    }

    console.log('Starting diagram generation for document:', doc.projectName);

    try {
      // Generate BPMN from first use case
      const firstUseCase = doc.useCases[0];
      const bpmnDescription = `${firstUseCase.title}: ${firstUseCase.mainScenario.join(', ')}`;
      console.log('Generating BPMN diagram with description:', bpmnDescription);

      const bpmnResult = await ApiService.generateDiagram({
        description: bpmnDescription,
        diagram_type: 'flowchart'
      });
      console.log('BPMN diagram result:', bpmnResult);
      console.log('BPMN mermaid code:', bpmnResult.mermaid_code);
      setBpmnDiagram(bpmnResult.mermaid_code);
      console.log('BPMN diagram state updated');

      // Generate Sequence diagram from description
      const seqDescription = doc.description.paragraphs.join(' ');
      console.log('Generating Sequence diagram with description:', seqDescription.substring(0, 100));

      const seqResult = await ApiService.generateDiagram({
        description: seqDescription,
        diagram_type: 'sequenceDiagram'
      });
      console.log('Sequence diagram result:', seqResult);
      setSequenceDiagram(seqResult.mermaid_code);
      console.log('Sequence diagram state updated');

      // Generate Journey diagram
      const journeyDescription = `Customer journey for ${doc.projectName}`;
      console.log('Generating Journey diagram with description:', journeyDescription);

      const journeyResult = await ApiService.generateDiagram({
        description: journeyDescription,
        diagram_type: 'journey'
      });
      console.log('Journey diagram result:', journeyResult);
      setJourneyDiagram(journeyResult.mermaid_code);
      console.log('Journey diagram state updated');

      console.log('All diagrams generated successfully');

      // Save diagrams to database
      if (documentId) {
        try {
          const docWithDiagrams = {
            ...doc,
            diagrams: {
              bpmn: bpmnResult.mermaid_code,
              sequence: seqResult.mermaid_code,
              journey: journeyResult.mermaid_code
            }
          };

          await ApiService.updateDocument(documentId, docWithDiagrams);
          console.log('Diagrams saved to database');
        } catch (saveError) {
          console.error('Failed to save diagrams to database:', saveError);
        }
      }
    } catch (error) {
      console.error('Diagram generation error:', error);
      // Don't show error toast, diagrams are optional
    }
  };

  // Loading state
  if (isLoading || isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6 relative">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-3">
            {isGenerating ? '✨ Генерирую документ...' : '⏳ Загружаю документ...'}
          </h2>

          <p className="text-muted-foreground mb-6">
            {isGenerating
              ? 'AI анализирует диалог и создаёт структурированный документ со всеми секциями, use cases и диаграммами'
              : 'Пожалуйста, подождите, загружаем ваш документ'}
          </p>

          {isGenerating && (
            <div className="space-y-3 text-left bg-muted/50 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Анализирую цели и задачи</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span>Создаю Use Cases</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                <span>Генерирую диаграммы</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // No document state
  if (!projectDocument) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Документ не найден</h2>
          <Button onClick={() => navigate('/chat')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться к чату
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-[240px] border-r border-border bg-muted/30 p-6 fixed h-screen overflow-y-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate("/chat")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к чату
        </Button>

        <h3 className="text-lg font-semibold mb-6">Содержание</h3>

        <nav className="space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`block px-3 py-2 rounded-lg text-sm transition-smooth ${
                activeSection === link.id
                  ? 'bg-primary text-primary-foreground font-semibold border-l-4 border-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-primary'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-3 pt-6 border-t border-border">
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            size="sm"
            onClick={exportToPDF}
          >
            <Download className="mr-2 h-4 w-4" />
            Экспорт HTML/PDF
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
        </div>
      </aside>

      {/* Document Viewer */}
      <main className="flex-1 ml-[240px]">
        <div className="max-w-[900px] mx-auto p-12 bg-card my-8 rounded-2xl shadow-elegant">
          {/* Document Header */}
          <header className="mb-12 pb-8 border-b-2 border-border">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-4xl font-bold text-primary flex-1">
                Бизнес-требования: {projectDocument.projectName}
              </h1>


            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Создан: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>•</span>
              <span>Автор: AI-Business Analyst</span>

              {qualityScore && qualityScore.health >= 80 && (
                <Badge className="bg-success/10 text-success border-success/20">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Проверено
                </Badge>
              )}
            </div>
          </header>

          {/* Smart Validator */}
          <SmartValidator
            documentContent={projectDocument}
          />

          {/* Section 1: Description */}
          <section id="description" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-primary">1. Описание проекта</h2>
            </div>
            <div className="space-y-4 text-foreground leading-relaxed">
              {projectDocument.description.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          {/* Section 2: Goals */}
          <section id="goals" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-primary">2. Цели и задачи</h2>
            </div>
            <h3 className="text-xl font-semibold mb-4">Бизнес-цели:</h3>
            <div className="space-y-3">
              {projectDocument.goals.map((goal, index) => (
                <div key={index} className="bg-accent rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    goal.priority === 'high' ? 'text-red-500' :
                    goal.priority === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`} />
                  <div className="flex-1">
                    <span className="text-foreground">{goal.text}</span>
                    <Badge className="ml-2" variant={
                      goal.priority === 'high' ? 'destructive' :
                      goal.priority === 'medium' ? 'secondary' :
                      'default'
                    }>
                      {goal.priority === 'high' ? 'Высокий' :
                       goal.priority === 'medium' ? 'Средний' :
                       'Низкий'} приоритет
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Scope */}
          <section id="scope" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <Layers className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-primary">3. Scope (Границы проекта)</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-success/5 border-l-4 border-success rounded-lg p-6">
                <h3 className="text-lg font-semibold text-success mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  В проекте
                </h3>
                <ul className="space-y-2 text-sm">
                  {projectDocument.scope.inScope.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-destructive/5 border-l-4 border-destructive rounded-lg p-6">
                <h3 className="text-lg font-semibold text-destructive mb-4">
                  ❌ Не входит
                </h3>
                <ul className="space-y-2 text-sm">
                  {projectDocument.scope.outOfScope.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: Use Cases */}
          <section id="use-cases" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <GitBranch className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-primary">4. Use Cases</h2>
            </div>

            <div className="space-y-6">
              {projectDocument.useCases.map((useCase, index) => (
                <div key={useCase.id} className="border-2 border-border rounded-xl p-6 hover:shadow-lg transition-smooth">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">{useCase.id}: {useCase.title}</h3>
                    </div>
                    <Badge variant={index === 0 ? 'destructive' : 'secondary'}>
                      {index === 0 ? 'Критичный' : 'Важный'}
                    </Badge>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="font-semibold text-muted-foreground">Актор:</span>
                      <p className="mt-1">{useCase.actor}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-muted-foreground">Предусловия:</span>
                      <ul className="mt-2 space-y-1 ml-4">
                        {useCase.preconditions.map((precondition, idx) => (
                          <li key={idx}>• {precondition}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-semibold text-muted-foreground">Основной сценарий:</span>
                      <ol className="mt-2 space-y-2 ml-4">
                        {useCase.mainScenario.map((step, idx) => (
                          <li key={idx} className="bg-muted/50 p-2 rounded">{idx + 1}. {step}</li>
                        ))}
                      </ol>
                    </div>

                    {useCase.postconditions && (
                      <div>
                        <span className="font-semibold text-muted-foreground">Постусловия:</span>
                        <p className="mt-1">{useCase.postconditions}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: KPI */}
          <section id="kpi" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-primary">5. KPI и метрики успеха</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {projectDocument.kpis.map((kpi, index) => {
                const progress = (kpi.current / kpi.target) * 100;
                const colors = [
                  'from-success to-success/70',
                  'from-primary to-primary/70',
                  'from-purple-500 to-purple-600'
                ];
                const color = colors[index % colors.length];

                return (
                  <div key={index} className={`bg-gradient-to-br ${color} text-white rounded-xl p-6`}>
                    <Target className="h-8 w-8 mb-3" />
                    <p className="text-sm opacity-90 mb-2">{kpi.name}</p>
                    <p className="text-4xl font-bold mb-2">{kpi.current}{kpi.unit}</p>
                    <p className="text-sm opacity-75">Цель: {kpi.target}{kpi.unit}</p>
                    <div className="mt-4 h-2 bg-white/20 rounded-full">
                      <div
                        className="h-full bg-white rounded-full"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 6: Diagrams */}
          <section id="diagrams" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-primary">6. Диаграммы и визуализация</h2>
              <Badge className="bg-purple-500">AI Generated</Badge>
            </div>
            <p className="text-sm text-muted-foreground italic mb-8">Автоматически сгенерировано AI Visual Designer</p>

            <div className="space-y-8">

              {console.log('Diagram states:', { bpmnDiagram: !!bpmnDiagram, sequenceDiagram: !!sequenceDiagram, journeyDiagram: !!journeyDiagram })}
{
//               {
//                   bpmnDiagram ? (
//                 <div className="group" id="bpmn-diagram">
//                   <h3 className="text-xl font-semibold mb-4">Процесс обработки заявки (BPMN)</h3>
//                   <MermaidDiagram chart={bpmnDiagram} title="BPMN Process" isDark={isDark} />
//                 </div>
//               ) : (
//                 <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
//                   ⏳ Генерация BPMN диаграммы...
//                 </div>
//               )}
}

              {sequenceDiagram ? (
                <div className="group" id="sequence-diagram">
                  <h3 className="text-xl font-semibold mb-4">Взаимодействие компонентов системы</h3>
                  <MermaidDiagram chart={sequenceDiagram} title="Sequence Diagram" isDark={isDark} />
                </div>
              ) : (
                <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  ⏳ Генерация Sequence диаграммы...
                </div>
              )}

              {journeyDiagram ? (
                <div className="group" id="journey-diagram">
                  <h3 className="text-xl font-semibold mb-4">Путь клиента (Customer Journey)</h3>
                  <MermaidDiagram chart={journeyDiagram} title="User Journey" isDark={isDark} />
                </div>
              ) : (
                <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  ⏳ Генерация Journey диаграммы...
                </div>
              )}

              {/* Allow generating more diagrams */}
              <div className="mt-8">
                <DiagramGenerator />
              </div>
            </div>
          </section>

          {/* Document Footer */}
          <footer className="mt-16 pt-8 border-t-2 border-border text-sm text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>Сгенерировано AI-Business Analyst | ForteBank</span>
              <span>21 ноября 2025, 14:30</span>
              <span className="font-semibold">v1.0</span>
            </div>
          </footer>
        </div>
      </main>



      <DocumentEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        document={projectDocument}
        onSave={handleDocumentSave}
      />


    </div>
  );
};

export default Document;
