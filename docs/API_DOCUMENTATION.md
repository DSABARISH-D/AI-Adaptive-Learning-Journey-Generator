# Adaptive Learner API Specification

All routes are prefixed with `/api`. Protected routes require:

```text
Authorization: Bearer <jwt>
```

## Implemented APIs

### Authentication

- `GET /auth/google/login` returns the Google authorization URL.
- `GET /auth/google/callback` handles backend OAuth redirects.
- `GET /auth/google/exchange?code=...` exchanges a frontend OAuth code.
- `POST /auth/dev-login` creates a local demo session.

### Profile

- `GET /profile` returns the current student's learning profile.
- `PUT /profile` updates preferred name, interests, goals, and level.

### Courses

- `GET /courses` lists the seeded course catalog.
- `GET /courses/{course_code}` returns course topics.
- `POST /courses/{course_code}/enroll` creates an idempotent enrollment.
- `GET /enrollments` lists the current student's enrollments.

### Assessments

- `GET /courses/{course_code}/baseline` creates/returns a protected baseline quiz.
- `POST /courses/{course_code}/baseline` evaluates submitted answers and persists score, attempt, and topic-progress rows.

### Dashboard

- `GET /dashboard` returns an authenticated dashboard projection containing statistics, current course/topic, roadmap, recommendation, recent activity, daily goal, and upcoming tasks.
- `POST /dashboard/activity` records a validated learning activity for the current student.

## Target APIs

The following APIs are planned for the next phases:

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `GET /courses/{course_id}/topics`
- `POST /assessments/{assessment_id}/submit`
- `GET /assessments/{assessment_id}/result`
- `GET /performance/course/{course_id}`
- `GET /learning-path/{course_id}`
- `POST /learning-path/generate`
- `POST /ai/analyze-assessment`
- `POST /ai/generate-notes`
- `POST /ai/generate-questions`
- `POST /ai/tutor`
- `GET /resources/topic/{topic_id}`
- `GET /youtube/search`
- `GET /progress/course/{course_id}`

## Response Rules

- Return structured JSON, never raw tracebacks.
- Validate request bodies with Pydantic.
- Use `401` for missing/invalid authentication, `403` for forbidden ownership, `404` for missing resources, and `422` for invalid input.
- Keep provider-specific errors behind a stable application error shape.
- Do not return correct answers or provider API keys to the frontend.
