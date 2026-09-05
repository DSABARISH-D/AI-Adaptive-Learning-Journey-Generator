# Adaptive Learner System Architecture

## Product Goal

Adaptive Learner converts assessment evidence into a validated, personalized learning path. Gemini recommends learning actions; the backend owns scoring, authorization, progression rules, and database state.

## Current Implementation Boundary

The repository currently uses:

- React 19, TypeScript, Vite, and React Router for the frontend
- FastAPI, SQLAlchemy, and Pydantic for the backend
- SQLite for local development and PostgreSQL/pgvector for the target deployment
- Alembic for database migrations
- JWT authentication plus Google OAuth
- Gemini/OpenAI-compatible provider abstraction with a deterministic fallback

The supplied target architecture names Spring Boot and MySQL. Replacing the working FastAPI/PostgreSQL foundation would be a separate migration project. This plan keeps the current stack so the product can progress without losing implemented behavior.

## Logical Architecture

```text
React application
    |
    | authenticated REST requests
    v
FastAPI API layer
    |
    +-- Auth and authorization
    +-- Course and enrollment services
    +-- Assessment evaluation
    +-- Dashboard aggregation
    +-- Learning activity tracking
    +-- Gemini recommendation service
    +-- YouTube resource service
    |
    v
SQLAlchemy repositories / transaction boundary
    |
    v
PostgreSQL + pgvector
```

## Adaptive Learning Loop

```text
Student profile + enrollment
    -> baseline/topic assessment
    -> answer persistence
    -> deterministic score calculation
    -> topic performance aggregation
    -> Gemini structured recommendation
    -> backend schema validation
    -> deterministic progression rules
    -> learning journey update
    -> dashboard and resources refresh
```

Gemini must never write database state directly. It returns a validated recommendation object; backend rules decide whether a topic is locked, in progress, completed, or mastered.

## Request Flow

1. `AuthProvider` restores the JWT and user from browser storage.
2. `apiFetch` adds the bearer token to protected requests.
3. FastAPI dependencies resolve the current user and database session.
4. Services calculate or retrieve learning state for that user only.
5. The frontend renders loading, empty, error, and populated states.

## Security Boundaries

- Passwords must be hashed with BCrypt if email/password registration is added.
- JWT signing secrets, Gemini keys, YouTube keys, OAuth secrets, and database credentials remain backend environment variables.
- Every student query must filter by the authenticated user ID.
- Gemini output is untrusted input and must pass Pydantic validation.
- Coding execution must run in an isolated worker/container, never in the API process.

## Deployment Shape

Local development:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:8000`
- PostgreSQL: Docker Compose on port `5432`

Production should place the frontend behind a CDN/reverse proxy, run multiple API workers, use managed PostgreSQL, and put Gemini/YouTube work behind timeouts and retry limits.
