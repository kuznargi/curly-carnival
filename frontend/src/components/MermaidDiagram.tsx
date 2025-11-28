import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  isDark?: boolean;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, title, isDark = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!chart || !containerRef.current) return;

  // ЖЁСТКАЯ НОРМАЛИЗАЦИЯ — УБИВАЕТ ВСЕ НЕВИДИМЫЕ СИМВОЛЫ
  const normalizedChart = chart
    .replace(/\r\n/g, '\n')        // Windows → Unix
    .replace(/\r/g, '\n')          // Старые Mac
    .replace(/\uFEFF/g, '')        // BOM
    .replace(/\u200B/g, '')        // Zero-width space
    .replace(/^\s*[\r\n]+/gm, '')  // Убираем пустые строки и отступы в начале
    .replace(/^\s+/gm, '')         // Убираем все пробелы в начале строк
    .trim();

  // Дополнительная защита: гарантируем, что после "flowchart TD" идёт \n
  const finalChart = normalizedChart.replace(
    /^(flowchart\s+(TD|LR|RL|BT|TB|RL|LR))(\s+)/gim,
    '$1\n'
  );

  containerRef.current.innerHTML = '';
  containerRef.current.removeAttribute('data-processed');

  // Инициализация — ОДНАЖДЫ! (не в useEffect!)
  // Если вы инициализируете каждый раз — Mermaid ломается
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: isDark ? 'dark' : 'default',
    fontFamily: 'inherit',
    flowchart: { useMaxWidth: true, htmlLabels: true },
    bpmn: { useMaxWidth: true }
  });

  const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  mermaid.render(id, finalChart)
    .then(({ svg }) => {
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
      }
    })
    .catch((err) => {
      console.error('Mermaid render failed:', err);
      containerRef.current!.innerHTML = `
        <div style="padding:20px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#991b1b;">
          <strong>Ошибка Mermaid</strong><br/>
          ${err.message || 'Неизвестная ошибка'}
          <details style="margin-top:10px;">
            <summary style="cursor:pointer;font-weight:bold;">Показать код</summary>
            <pre style="background:#f9fafb;padding:10px;margin:10px 0;border-radius:6px;overflow:auto;font-size:11px;max-height:300px;">${finalChart.replace(/</g, '&lt;')}</pre>
          </details>
        </div>`;
    });
}, [chart, isDark]);

  return (
    <div className="mermaid-diagram-wrapper" style={{ minHeight: '200px' }}>
      {title && (
        <h3 style={{
          marginBottom: '16px',
          fontSize: '18px',
          fontWeight: '600',
          color: isDark ? '#f1f5f9' : '#1f2937'
        }}>
          {title}
        </h3>
      )}
      <div
        ref={containerRef}
        className="mermaid-diagram-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          padding: '20px',
          background: isDark ? '#1f2937' : '#f9fafb',
          borderRadius: '8px',
          border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
        }}
      />
    </div>
  );
};

export default MermaidDiagram;
export { MermaidDiagram };
