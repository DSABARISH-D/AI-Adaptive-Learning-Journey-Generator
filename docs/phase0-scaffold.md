# Phase 0: Project Scaffold

## Purpose

Establish the monorepo foundation for the AI Adaptive Learning Journey Generator, including the backend API skeleton, frontend React app, database configuration, and the basic health endpoints needed for validation.

## Inputs

- Workspace root with the `backend` and `frontend` directories
- Local PostgreSQL via Docker Compose
- Environment configuration through `.env.example`
- Python and Node.js toolchains

## Outputs

- FastAPI application in `backend/app`
- Alembic migration scaffold with pgvector enablement
- Vite + React + TypeScript app in `frontend`
- Root README and Docker Compose configuration
- Health endpoint and frontend status page

## API Endpoint(s)

- `GET /api/health`
  - Returns a JSON payload with service status:
    - `{"status": "ok", "service": "ai-adaptive-learning-generator"}`

## Database Tables

No application tables are created in Phase 0. The only database concern is the migration bootstrap that enables the PostgreSQL `vector` extension.

## Error Cases

- Backend dependency installation issues on unsupported Python versions
- Docker/Postgres startup issues if the container is not running
- Frontend fetch errors if the backend is unavailable

## Testing Method

- Backend: `pytest` against the `/api/health` endpoint
- Frontend: `vitest` renders the health status page
- Linting: `ruff check .` for the backend and `eslint .` plus `tsc --noEmit` for the frontend
- Startup validation: run the FastAPI app with environment variables set and call the health endpoint

## Assumption

The repository is intentionally scaffolded without phase-specific business logic so that the project can be validated incrementally in later phases.
