import mermaid from 'mermaid';

export const initializeMermaid = (isDark: boolean) => {
  mermaid.initialize({
    startOnLoad: true,
    theme: isDark ? 'dark' : 'default',
    themeVariables: {
      primaryColor: '#0085CA',
      primaryTextColor: isDark ? '#F1F5F9' : '#1F2937',
      primaryBorderColor: '#0085CA',
      lineColor: '#6B7280',
      secondaryColor: '#F8E5E5',
      tertiaryColor: '#F9FAFB',
      fontSize: '16px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    securityLevel: 'loose',
    flowchart: {
      htmlLabels: true,
      curve: 'basis'
    }
  });
};

export const sampleDiagrams = {
  bpmn: `flowchart TD
    Start([Начало]) --> Input[Клиент подает заявку]
    Input --> Validate{Проверка данных}
    Validate -->|Валидно| Process[Обработка заявки]
    Validate -->|Невалидно| Reject[Отклонение]
    Process --> Review{Проверка оператором}
    Review -->|Одобрено| Approve[Одобрение заявки]
    Review -->|Отклонено| Reject
    Approve --> Notify[Уведомление клиента]
    Reject --> NotifyReject[Уведомление об отклонении]
    Notify --> End([Конец])
    NotifyReject --> End`,

  sequence: `sequenceDiagram
    participant Client as Клиент
    participant Mobile as Мобильное приложение
    participant API as API Gateway
    participant Service as Сервис обработки
    participant DB as База данных

    Client->>Mobile: Открывает приложение
    Mobile->>API: Запрос авторизации
    API->>Service: Проверка credentials
    Service->>DB: Запрос данных пользователя
    DB-->>Service: Возврат данных
    Service-->>API: Токен авторизации
    API-->>Mobile: Успешный вход
    Mobile-->>Client: Отображение интерфейса`,

  journey: `journey
    title Путь клиента в CRM системе
    section Регистрация
      Открыть сайт: 5: Клиент
      Заполнить форму: 3: Клиент
      Подтвердить email: 4: Клиент
    section Использование
      Создать заявку: 4: Клиент
      Ожидание обработки: 2: Клиент
      Получить результат: 5: Клиент
    section Поддержка
      Связаться с оператором: 4: Клиент
      Решение проблемы: 5: Оператор, Клиент`,

  er: `erDiagram
    USER ||--o{ REQUEST : creates
    USER {
        string id PK
        string name
        string email
        string phone
    }
    REQUEST ||--|{ DOCUMENT : contains
    REQUEST {
        string id PK
        string user_id FK
        string status
        datetime created_at
    }
    DOCUMENT {
        string id PK
        string request_id FK
        string type
        string url
    }
    OPERATOR ||--o{ REQUEST : processes
    OPERATOR {
        string id PK
        string name
        string department
    }`
};
