# Adaptive Learner Development Roadmap

## Phase 1: Scaffold

Status: complete in the current repository.

- React/Vite frontend
- FastAPI backend
- SQLAlchemy database layer
- Docker PostgreSQL/pgvector service
- Alembic scaffold
- Health endpoint
- Basic test suites

## Phase 2: Authentication

Status: prototype complete; production gaps remain.

- Google OAuth callback and frontend code exchange
- JWT session handling
- Local demo login
- Add email/password registration with BCrypt
- Add refresh/expiry handling
- Add explicit role model and admin authorization

## Phase 3: Course and Topic Management

Status: student catalog and enrollment complete.

- Expand topic/subtopic seed data for all five courses
- Add admin CRUD APIs
- Add topic detail endpoints

## Phase 4: Dynamic Dashboard

Status: implemented foundation.

- Authenticated dashboard aggregation
- Enrollment statistics
- Topic progress
- Assessment attempts
- Recommendations
- Activity and daily goal

## Phase 5: Baseline Assessment

Status: functional MVP; currently smaller than target.

- Increase from five generated questions to configurable 30-question assessments
- Add timer and question navigation
- Store question/topic/difficulty metadata
- Store each answer and time taken

## Phase 6: Evaluation and Adaptive Path

Next priority.

- Add assessment question and answer tables
- Add topic-level scoring by explicit question topic
- Add journey and journey-item tables
- Add pass/fail and unlocking rules
- Add result page with performance charts

## Phase 7: Gemini Service

- Create a dedicated Gemini service module
- Add typed analysis schemas
- Add prompt templates
- Add retry, timeout, cache, and fallback behavior
- Persist AI recommendation snapshots

## Phase 8: Topic Learning

- Topic overview pages
- Notes and examples
- Practice mode
- Topic assessment
- Reassessment flow

## Phase 9: Resources

- YouTube Data API backend integration
- English/Tamil filters
- Resource caching
- Watch/completion activity tracking
- Seeded fallback resources

## Phase 10: Coding Practice

- Coding question model
- Submission model
- Isolated runner worker
- Test-case evaluation
- Java, Python, C, C++, and SQL support

## Phase 11: AI Tutor and Progress Analytics

- Topic-grounded tutor endpoint
- Progress charts
- Improvement-over-time analysis
- Streak and daily-goal calculations

## Phase 12: Admin and Production Hardening

- Admin dashboard
- Student/course/question management
- Rate limits
- Observability
- Migration-only production startup
- Secrets rotation
- Deployment documentation

## Definition of Done for Each Phase

1. Feature implementation exists in backend and frontend.
2. Database changes have an Alembic migration.
3. Protected endpoints have ownership tests.
4. Loading, empty, error, and success states exist.
5. API and UI behavior are documented.
6. Unit/integration tests pass.
7. External-provider failure has a fallback or user-friendly error.
