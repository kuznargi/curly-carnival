#!/bin/bash
# Тест API endpoint для генерации диаграмм

echo "🧪 Тестируем API endpoint /api/diagrams/generate"
echo "=================================================="

# Тестовый запрос
curl -X POST http://localhost:8000/api/diagrams/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Процесс кредитования: подача заявки, проверка кредитной истории, оценка рисков, принятие решения, выдача кредита",
    "diagram_type": "flowchart"
  }' \
  2>/dev/null | python3 -c "
import sys, json
response = json.load(sys.stdin)
print('\n✅ API вернул ответ:')
print('Тип диаграммы:', response.get('diagram_type'))
print('\n📊 Mermaid код:')
print('=' * 60)
print(response.get('mermaid_code', 'ERROR: No mermaid_code'))
print('=' * 60)

# Проверяем структуру
code = response.get('mermaid_code', '')
lines = code.split('\n')

if lines and (lines[0].startswith('flowchart') or lines[0].startswith('graph')):
    print('\n✅ Структура валидна: direction на первой строке')
else:
    print('\n❌ ОШИБКА: Неправильная структура')
    sys.exit(1)

# Проверяем порядок
has_arrow = False
for line in lines[1:]:
    if '-->' in line or '---' in line:
        has_arrow = True
    elif has_arrow and any(c in line for c in ['[', '(', '{']):
        print('❌ ОШИБКА: Объявление узла после стрелки!')
        sys.exit(1)

print('✅ Порядок правильный: узлы перед стрелками')
print('\n🎉 ТЕСТ ПРОЙДЕН!')
" || echo -e "\n❌ API endpoint не работает"
