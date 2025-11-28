import { useState } from 'react';
import { FileText, Search, Filter, MoreVertical, Eye, Edit, Download, Trash2, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ProjectResponse } from '@/services/apiService';
import { useNavigate } from 'react-router-dom';

interface ProjectsTableProps {
  projects: ProjectResponse[];
  isLoading?: boolean;
}

export const ProjectsTable = ({ projects, isLoading = false }: ProjectsTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (project: ProjectResponse) => {
    // Mock status based on project age
    const daysSinceCreation = Math.floor((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceCreation > 7) {
      return <Badge variant="default">✅ Завершен</Badge>;
    } else if (daysSinceCreation > 3) {
      return <Badge variant="secondary">📝 В работе</Badge>;
    } else {
      return <Badge variant="destructive">⚠️ Требует внимания</Badge>;
    }
  };

  const getMockQualityScore = (project: ProjectResponse) => {
    // Mock quality score based on project name hash
    const hash = project.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 70 + (hash % 25); // Returns 70-95
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-card rounded-xl border p-4 md:p-6 lg:p-8 shadow-sm hover:shadow-md transition-smooth animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg md:text-xl font-bold">Последние проекты</h3>
        
        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[200px] md:w-[250px]"
            />
          </div>
          <Button variant="outline" size="icon" className="hover-scale">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted" />
          <p>{searchQuery ? 'Проекты не найдены' : 'Нет проектов'}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-muted-foreground">Название проекта</th>
                  <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-muted-foreground hidden sm:table-cell">Дата создания</th>
                 { //<th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-muted-foreground">Quality Score</th>
                  //<th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-muted-foreground hidden md:table-cell">Статус</th>

                  //<th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-muted-foreground">Действия</th>
                } </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, index) => {
                  const qualityScore = getMockQualityScore(project);
                  return (
                    <tr
                      key={project.id}
                      className="border-b hover:bg-muted/50 transition-smooth cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="py-3 md:py-4 px-2 md:px-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm md:text-base truncate">{project.name}</p>
                            <p className="text-xs text-muted-foreground truncate">Автор: AI Business Analyst</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 hidden sm:table-cell">
                        <div>
                          <p className="text-xs md:text-sm">{formatDate(project.created_at)}</p>
                          <p className="text-xs text-muted-foreground">{formatTime(project.created_at)}</p>
                        </div>
                      </td>
                      {
//                       <td className="py-3 md:py-4 px-2 md:px-4">
//                         <div className="flex items-center gap-1 md:gap-2">
//                           <div className={`text-xl md:text-2xl font-bold ${getScoreColor(qualityScore)}`}>
//                             {qualityScore}%
//                           </div>
//                         </div>
//                       </td>

//                       <td className="py-3 md:py-4 px-2 md:px-4 hidden md:table-cell">
//                         {getStatusBadge(project)}
//                       </td>
                      }
                      <td className="py-3 md:py-4 px-2 md:px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate('/document', { state: { projectId: project.id } })}>
                              <Eye className="w-4 h-4 mr-2" />
                              Открыть
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/chat')}>
                              <Edit className="w-4 h-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            {
//                             <DropdownMenuItem>
//                               <Download className="w-4 h-4 mr-2" />
//                               Экспорт
//                             </DropdownMenuItem>
//                             <DropdownMenuItem className="text-destructive">
//                               <Trash2 className="w-4 h-4 mr-2" />
//                               Удалить
//                             </DropdownMenuItem>
                            }
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
            <p className="text-xs md:text-sm text-muted-foreground">
              Показано {filteredProjects.length} из {projects.length} проектов
            </p>
            <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-center">
              <Button variant="outline" size="sm" disabled className="text-xs md:text-sm">
                ← Пред.
              </Button>
              <Button variant="default" size="sm" className="text-xs md:text-sm hover-scale">1</Button>
             <Button variant="outline" size="sm" className="text-xs md:text-sm">
                След. →
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
