# AI Adaptive Learning Journey Generator

This repository contains the monorepo for the AI Adaptive Learning Journey Generator.

## Prerequisites

- Node.js 20+
- Python 3.12+
- Docker Desktop or Docker Engine
- A PostgreSQL 16 instance with the pgvector extension enabled

## Required environment variables

The application expects the following environment variables to be present when running locally:

- DATABASE_URL
- JWT_SECRET
- GOOGLE_OAUTH_CLIENT_ID
- GOOGLE_OAUTH_CLIENT_SECRET
- OPENAI_API_KEY
- GEMINI_API_KEY
- YOUTUBE_API_KEY
- LLM_PROVIDER

## Local development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker PostgreSQL

```bash
docker compose up -d postgres
```

## Testing

```bash
cd backend
pytest

cd ../frontend
npm run test -- --run
npm run lint
npm run build
```

## Linting

```bash
cd backend
ruff check .

cd ../frontend
npm run lint
```
