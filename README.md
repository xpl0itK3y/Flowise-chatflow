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

Flowise можно поднять в Docker:

```bash
docker run -d --name flowise -p 3001:3000 flowiseai/flowise
```

После запуска:
- открыть `http://localhost:3001`
- импортировать `flowise/seo-generator-flow.json`
- открыть chatflow в UI
- взять `FLOWISE_CHATFLOW_ID` из URL

Пример:

```text
http://localhost:3001/canvas/3b13e36a-18bb-4205-b4ed-1942a908803c
```

Значит:

```dotenv
FLOWISE_CHATFLOW_ID=3b13e36a-18bb-4205-b4ed-1942a908803c
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
