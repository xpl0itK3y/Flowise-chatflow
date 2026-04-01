# Flowise SEO MVP

Минимальный MVP для генерации SEO-контента через Flowise Prediction API и NestJS endpoint со streaming-ответом.

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

`.env` загружается автоматически через `@nestjs/config`.

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
