// import { useState, useEffect } from 'react';
// import { Users, Circle } from 'lucide-react';
// import { Badge } from './ui/badge';
//
// interface Collaborator {
//   id: string;
//   name: string;
//   avatar: string;
//   status: string;
//   color: string;
// }
//
// interface CollaborationIndicatorProps {
//   sectionId?: string;
// }
//
// export const CollaborationIndicator = ({ sectionId }: CollaborationIndicatorProps) => {
//   const [collaborators] = useState<Collaborator[]>([
//     {
//       id: '1',
//       name: 'Асем Нурланова',
//       avatar: 'АН',
//       status: 'Читает описание проекта',
//       color: 'bg-purple-500'
//     }
//   ]);
//
//   const [currentStatus, setCurrentStatus] = useState(collaborators[0].status);
//   const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
//
//   const statuses = [
//     { text: 'Читает описание проекта', section: 'description' },
//     { text: 'Редактирует цели и задачи', section: 'goals' },
//     { text: 'Добавляет Use Cases', section: 'use-cases' },
//     { text: 'Просматривает диаграммы', section: 'diagrams' },
//     { text: 'Комментирует KPI', section: 'kpi' },
//     { text: 'Анализирует Scope проекта', section: 'scope' },
//   ];
//
//   useEffect(() => {
//     let currentIndex = 0;
//
//     const interval = setInterval(() => {
//       currentIndex = (currentIndex + 1) % statuses.length;
//       const newStatus = statuses[currentIndex];
//       setCurrentStatus(newStatus.text);
//       setHighlightedSection(newStatus.section);
//
//       // Remove highlight after 3 seconds
//       setTimeout(() => {
//         setHighlightedSection(null);
//       }, 3000);
//     }, 12000); // Change every 12 seconds
//
//     return () => clearInterval(interval);
//   }, []);
//
//   // Apply highlight effect to section
//   useEffect(() => {
//     if (highlightedSection) {
//       const element = document.getElementById(highlightedSection);
//       if (element) {
//         element.style.transition = 'all 0.5s ease';
//         element.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
//         element.style.borderLeft = '4px solid rgb(139, 92, 246)';
//         element.style.paddingLeft = '16px';
//
//         setTimeout(() => {
//           element.style.backgroundColor = '';
//           element.style.borderLeft = '';
//           element.style.paddingLeft = '';
//         }, 3000);
//       }
//     }
//   }, [highlightedSection]);
//
//   return (
//     <div className="fixed bottom-6 right-6 z-50">
//       {/* Floating indicator */}
//       <div className="bg-card border-2 border-primary/30 rounded-full shadow-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-500">
//         <div className="flex -space-x-2">
//           {collaborators.map((collab) => (
//             <div
//               key={collab.id}
//               className={`relative w-10 h-10 rounded-full ${collab.color} flex items-center justify-center text-white font-semibold text-sm border-2 border-card`}
//               title={collab.name}
//             >
//               {collab.avatar}
//               <Circle className="absolute -bottom-1 -right-1 w-4 h-4 text-green-500 fill-green-500 animate-pulse" />
//             </div>
//           ))}
//         </div>
//
//
//       </div>
//
//       {/* Expanded view on hover */}
//       <div className="hidden group-hover:block absolute bottom-full right-0 mb-4 bg-card border rounded-lg shadow-xl p-4 w-80">
//         <h3 className="font-semibold mb-3 flex items-center gap-2">
//           <Users className="w-4 h-4" />
//           Активные участники
//         </h3>
//         {collaborators.map((collab) => (
//           <div key={collab.id} className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg">
//             <div className={`w-10 h-10 rounded-full ${collab.color} flex items-center justify-center text-white font-semibold`}>
//               {collab.avatar}
//             </div>
//             <div className="flex-1">
//               <div className="font-medium">{collab.name}</div>
//               <div className="text-sm text-muted-foreground">{currentStatus}</div>
//             </div>
//             <Circle className="w-3 h-3 text-green-500 fill-green-500" />
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
