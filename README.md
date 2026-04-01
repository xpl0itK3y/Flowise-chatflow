# Flowise SEO MVP

MVP для генерации SEO-описания товара через Flowise и NestJS.

В репозитории:
- `flowise/seo-generator-flow.json` - экспорт рабочего chatflow с Prompt Template, LLM Chain и Advanced Structured Output Parser
- `POST /api/generate-seo` - NestJS endpoint со streaming-ответом

## Запуск

```bash
npm install
cp .env.example .env
npm run start:dev
```

`.env`:

```dotenv
PORT=3000
FLOWISE_BASE_URL=http://localhost:3001
FLOWISE_CHATFLOW_ID=<your-chatflow-id>
FLOWISE_API_KEY=
```

## Пример запроса

```bash
curl -N -X POST http://localhost:3000/api/generate-seo \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Беспроводные наушники AirSound X",
    "category": "Наушники",
    "keywords": ["беспроводные наушники", "bluetooth наушники", "наушники для спорта"]
  }'
```

Ответ идёт потоково в формате `application/x-ndjson`:

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

- timeout Flowise/LLM: `504`
- пустой ответ: `502`
- невалидный JSON: `502`
- невалидный request body: `400`
