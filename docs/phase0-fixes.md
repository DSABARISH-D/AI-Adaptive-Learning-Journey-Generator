# Phase 0 — Bug Fixes & Scaffolding Hardening

## Purpose

Fix all known bugs from the initial Copilot-generated codebase and
harden the project scaffolding before building new features.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `requirements.txt` | Added missing `PyJWT==2.9.0` dependency |
| `app/config.py` | Centralized all env vars (`jwt_secret`, `google_oauth_*`, `llm_provider`, API keys) into Pydantic `Settings` |
| `app/auth.py` | Replaced all `os.getenv()` calls with `settings.*` references; configurable OAuth redirect URL |
| `app/main.py` | Added lifespan handler (create tables + seed on startup); global exception handler for consistent `{"error": {"code", "message"}}` shape |
| `app/seed.py` | **[NEW]** Extracted seed logic from `courses.py` into standalone module |
| `app/routers/courses.py` | Removed per-request `_seed_courses()` calls |
| `app/schemas.py` | Added `ErrorDetail` + `ErrorResponse` models |
| `tests/conftest.py` | **[NEW]** Shared `setup_db` fixture (create tables + seed + teardown) |
| `tests/test_auth.py` | Refactored: extracted helpers, removed duplicate fixture, removed env monkeypatches |
| `tests/test_courses.py` | Refactored: same pattern, added `test_course_not_found` |
| `.env.example` | Updated with all new env var names and comments |

### Frontend

| File | Change |
|------|--------|
| `App.test.tsx` | Fixed assertions to match rendered text; use `level: 1` to disambiguate headings |
| `Profile.tsx` | Made `token` prop optional (`token?: string`) |
| `Courses.tsx` | Replaced duplicate `app-shell` class with `courses-page` |

### Root

| File | Change |
|------|--------|
| `.gitignore` | **[NEW]** Excludes venvs, node_modules, .env, caches, .db files |

## Testing

- `pytest` — 10 tests, 0 failures
- `ruff check .` — all checks passed
- `vitest run` — 1 test, 0 failures
- `eslint .` — 0 errors
- `tsc --noEmit` — 0 errors

## Error Cases

- All endpoints now return consistent error JSON: `{"error": {"code": "...", "message": "..."}}`
- 404 for unknown course codes
- 401 for unauthenticated requests to protected endpoints
