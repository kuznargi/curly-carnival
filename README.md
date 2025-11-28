# AI Business Analyst 

**AI-помощник бизнес-аналитика**, который превращает идею в полноценный документ требований с KPI, Use Cases и Mermaid-диаграммами.


## Что это?

Полноценный AI Business Analyst, который:
- Понимает запросы на русском языке
- Генерирует структурированный документ требований
- Рисует BPMN, Sequence и Customer Journey диаграммы
- Валидирует качество требований
- Поддерживает загрузку PDF/DOCX/XLSX
- Экспорт в HTML → PDF

## Стек

### Backend
- **FastAPI** — API
- **Google Gemini 1.5 Flash/Pro** — мозг
- **SQLite** (в проде легко заменить на PostgreSQL)
- **PyMuPDF, python-docx, openpyxl** — парсинг файлов

### Frontend
- **React 18 + TypeScript**
- **Vite** — молниеносная сборка
- **Tailwind CSS + ShadCN/ui** — современный и красивый UI
- **React Router v6** — навигация
- **Lucide Icons** — иконки
- **Mermaid.js** — отрисовка диаграмм
- **Sonner** — красивые тосты
- **Zustand / Context** — управление состоянием

## Демо (скоро будет)
→ [https://curly-carnival-phi.vercel.app/](https://curly-carnival-phi.vercel.app/)

## Как запустить локально (2 терминала)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

pip install -r requirements.txt
touch .env
```
# Вставь свой GEMINI_API_KEY в .env

```bash
uvicorn main:app --reload
Backend запустится на: http://localhost:8000
Swagger: http://localhost:8000/docs
2. Frontend
Bashcd frontend
npm install
npm run dev
```
