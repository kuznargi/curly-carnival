import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentContent, Goal, BusinessRule, UseCase, KPI } from '@/services/apiService';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentContent;
  onSave: (updatedDocument: DocumentContent) => void;
}

export const DocumentEditModal = ({ open, onOpenChange, document, onSave }: DocumentEditModalProps) => {
  const [editedDoc, setEditedDoc] = useState<DocumentContent>(document);

  useEffect(() => {
    setEditedDoc(document);
  }, [document]);

  const handleSave = () => {
    onSave(editedDoc);
    toast.success('Документ обновлен!');
    onOpenChange(false);
  };

  const updateProjectName = (value: string) => {
    setEditedDoc({ ...editedDoc, projectName: value });
  };

  const updateDescription = (index: number, value: string) => {
    const newParagraphs = [...editedDoc.description.paragraphs];
    newParagraphs[index] = value;
    setEditedDoc({
      ...editedDoc,
      description: { paragraphs: newParagraphs }
    });
  };

  const addDescriptionParagraph = () => {
    setEditedDoc({
      ...editedDoc,
      description: {
        paragraphs: [...editedDoc.description.paragraphs, 'Новый параграф']
      }
    });
  };

  const removeDescriptionParagraph = (index: number) => {
    const newParagraphs = editedDoc.description.paragraphs.filter((_, i) => i !== index);
    setEditedDoc({
      ...editedDoc,
      description: { paragraphs: newParagraphs }
    });
  };

  const updateGoal = (index: number, field: keyof Goal, value: string) => {
    const newGoals = [...editedDoc.goals];
    newGoals[index] = { ...newGoals[index], [field]: value };
    setEditedDoc({ ...editedDoc, goals: newGoals });
  };

  const addGoal = () => {
    setEditedDoc({
      ...editedDoc,
      goals: [...editedDoc.goals, { text: 'Новая цель', priority: 'medium' as const }]
    });
  };

  const removeGoal = (index: number) => {
    setEditedDoc({
      ...editedDoc,
      goals: editedDoc.goals.filter((_, i) => i !== index)
    });
  };

  const updateScope = (type: 'inScope' | 'outOfScope', index: number, value: string) => {
    const newScope = { ...editedDoc.scope };
    newScope[type][index] = value;
    setEditedDoc({ ...editedDoc, scope: newScope });
  };

  const addScopeItem = (type: 'inScope' | 'outOfScope') => {
    const newScope = { ...editedDoc.scope };
    newScope[type].push('Новый пункт');
    setEditedDoc({ ...editedDoc, scope: newScope });
  };

  const removeScopeItem = (type: 'inScope' | 'outOfScope', index: number) => {
    const newScope = { ...editedDoc.scope };
    newScope[type] = newScope[type].filter((_, i) => i !== index);
    setEditedDoc({ ...editedDoc, scope: newScope });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Редактировать документ</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Name */}
          <div>
            <Label htmlFor="projectName" className="text-base font-semibold">Название проекта</Label>
            <Input
              id="projectName"
              value={editedDoc.projectName}
              onChange={(e) => updateProjectName(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-base font-semibold">Описание проекта</Label>
              <Button size="sm" variant="outline" onClick={addDescriptionParagraph}>
                <Plus className="w-4 h-4 mr-1" />
                Добавить параграф
              </Button>
            </div>
            {editedDoc.description.paragraphs.map((para, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Textarea
                  value={para}
                  onChange={(e) => updateDescription(index, e.target.value)}
                  rows={3}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeDescriptionParagraph(index)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Goals */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-base font-semibold">Цели и задачи</Label>
              <Button size="sm" variant="outline" onClick={addGoal}>
                <Plus className="w-4 h-4 mr-1" />
                Добавить цель
              </Button>
            </div>
            {editedDoc.goals.map((goal, index) => (
              <div key={index} className="flex gap-2 mb-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Цель"
                    value={goal.text}
                    onChange={(e) => updateGoal(index, 'text', e.target.value)}
                  />
                  <Select
                    value={goal.priority}
                    onValueChange={(value) => updateGoal(index, 'priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="low">Низкий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeGoal(index)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Scope */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Границы проекта (Scope)</Label>

            {/* In Scope */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm">Что входит в проект</Label>
                <Button size="sm" variant="outline" onClick={() => addScopeItem('inScope')}>
                  <Plus className="w-3 h-3 mr-1" />
                  Добавить
                </Button>
              </div>
              {editedDoc.scope.inScope.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={item}
                    onChange={(e) => updateScope('inScope', index, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeScopeItem('inScope', index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Out of Scope */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm">Что НЕ входит в проект</Label>
                <Button size="sm" variant="outline" onClick={() => addScopeItem('outOfScope')}>
                  <Plus className="w-3 h-3 mr-1" />
                  Добавить
                </Button>
              </div>
              {editedDoc.scope.outOfScope.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={item}
                    onChange={(e) => updateScope('outOfScope', index, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeScopeItem('outOfScope', index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} className="bg-primary">
            <Save className="w-4 h-4 mr-2" />
            Сохранить изменения
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
