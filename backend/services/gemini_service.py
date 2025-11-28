import google.generativeai as genai
import json
import re
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from config import settings

class GeminiService:
    """Service for interacting with Google Gemini API"""
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required. Please set it in .env file")

        # Configure Gemini API with real key
        genai.configure(api_key=self.api_key)
        self.model_flash = genai.GenerativeModel('gemini-2.5-flash')
        self.model_pro = genai.GenerativeModel('gemini-2.5-pro')

        self.logger = logging.getLogger(__name__)
        self.logger.info("✅ Gemini API initialized successfully")
        
        # Generation configs
        self.chat_config = genai.types.GenerationConfig(
            temperature=0.7,
            top_p=0.9,
            top_k=20,
            max_output_tokens=2048,
        )
        
        self.structured_config = genai.types.GenerationConfig(
            temperature=0.3,
            top_p=0.8,
            top_k=10,
            max_output_tokens=4096,
        )
    
    async def chat_completion(
        self,
        prompt: str,
        context: List[Dict] = None,
        temperature: float = 0.7
    ) -> str:
        """
        Отправить сообщение в Gemini и получить ответ для чата
        """
        system_prompt = """
Ты - AI Business Analyst для банка ForteBank в Казахстане.
Твоя задача - собирать бизнес-требования через профессиональный диалог.

ВАЖНО:
- Задавай уточняющие вопросы только если информация отсутствует
- НЕ задавай повторно вопросы на которые пользователь уже ответил
- Анализируй всю историю диалога перед ответом
- После сбора основной информации (цели, пользователи, функции) переходи к деталям
- Будь профессионален, но дружелюбен
- Отвечай на русском языке

ТВОЯ РОЛЬ:
- Задавай уточняющие вопросы о целях проекта
- Выясняй стейкхолдеров и их потребности
- Собирай функциональные и нефункциональные требования
- Определяй ограничения и риски
- Помогай структурировать требования

СТИЛЬ ОБЩЕНИЯ:
- Используй банковскую терминологию корректно
- Структурируй вопросы логично
- Не задавай более 2-3 вопросов за раз
- Подтверждай понимание важных моментов
- Избегай повторения вопросов

ФОКУС НА:
- Бизнес-цели и KPI
- Пользовательские сценарии
- Интеграции и техническая архитектура
- Сроки и ресурсы
- Соответствие регулятивным требованиям
"""
        
        # Форматируем контекст из истории чата
        full_prompt = system_prompt + "\n\n"
        
        if context:
            full_prompt += "КОНТЕКСТ БЕСЕДЫ:\n"
            # Берем только последние 10 сообщений для экономии токенов
            recent_context = context[-10:] if len(context) > 10 else context
            for msg in recent_context:
                role = "Клиент" if msg.get("role") == "user" else "Аналитик"
                full_prompt += f"{role}: {msg.get('content', '')}\n"
            full_prompt += "\n"
        
        full_prompt += f"Клиент: {prompt}\nАналитик:"
        
        try:
            response = await self._call_with_retry(
                self.model_flash.generate_content,
                full_prompt,
                generation_config=self.chat_config
            )

            return response.text.strip()
            
        except Exception as e:
            self.logger.error(f"Gemini chat completion error: {e}")
            return "Извините, произошла ошибка при обработке вашего запроса. Попробуйте еще раз."
    
    async def generate_document(self, chat_history: List[Dict]) -> Dict:
        """
        Сгенерировать полный документ бизнес-требований на основе истории чата
        """
        chat_text = self._format_chat_history(chat_history)
        
        prompt = f"""
Ты - эксперт по написанию бизнес-требований. На основе диалога с клиентом создай ДЕТАЛЬНЫЙ документ.

ДИАЛОГ С КЛИЕНТОМ:
{chat_text}

КРИТИЧЕСКИ ВАЖНО:
1. Если клиент назвал проект (например "Project Alpha", "CRM для банка", "Мобильное приложение доставки") - используй ТОЧНОЕ название в projectName
2. Если клиент указал конкретные цели (например "Увеличить вовлеченность на 20%", "Автоматизировать процесс") - используй ИХ ТОЧНЫЕ формулировки в goals
3. Если клиент описал функции - перенеси их в useCases с деталями
4. НЕ используй общие фразы типа "Определить цели проекта" или "Требует уточнения" - ТОЛЬКО конкретика из диалога

СТРУКТУРА JSON:
{{
  "projectName": "ТОЧНОЕ название из диалога (не 'Новый проект'!)",
  "description": {{"paragraphs": ["конкретное описание из диалога", "детали проекта", "контекст и цели"]}},
  "goals": [{{"text": "КОНКРЕТНАЯ цель из диалога (не заглушка!)", "priority": "high|medium|low"}}],
  "scope": {{"inScope": ["конкретные функции из диалога"], "outOfScope": ["что точно не входит"]}},
  "businessRules": [{{"id": "BR001", "title": "название", "description": "конкретное правило", "priority": "high|medium|low"}}],
  "useCases": [{{"id": "UC001", "title": "конкретный сценарий", "actor": "роль пользователя", "preconditions": ["что должно быть"], "mainScenario": ["шаг 1: детально", "шаг 2: детально", "шаг 3: детально"], "postconditions": "результат"}}],
  "kpis": [{{"name": "измеримая метрика", "current": текущее_число, "target": целевое_число, "unit": "единица измерения"}}]
}}

ПРАВИЛА ЗАПОЛНЕНИЯ:
- projectName: Если клиент сказал "хочу создать CRM" -> "CRM система", если "Project Alpha" -> "Project Alpha"
- goals: Если клиент сказал "увеличить продажи на 30%" -> {{"text": "Увеличить продажи на 30%", "priority": "high"}}
- useCases: Минимум 3-5 детальных сценариев с 5-10 шагами каждый
- kpis: Реальные числа если упомянуты ("рост на 20%" -> current: 100, target: 120)

ЗАПРЕЩЕНО использовать:
❌ "Определить цели проекта"
❌ "Новый проект"
❌ "Требует уточнения"
❌ "Будет определено позже"
❌ Любые заглушки

Верни ТОЛЬКО валидный JSON без markdown блоков.
"""
        
        try:
            response = await self._call_with_retry(
                self.model_flash.generate_content,
                prompt,
                generation_config=self.structured_config
            )
            
            # Извлечь и распарсить JSON
            json_str = self._extract_json_from_text(response.text)
            self.logger.info(f"Extracted JSON string (first 500 chars): {json_str[:500]}")

            document = json.loads(json_str)
            self.logger.info(f"Parsed document: projectName='{document.get('projectName')}', goals count={len(document.get('goals', []))}")

            # Заполнить отсутствующие поля значениями по умолчанию
            document_before = document.copy()
            document = self._ensure_all_fields(document, chat_history)

            # Логируем что изменилось
            if document.get('projectName') != document_before.get('projectName'):
                self.logger.warning(f"ProjectName was replaced: '{document_before.get('projectName')}' -> '{document.get('projectName')}'")

            return document
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON from Gemini: {e}")
            return self._get_fallback_document(chat_history)
        except Exception as e:
            self.logger.error(f"Document generation error: {e}")
            return self._get_fallback_document(chat_history)
    
    async def validate_document(self, document: Dict) -> Dict:
        """
        Проанализировать качество документа требований
        """
        doc_str = json.dumps(document, ensure_ascii=False, indent=2)
        
        prompt = f"""
Проанализируй документ бизнес-требований и оцени качество по 4 критериям (0-100%):

1. ПОЛНОТА (completeness): все ли секции заполнены, достаточно ли информации
2. ЯСНОСТЬ (clarity): понятность формулировок, отсутствие двусмысленности  
3. ДЕТАЛИЗАЦИЯ (detail): достаточно ли деталей для реализации
4. СОГЛАСОВАННОСТЬ (consistency): нет ли противоречий между секциями

Также найди конкретные проблемы с указанием секции и возможности исправления.

ДОКУМЕНТ:
{doc_str}

ФОРМАТ ОТВЕТА JSON:
{{
  "qualityScore": {{
    "health": число_от_0_до_100,
    "completeness": число_от_0_до_100,
    "clarity": число_от_0_до_100,
    "detail": число_от_0_до_100,
    "consistency": число_от_0_до_100
  }},
  "issues": [
    {{
      "text": "описание проблемы",
      "severity": "high|medium|low",
      "section": "название секции",
      "fixable": true/false
    }}
  ]
}}

health = среднее арифметическое остальных 4 метрик.
Верни ТОЛЬКО JSON.
"""
        
        try:
            response = await self._call_with_retry(
                self.model_flash.generate_content,
                prompt,
                generation_config=self.structured_config
            )
            
            json_str = self._extract_json_from_text(response.text)
            validation = json.loads(json_str)
            
            return validation
            
        except Exception as e:
            self.logger.error(f"Document validation error: {e}")
            return self._get_fallback_validation()

    async def generate_diagram(self, description: str, diagram_type: str) -> str:
        """
        Сгенерировать Mermaid диаграмму
        """
        prompts = {
            "flowchart": f"""
        Создай Mermaid flowchart диаграмму для процесса: {description}

        КРИТИЧЕСКИ ВАЖНО! Mermaid 10.9.5 требует СТРОГИЙ порядок:

        ТЫ ОБЯЗАН генерировать код СТРОГО В ЭТОМ ПОРЯДКЕ (иначе парсер упадёт):

        1. flowchart TD
        2. Пустая строка
        3. ВСЕ узлы подряд (включая start и end)
        4. Пустая строка
        5. ВСЕ стрелки

        ПРАВИЛЬНЫЙ ПРИМЕР (копируй этот стиль):
        flowchart TD

            start((Начало))
            A[Открыть приложение]
            B[Просмотреть рестораны]
            C[Выбрать ресторан]
            D[Изучить меню]
            E[Добавить в корзину]
            F{{Готов оформить?}}
            G[Подтвердить заказ]
            H[Оплата и обработка]
            I[Отслеживание доставки]
            end((Конец))

            start --> A
            A --> B
            B --> C
            C --> D
            D --> E
            E --> F
            F -->|Нет| E
            F -->|Да| G
            G --> H
            H --> I
            I --> end

        Создай 8–12 узлов. Используй кириллицу. 
        Верни ТОЛЬКО код, без ```mermaid, без пояснений, без комментариев %%.
        """,

            "sequenceDiagram": f"""
        Создай Mermaid sequenceDiagram в Mermaid для сценария:
        {description}

        Используй русские названия участников и сообщений.
        Верни ТОЛЬКО код, начиная со строки "sequenceDiagram", без ``` и пояснений.
        """,

            "journey": f"""
        Создай user journey диаграмму в Mermaid для:
        {description}

        Покажи этапы, действия пользователя, эмоции и точки контакта.
        Верни ТОЛЬКО код, начиная со строки "journey", без ``` и пояснений.
        """,

            "erDiagram": f"""
        Создай ER-диаграмму в Mermaid для:
        {description}

        Определи сущности, атрибуты (PK, FK), связи (||--o,|--|| и т.д.).
        Используй русские названия сущностей и полей.
        Верни ТОЛЬКО код, начиная со строки "erDiagram", без ``` и пояснений.
        """,

            # НОВЫЙ — BPMN РАБОТАЕТ СРАЗУ ПОСЛЕ ЭТОГО
            "bpmn": f"""
        Создай BPMN 2.0 диаграмму в синтаксисе Mermaid для процесса:
        {description}

        ПРАВИЛА:
        - Начинай строго со строки: bpmnDiagram
        - Используй только поддерживаемые элементы: 
          StartEvent, EndEvent, Task, UserTask, ServiceTask, ExclusiveGateway, ParallelGateway, SequenceFlow, MessageFlow
        - Русский текст внутри названий задач и шлюзов
        - Участники через participant (если нужно)
        - Никаких --> стрелок — только SequenceFlow

        Пример:
        bpmnDiagram
            startEvent "Начало" as start
            task "Открыть приложение" as task1
            userTask "Выбрать блюда" as task2
            exclusiveGateway "Готов оплатить?" as gw1
            serviceTask "Обработка платежа" as task3
            endEvent "Заказ принят" as end

            start --> task1
            task1 --> task2
            task2 --> gw1
            gw1 -->|Да| task3
            gw1 -->|Нет| task2
            task3 --> end

        Создай полную диаграмму с 8–15 элементами.
        Верни ТОЛЬКО чистый код BPMN, без ```bpmn, без пояснений.
        """
        }
        prompt = prompts.get(diagram_type, prompts["flowchart"])

        try:
            response = await self._call_with_retry(
                self.model_flash.generate_content,
                prompt,
                generation_config=self.structured_config
            )

            mermaid_code = self._clean_mermaid_code(response.text)
            return mermaid_code

        except Exception as e:
            self.logger.error(f"Diagram generation error: {e}")
            return f"graph TD\n    A[Ошибка генерации] --> B[Попробуйте еще раз]"

    async def analyze_file(self, file_content: str) -> Dict:
        """
        Проанализировать содержимое файла и извлечь требования
        """
        # Ограничиваем размер текста для Gemini (макс ~50k символов)
        if len(file_content) > 50000:
            file_content = file_content[:50000] + "...[текст обрезан]"
        
        prompt = f"""
Проанализируй этот документ и извлеки структурированную информацию:

1. Название проекта
2. Цели проекта (массив строк)
3. Бизнес-требования (массив строк)
4. Стейкхолдеры (массив строк)
5. Описание функционала

ТЕКСТ ДОКУМЕНТА:
{file_content}

ФОРМАТ ОТВЕТА JSON:
{{
  "projectName": "название или 'Неизвестный проект'",
  "goals": ["цель 1", "цель 2"],
  "requirements": ["требование 1", "требование 2"],
  "stakeholders": ["стейкхолдер 1", "стейкхолдер 2"],
  "description": "краткое описание функционала"
}}

Если информации недостаточно - используй разумные предположения.
Верни ТОЛЬКО JSON.
"""
        
        try:
            response = await self._call_with_retry(
                self.model_pro.generate_content,  # Используем Pro для анализа файлов
                prompt,
                generation_config=self.structured_config
            )
            
            json_str = self._extract_json_from_text(response.text)
            analysis = json.loads(json_str)
            
            return analysis
            
        except Exception as e:
            self.logger.error(f"File analysis error: {e}")
            return {
                "projectName": "Неизвестный проект",
                "goals": ["Анализ файла не удался"],
                "requirements": ["Требует ручной обработки"],
                "stakeholders": ["Не определены"],
                "description": "Ошибка при анализе файла"
            }
    
    async def improve_section(self, section_text: str, issue_description: str) -> str:
        """
        Улучшить секцию документа на основе выявленной проблемы
        """
        prompt = f"""
Улучши эту секцию документа, устранив указанную проблему:

ТЕКУЩИЙ ТЕКСТ СЕКЦИИ:
{section_text}

ПРОБЛЕМА ДЛЯ ИСПРАВЛЕНИЯ:
{issue_description}

ТРЕБОВАНИЯ К УЛУЧШЕНИЮ:
- Сохрани смысл и структуру
- Сделай текст более ясным и детальным
- Устрани указанную проблему
- Используй профессиональную терминологию
- Добавь конкретные детали если нужно

Верни ТОЛЬКО улучшенный текст, без пояснений и комментариев.
"""
        
        try:
            response = await self._call_with_retry(
                self.model_flash.generate_content,
                prompt,
                generation_config=self.chat_config
            )
            
            return response.text.strip()
            
        except Exception as e:
            self.logger.error(f"Section improvement error: {e}")
            return section_text  # Вернуть оригинал при ошибке
    
    # Utility methods
    
    async def _call_with_retry(self, func, *args, **kwargs):
        """Вызов API с retry логикой"""
        max_retries = settings.GEMINI_MAX_RETRIES
        
        for attempt in range(max_retries):
            try:
                # Для async функций
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                
                self.logger.info(f"Gemini API call successful on attempt {attempt + 1}")
                return result
                
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                
                wait_time = (2 ** attempt)  # Exponential backoff
                self.logger.warning(f"Gemini API call failed (attempt {attempt + 1}): {e}. Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
    
    def _extract_json_from_text(self, text: str) -> str:
        """Извлечь JSON из текста, убрав markdown блоки"""
        # Убираем markdown блоки всех типов
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```JSON\s*', '', text)
        text = re.sub(r'```\s*', '', text)

        # Убираем комментарии в JSON (хотя они недопустимы, Gemini может их добавить)
        text = re.sub(r'//.*?\n', '\n', text)
        text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)

        # Ищем JSON объект (самый внешний {})
        stack = []
        start = -1
        for i, char in enumerate(text):
            if char == '{':
                if not stack:
                    start = i
                stack.append(char)
            elif char == '}':
                if stack:
                    stack.pop()
                    if not stack and start != -1:
                        # Нашли полный JSON объект
                        json_str = text[start:i+1]
                        # Убираем trailing commas перед } и ]
                        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
                        return json_str

        # Если не нашли - пробуем regex
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            # Убираем trailing commas
            json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
            return json_str

        # Если совсем ничего - возвращаем как есть
        return text.strip()

    def _clean_mermaid_code(self, text: str) -> str:
        """
        Жёсткая очистка и переупорядочивание Mermaid-кода.
        Гарантирует, что для flowchart все узлы идут строго ДО всех стрелок.
        Остальные типы диаграмм (sequence, journey, erDiagram, bpmnDiagram) НЕ трогает.
        """
        self.logger.info("Cleaning Mermaid code...")

        # Убираем ```mermaid, ```bpmn и прочие блоки
        text = re.sub(r'```(?:mermaid|bpmn|flowchart|sequence|journey|er)?\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'```\s*', '', text)

        # Убираем комментарии %%
        text = re.sub(r'%%.*$', '', text, flags=re.MULTILINE)

        lines = [line.rstrip() for line in text.split('\n') if line.strip()]
        if not lines:
            return "flowchart TD\n\nA[Ошибка генерации]\n\n"

        first_line_raw = lines[0].strip()
        first_line_lower = first_line_raw.lower()

        # НЕ ТРОГАЕМ ничего кроме flowchart и graph!
        non_flowchart_prefixes = ['sequencediagram', 'journey', 'erdiagram', 'bpmndiagram']
        if any(first_line_lower.startswith(p) for p in non_flowchart_prefixes):
            self.logger.info(f"Non-flowchart диаграмма обнаружена: {first_line_raw} → возвращаем без изменений")
            return '\n'.join(lines) + '\n'

        # Если это явно не flowchart — тоже не ломаем
        if not (first_line_lower.startswith('flowchart') or first_line_lower.startswith('graph')):
            self.logger.info(f"Не flowchart, пропускаем переупорядочивание: {first_line_raw}")
            return '\n'.join(lines) + '\n'

        self.logger.info(f"Обрабатываем flowchart ({len(lines)} строк)")

        direction_line = lines[0]  # flowchart TD или graph TD

        node_declarations: list[str] = []
        edge_declarations: list[str] = []

        # САМАЯ НАДЁЖНАЯ РЕГУЛЯРКА — ловит ВСЁ:
        # A[Текст], B((Круг)), C{{Ромб}}, start((Начало)), end((Конец))
        # ФИНАЛЬНАЯ РАБОЧАЯ РЕГУЛЯРКА — РЕШАЕТ ПРОБЛЕМУ С end((Конец)) НАВСЕГДА
        node_pattern = re.compile(r'^([a-zA-Z_]\w*)\s*(?:[\[\(\{]| \(\()')
        edge_pattern = re.compile(r'-->|===|==|\.\.|--|->|<->|\|', re.IGNORECASE)
        for i, raw_line in enumerate(lines[1:], start=2):
            line = raw_line.strip()
            if not line:
                continue

            if edge_pattern.match(line):
                edge_declarations.append(line)
            elif node_pattern.match(line):
                node_declarations.append(line)
            else:
                # Эвристика: если уже есть стрелки — скорее всего это тоже стрелка
                if edge_declarations:
                    edge_declarations.append(line)
                else:
                    node_declarations.append(line)

        self.logger.info(f"Распознано: {len(node_declarations)} узлов, {len(edge_declarations)} стрелок")

        # Сборка в строгом порядке
        result: list[str] = [direction_line]

        if node_declarations:
            result.append('')  # пустая строка
            result.extend(node_declarations)

        if edge_declarations:
            result.append('')  # пустая строка
            result.extend(edge_declarations)

        final_code = '\n'.join(result) + '\n'

        # Финальная валидация
        final_lines = final_code.split('\n')
        edge_started = False
        for line in final_lines:
            if any(arrow in line for arrow in ['-->', '--', '===', '==', '..', '->', '<->']):
                edge_started = True
            elif edge_started and any(bracket in line for bracket in ['[', '((', '{{', '()', ']', '))', '}}']):
                self.logger.error(f"УЗЕЛ ПОСЛЕ СТРЕЛКИ: {line}")
                # Принудительно кидаем ошибку, чтобы видеть в логах
            raise ValueError("Mermaid code invalid: node declared after edge")


        self.logger.info(f"Готово: {len(final_lines)} строк")
        return final_code
    def _format_chat_history(self, history: List[Dict]) -> str:
        """Форматировать историю чата для промпта"""
        formatted = []
        for msg in history:
            role = "Клиент" if msg.get("role") == "user" else "Аналитик"
            content = msg.get("content", "")
            formatted.append(f"{role}: {content}")
        
        return "\n".join(formatted)
    
    def _ensure_all_fields(self, document: Dict, chat_history: List[Dict]) -> Dict:
        """Убедиться что все обязательные поля присутствуют, заполнить недостающие"""
        # Извлечь название проекта из истории если отсутствует
        if "projectName" not in document or not document["projectName"]:
            # Попытаться извлечь из первых сообщений
            first_messages = " ".join([msg.get("content", "") for msg in chat_history[:3]])
            document["projectName"] = self._extract_project_name(first_messages)

        # Description
        if "description" not in document or not document.get("description"):
            document["description"] = {
                "paragraphs": [
                    "Проект находится на стадии проработки требований.",
                    "Необходимо дополнить описание на основе дальнейшего обсуждения."
                ]
            }
        elif isinstance(document["description"], dict) and "paragraphs" not in document["description"]:
            document["description"]["paragraphs"] = ["Описание будет дополнено"]
        elif not isinstance(document["description"], dict):
            document["description"] = {"paragraphs": [str(document["description"])]}

        # Goals
        if "goals" not in document or not document["goals"]:
            document["goals"] = [
                {"text": "Определить цели проекта", "priority": "high"},
                {"text": "Уточнить требования с заказчиком", "priority": "high"}
            ]

        # Scope
        if "scope" not in document or not document["scope"]:
            document["scope"] = {
                "inScope": ["Требует уточнения"],
                "outOfScope": ["Будет определено позже"]
            }
        else:
            if "inScope" not in document["scope"]:
                document["scope"]["inScope"] = ["Требует уточнения"]
            if "outOfScope" not in document["scope"]:
                document["scope"]["outOfScope"] = ["Будет определено позже"]

        # Business Rules
        if "businessRules" not in document or not document["businessRules"]:
            document["businessRules"] = [
                {
                    "id": "BR001",
                    "title": "Основные правила",
                    "description": "Требуется определить бизнес-правила проекта",
                    "priority": "medium"
                }
            ]

        # Use Cases
        if "useCases" not in document or not document["useCases"]:
            document["useCases"] = [
                {
                    "id": "UC001",
                    "title": "Базовый сценарий использования",
                    "actor": "Пользователь",
                    "preconditions": ["Требует детализации"],
                    "mainScenario": [
                        "Пользователь запускает систему",
                        "Выполняет основные действия",
                        "Получает результат"
                    ],
                    "postconditions": "Требует уточнения"
                }
            ]

        # KPIs
        if "kpis" not in document or not document["kpis"]:
            document["kpis"] = [
                {
                    "name": "Готовность проекта",
                    "current": 30,
                    "target": 100,
                    "unit": "%"
                }
            ]

        return document

    def _extract_project_name(self, text: str) -> str:
        """Извлечь название проекта из текста"""
        text_lower = text.lower()
        # Простая эвристика
        if "crm" in text_lower:
            return "CRM система"
        elif "доставк" in text_lower:
            return "Система доставки"
        elif "мобильн" in text_lower and "приложен" in text_lower:
            return "Мобильное приложение"
        elif "банк" in text_lower:
            return "Банковская система"
        else:
            return "Новый проект"
    
    def _get_fallback_document(self, chat_history: List[Dict]) -> Dict:
        """Резервный документ при ошибке генерации"""
        return {
            "projectName": "Новый проект",
            "description": {"paragraphs": ["Документ требует доработки"]},
            "goals": [{"text": "Определить цели проекта", "priority": "high"}],
            "scope": {"inScope": ["Требует уточнения"], "outOfScope": ["Требует уточнения"]},
            "businessRules": [{"id": "BR001", "title": "Требует доработки", "description": "Необходимо дополнить", "priority": "medium"}],
            "useCases": [{"id": "UC001", "title": "Базовый сценарий", "actor": "Пользователь", "preconditions": ["Требует уточнения"], "mainScenario": ["Требует детализации"], "postconditions": "Требует определения"}],
            "kpis": [{"name": "Готовность документа", "current": 30, "target": 100, "unit": "%"}]
        }
    
    def _get_fallback_validation(self) -> Dict:
        """Резервная валидация при ошибке"""
        return {
            "qualityScore": {
                "health": 50,
                "completeness": 50,
                "clarity": 50,
                "detail": 50,
                "consistency": 50
            },
            "issues": [
                {
                    "text": "Ошибка анализа качества. Требует ручной проверки.",
                    "severity": "high",
                    "section": "general",
                    "fixable": True
                }
            ]
        }