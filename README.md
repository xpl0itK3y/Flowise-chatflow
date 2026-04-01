# Flowise SEO MVP

Минимальный MVP для генерации SEO-контента через Flowise Prediction API и NestJS endpoint со streaming-ответом.

## Что внутри

- `flowise/seo-generator-flow.json` - экспорт chatflow с prompt template, LLM chain и structured output schema.
- `src/seo/seo.controller.ts` - `POST /api/generate-seo`.
- `src/seo/seo.service.ts` - вызов Flowise API, таймаут, проверка пустого ответа и JSON.
- `.env.example` - переменные среды.

## Требования

- Node.js 20+
- Запущенный Flowise instance
- Chatflow, импортированный из `flowise/seo-generator-flow.json`

## Запуск

1. Установить зависимости:

```bash
npm install
```

2. Подготовить окружение:

```bash
cp .env.example .env
```

3. Заполнить `.env`:

```dotenv
PORT=3000
FLOWISE_BASE_URL=http://localhost:3001
FLOWISE_CHATFLOW_ID=<your-chatflow-id>
FLOWISE_API_KEY=
```

4. Запустить приложение:

```bash
npm run start:dev
```

## Endpoint

`POST /api/generate-seo`

Request body:

```json
{
  "product_name": "Беспроводные наушники AirSound X",
  "category": "Наушники",
  "keywords": [
    "беспроводные наушники",
    "bluetooth наушники",
    "наушники для спорта"
  ]
}
```

Пример запроса:

```bash
curl -N -X POST http://localhost:3000/api/generate-seo \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Беспроводные наушники AirSound X",
    "category": "Наушники",
    "keywords": [
      "беспроводные наушники",
      "bluetooth наушники",
      "наушники для спорта"
    ]
  }'
```

Успешный ответ приходит как `application/x-ndjson`:

```json
{"type":"meta","status":"started"}
{"type":"title","value":"..."}
{"type":"meta_description","value":"..."}
{"type":"h1","value":"..."}
{"type":"description","value":"..."}
{"type":"bullets","value":["...","..."]}
{"type":"done","status":"completed"}
```

## Ошибки

Поддержаны базовые edge cases:

- timeout Flowise/LLM: `504 Gateway Timeout`
- Flowise недоступен или вернул неуспешный HTTP: `502 Bad Gateway`
- пустой ответ от LLM: `502 Bad Gateway`
- невалидный JSON от LLM: `502 Bad Gateway`
- невалидный request body: `400 Bad Request`

Пример ошибки:

```json
{
  "statusCode": 504,
  "error": "GatewayTimeoutException",
  "message": "Flowise response timed out after 25000ms"
}
```

## Почему без чанкинга документов

В этом кейсе чанкинг не использовался, потому что задача не про retrieval по документам, а про генерацию контента на основе коротких структурированных входных данных. Поэтому основной акцент сделан на prompt template, structured output и валидацию ответа модели.

## Notes

- Flowise streaming не используется напрямую; endpoint сначала получает валидный ответ, после чего отдает его клиенту чанками.
- Если ваша версия Flowise использует другой формат Prediction API ответа, адаптация делается в `src/seo/seo.service.ts`.
