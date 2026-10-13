# Project Completion Plan — AI Adaptive Learning Journey Generator

This checklist is based on the Antigravity Project Stage Report and repository review. It is a plan and does not claim that unchecked work has been completed.

## Current baseline from the report
- React 19 + Vite + TypeScript + Tailwind frontend
- FastAPI + SQLAlchemy backend
- SQLite for local development; PostgreSQL/pgvector as the target
- Authentication, course catalog, baseline assessment, topic mastery, learning journey, resource search, coding practice, and AI tutor have partial implementations
- Production readiness is blocked by secret management, code execution isolation, migrations/startup behavior, test gaps, and operational controls

## Priority 0 — secure the project before deployment
- [ ] Remove every real credential from tracked files and rotate any key ever committed to Git history.
- [ ] Keep .env local; use deployment secret storage in production.
- [ ] Set APP_ENV=production and a unique JWT_SECRET with at least 32 random characters.
- [ ] Keep the code-runner disabled in production until a separate isolated sandbox/worker is implemented and reviewed.
- [ ] Verify Google OAuth redirect URI and frontend origin settings.
- [ ] Ensure server errors are logged internally and generic messages are returned to clients.
- [ ] Do not deploy until a dependency/security scan and the security acceptance tests pass.

## Priority 1 — reliable core student journey
- [ ] Sign in, refresh/reject expired tokens, and sign out correctly.
- [ ] View courses, enroll once, and open course topics.
- [ ] Complete a baseline assessment; verify answer keys are never sent before submission.
- [ ] Persist score and topic mastery per student and enrollment.
- [ ] Generate and persist a learning plan from validated topics only.
- [ ] Enforce prerequisites and the 70% mastery rule in backend code, not by trusting model output.
- [ ] Display assessment results, strengths, weaknesses, and the next recommended topic.
- [ ] Complete a topic lesson, take a topic assessment, and update progress.

## Priority 2 — AI, resources, and practice
- [ ] Add provider timeout, retry with bounded backoff, and deterministic fallback to AI calls.
- [ ] Validate all structured model output against Pydantic schemas and known topic IDs.
- [ ] Keep prompts, API keys, and provider calls on the backend.
- [ ] Verify YouTube links are real URLs returned by the API; never fabricate resource URLs.
- [ ] Test English and Tamil resource filtering and behavior when the API key/quota is unavailable.
- [ ] Implement code execution only through an isolated container/worker with CPU, memory, time, network, filesystem, and output limits.
- [ ] Add SQL practice with a restricted, temporary database if it is part of the promised feature set.
- [ ] Keep tutor responses scoped to course/topic context and handle provider failures safely.

## Priority 3 — dashboard, profile, and admin
- [ ] Calculate daily goal and streak using date-scoped activity records.
- [ ] Add progress-over-time charts from saved assessment attempts.
- [ ] Verify profile edits persist and are user-scoped.
- [ ] Add admin-only course/topic/question management if required for the final scope.
- [ ] Add rate limiting for authentication, assessment generation, tutor, resources, and practice endpoints.

## Priority 4 — database, testing, and deployment
- [ ] Generate and review Alembic migrations for the current models.
- [ ] Run migrations as a deployment step; do not rely on create_all in production.
- [ ] Add backend tests for dashboard, duplicate enrollment, repeated baseline attempts, AI timeout/fallback, user-data isolation, resource API failures, and security boundaries.
- [ ] Add frontend tests for login, course catalog, assessment, result page, journey, dashboard, and API error/loading states.
- [ ] Run backend tests, Ruff, frontend tests, lint, and production build in CI.
- [ ] Run the complete end-to-end flow against PostgreSQL.
- [ ] Document backup/restore, health checks, logging, secret rotation, rollback, and deployment steps.
- [ ] Verify all demo accounts/data are clearly identified as demo data and not presented as real student outcomes.

## Release acceptance criteria
1. A new student can sign in and enroll in a course.
2. A student can complete a baseline assessment and see a result breakdown.
3. Topic mastery and prerequisites determine the next unlocked topic.
4. A generated journey is persisted and remains consistent after reload.
5. Reassessment updates mastery and the next learning recommendation.
6. AI/API failure does not lose student progress or crash the app.
7. No secret is present in tracked source files or client bundles.
8. Untrusted code cannot execute inside the web API process.
9. All automated tests and production builds pass.
10. README setup instructions work on a clean machine.

## Working rule
Finish one phase at a time. Make a small change, add a regression test, run checks, then proceed. Do not rewrite working parts just to change frameworks or folder structure.
