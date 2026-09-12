# AI Adaptive Learning Journey Generator — Engineering & Implementation Guide

> **Project Specification & Technical Handoff Document**
> **Product:** Adaptive Learner
> **Domain:** Generative AI & Autonomous Learning Agents
> **Frontend:** React + TypeScript + Tailwind CSS (Vite SPA)
> **Backend:** Python 3.12+ + FastAPI + SQLAlchemy ORM
> **Database:** PostgreSQL 16 (with pgvector) / SQLite for local development
> **AI Architecture:** Strands Learning Agent + Model Providers (Google Gemini / Anthropic Bedrock / OpenAI) + Deterministic Fallback Engine
> **Resources Engine:** YouTube Data API v3 (English & Tamil) + Validated Multi-Language Curriculum Catalog
> **Deployment:** Docker Multi-stage + Docker Compose + AWS-ready (ECS Fargate / App Runner)

---

## 1. Project Goal and Architecture

The platform generates an **individualized learning journey** instead of forcing every student through a rigid, one-size-fits-all linear curriculum.

### Core Architectural Principle
**The backend is authoritative.** The backend evaluates scores, computes topic-level mastery thresholds (deterministic 70.0% rule), manages the prerequisite dependency DAG (Directed Acyclic Graph), and enforces topic locking/unlocking.

**The AI agent is responsible for reasoning, personalized recommendation, pedagogical explanation, and diagnostic outlining inside a strictly enforced JSON schema.** The AI can never mark a topic mastered, invent topics, create hallucinated URLs, or violate prerequisite safety rules.

```mermaid
graph TD
    A[Student / Learner] -->|Take Assessment / Interact| B[React SPA Frontend]
    B -->|JWT Authenticated API| C[FastAPI Backend Engine]
    C -->|Store Attempts & Compute Scores| D[Mastery & Prerequisite Engine]
    D -->|Constrained Graph & Performance Snapshot| E[Strands Learning Journey Agent]
    E -->|Structured Plan Proposal| F[Backend Validation Gate]
    F -->|Validated Plan| G[(PostgreSQL / SQLite)]
    F -->|Resource Requirements| H[Resource Service / YouTube API]
    H -->|Validated Video & Doc URLs| B
```

### Runtime Flow
`Student` → `React UI` → `FastAPI` → `Assessment & Mastery Engine` → `Strands Learning Agent` → `Pydantic Structured Output Validation` → `Validated Database Persistence` → `Dynamic UI Journey Graph`.

---

## 2. SD1 / SD2 / SD3 / Tester Responsibilities

| Role | Scope & Key Responsibilities |
| :--- | :--- |
| **SD1 (Frontend)** | Vite + React + TypeScript setup, responsive layout (Sidebar, TopNav, Dashboard, Journey, Coding Practice, Resources), JWT state management, Google OAuth callback flow, client-side test runners, zero ESLint errors, accessible components, Vitest unit & component test coverage. |
| **SD2 (Backend & AI)** | FastAPI routing, SQLAlchemy models & migrations, deterministic mastery engine (69.99% vs 70.00%), topic prerequisite DAG traversal, Strands Agent integration, Pydantic validation schemas, resilient LLM adapters, YouTube search service, AI audit logs (`ai_runs`). |
| **SD3 (DevOps & Deploy)** | Production multi-stage Dockerfiles, Docker Compose service orchestration, GitHub Actions CI/CD pipeline, environment variable hygiene, AWS runtime configurations (ECS/App Runner/ECR), monitoring, health checks, zero-downtime rollback strategy. |
| **Tester (QA & Security)** | End-to-end integration testing, boundary verification (`MAST-01` to `MAST-03`), AI schema validation & hallucination controls (`AI-01` to `AI-04`), IDOR security tests, performance smoke checks, release sign-off. |

---

## 3. Functional Modules

1. **Authentication & Identity:** Secure JWT sessions, Google OAuth 2.0 authorization code exchange, mock/dev-login for automated local testing.
2. **Course Catalog & Enrollment:** Multi-course support (Java, Python, C, C++, SQL, Web Development) with automatic enrollment and topic hierarchy.
3. **Baseline Assessment:** 5-question diagnostic assessment per course. Correct answers are strictly hidden from the client payload prior to submission.
4. **Authoritative Mastery Engine:** Computes topic-level weighted points. Scores $\ge 70.0\%$ mark status as `MASTERED`; scores $< 70.0\%$ designate `NEEDS_REVISION`.
5. **Prerequisite Dependency Graph:** Unlocks downstream topics only after upstream prerequisite nodes meet mastery.
6. **Adaptive Learning Journey:** Visualizes active curriculum nodes (`completed`, `in-progress`, `recommended`, `locked`) with estimated study times and AI recommendations.
7. **AI Notes & Diagnostic Outlines:** Concise conceptual notes, worked examples, and common mistake warnings generated dynamically.
8. **Sandboxed Practice Coding:** Virtual code execution and multi-language testcase evaluation for C, C++, Python, and Java.
9. **Multi-Language Resources (English & Tamil):** Dynamic YouTube Data API queries filtered by topic and language, backed by cached educational catalogs.
10. **Reassessment & Continuous Adaptation Loop:** Topic re-testing recalculates mastery and immediately prompts the agent to update future path recommendations.
11. **Contextual AI Tutor:** Dedicated endpoint (`/api/tutor/messages`) offering pedagogical hints grounded in the learner's current syllabus and weak concepts.

---

## 4. Database Design

Relational architecture with foreign key constraints, indexes on high-cardinality lookups, UTC timestamps, and idempotent seeds.

```mermaid
erDiagram
    users ||--o| student_profiles : "has"
    users ||--o{ enrollments : "enrolls"
    users ||--o{ assessment_attempts : "attempts"
    users ||--o{ learning_plans : "owns"
    users ||--o{ ai_runs : "generates"
    courses ||--o{ course_topics : "contains"
    courses ||--o{ enrollments : "has"
    course_topics ||--o{ topic_prerequisites : "topic"
    course_topics ||--o{ topic_prerequisites : "prerequisite"
    enrollments ||--o{ student_topic_progress : "tracks"
    learning_plans ||--o{ learning_plan_nodes : "contains"
```

### Key Schema Highlights
- `users`: Stores user identity (`id`, `email`, `full_name`, `google_sub`, `avatar_url`, `created_at`).
- `courses`: Unique `code` (e.g. `java`, `python`, `c`), `title`, `summary`.
- `course_topics`: `id`, `course_id`, `code`, `title`, `description`, `order`. Unique constraint on `(course_id, code)`.
- `topic_prerequisites`: `topic_id`, `prerequisite_topic_id`. Self-referencing join table representing prerequisite edges.
- `student_topic_progress`: `(user_id, topic_id)` unique constraint storing authoritative `score`, `status` (`MASTERED`, `NEEDS_REVISION`), and `completed_at`.
- `learning_plans`: Stores active journey metadata (`id`, `user_id`, `course_id`, `summary`, `next_topic_id`, `source`, `agent_version`).
- `learning_plan_nodes`: Stores each node in the plan (`topic_id`, `status`, `mastery_score`, `reason`, `estimated_minutes`, `order_index`).
- `ai_runs`: Audit trail for compliance (`user_id`, `task`, `prompt_version`, `model_identifier`, `latency_ms`, `status`, `error_category`).

---

## 5. Topic Graph and Mastery Engine

### Deterministic Mastery Calculation
$$\text{Topic Score} = \left(\frac{\text{Earned Points}}{\text{Available Points}}\right) \times 100$$

- $\text{Score} \ge 70.0\% \implies \text{Status} = \mathbf{MASTERED}$
- $\text{Score} < 70.0\% \implies \text{Status} = \mathbf{NEEDS\_REVISION}$

### Example Java Prerequisite Graph
$$\text{Basics} \longrightarrow \text{Variables \& Operators} \longrightarrow \text{Conditional Statements} \longrightarrow \text{Loops} \longrightarrow \text{Methods} \longrightarrow \text{OOP Concepts} \longrightarrow \text{Exception Handling}$$

If a student scores **65% on Loops** and **80% on Conditionals**:
- `Conditionals` is `MASTERED`.
- `Loops` is `NEEDS_REVISION` (Recommended as Next Step).
- `Methods` is **LOCKED** because its prerequisite (`Loops`) is unmastered.

---

## 6. Assessment Engine

1. **Question Generation / Fetching:** Baseline questions are retrieved per course and served via `GET /api/courses/{code}/baseline`.
2. **Zero Client Leakage:** The `correct_index` or answer key is stripped on the server. The student's browser receives only question text and option choices.
3. **Server-Side Scoring:** Answers are sent via `POST /api/courses/{code}/baseline`. The server evaluates matches in a transaction, creates `assessment_attempts` records, and maps earned points to individual topics.
4. **Mastery Update:** Corresponding `student_topic_progress` records are updated transactionally.
5. **Sandboxed Practice Execution:** Student coding practice runs through a secure execution runner with time bounds, subprocess isolation, and memory limits, never executing unsanitized student code directly in the main server loop.

---

## 7. Strands Agent Architecture

The system utilizes the **Strands Agents SDK** pattern (`strands.Agent`) with provider fallback (Gemini / Bedrock / OpenAI) and a guaranteed deterministic fallback engine.

### Available Agent Tools
1. `get_learner_snapshot(user_id, course_id)`: Read-only learner metrics, current scores, and recent attempts.
2. `get_topic_graph(course_id)`: Directed graph of course topics and prerequisite relationships.
3. `get_question_stats(snapshot)`: Aggregates weak and mastered topics.
4. `constrained_eligible_codes(course_id)`: Calculates topics eligible for learning based on graph traversal.
5. `search_resources(topic, language)`: Generates search query requirements for the backend resource fetcher.

---

## 8. AI System Prompt

```text
SYSTEM ROLE
You are the Adaptive Learning Journey Planner.

RULES
1. Never invent course topics. All topic_ids must match the provided course graph.
2. Never invent prerequisite relationships.
3. Backend mastery scores are authoritative. Never override them.
4. Never mark a topic mastered. Only the backend can grant mastery.
5. Prefer prerequisite repair when weak areas block downstream progress.
6. Respect learner goal, language preferences (English/Tamil), and daily available time.
7. Explain why each recommendation was selected in the reason field.
8. Never fabricate URLs. Resource queries must contain search terms only.
9. Return only the required structured JSON schema matching LearningJourneyOutput.
10. Do not expose secrets or private student PII.

INPUT CONTEXT
course, learner profile, topic graph, topic scores, mastered topics, weak topics, recent attempts, preferences, and daily goal.

OUTPUT SCHEMA
JSON payload conforming to LearningJourneyOutput.
```

---

## 9. Structured AI Output Schema

```json
{
  "course_id": "java",
  "summary": "Focus on Java Loops to resolve your prerequisite gap before moving to Methods.",
  "nodes": [
    {
      "topic_id": "loops",
      "status": "RECOMMENDED",
      "mastery_score": 42.0,
      "difficulty": "beginner",
      "prerequisites": ["conditional-statements"],
      "reason": "Recent assessment score 42% is below the 70% threshold.",
      "estimated_minutes": 45
    },
    {
      "topic_id": "methods",
      "status": "LOCKED",
      "mastery_score": null,
      "difficulty": "beginner",
      "prerequisites": ["loops"],
      "reason": "Prerequisite Loops is not yet mastered.",
      "estimated_minutes": 30
    }
  ],
  "next_topic": "loops",
  "revision_topics": ["loops"],
  "resource_queries": [
    {
      "topic_id": "loops",
      "language": "ta",
      "query": "Java loops tutorial in Tamil"
    }
  ],
  "notes_outline": [
    "While loop syntax and termination",
    "For loop iteration counter",
    "Preventing infinite loops"
  ],
  "quiz_blueprint": { "count": 5, "difficulty": "beginner" },
  "coding_blueprint": { "count": 2, "difficulty": "beginner" }
}
```

---

## 10. AI Function-by-Function Responsibilities

- `analyze_learner`: Analyzes score distributions, identifying mastery gaps from server-authoritative points.
- `generate_learning_plan`: Proposes a sequenced study path prioritizing prerequisite repair.
- `generate_notes`: Produces structured markdown study outlines for the active topic.
- `generate_quiz`: Produces schema-validated questions for topic-level checks.
- `generate_coding_task`: Generates starter challenges and test assertions.
- `explain_recommendation`: Provides pedagogical reasoning for why a topic was assigned.
- `tutor_response`: Answers student questions strictly grounded within the syllabus context.
- `search_resources`: Outputs validated keyword queries for YouTube API retrieval.

---

## 11. AI Validation and Failure Handling

Model responses pass through `validate_plan()` in `app/services/journey_service.py`:
1. **Topic ID Existence:** Every `topic_id` in `nodes`, `next_topic`, and `revision_topics` must exist in the database for that course.
2. **Prerequisite Integrity:** Nodes cannot declare prerequisites that do not exist in the database DAG.
3. **Mastery Authority:** If the model attempts to claim a topic is `MASTERED`, the validator overwrites it with the backend database score and status.
4. **URL Safety:** If the model hallucinates a URL (contains `://`), the validation fails immediately.
5. **Time Bounds:** `estimated_minutes` is clamped to $[5, 240]$.
6. **Graceful Fallback:** If the model times out, returns malformed JSON, or fails validation, the system transparently activates `fallback_plan()`, recording the incident in `ai_runs` with `error_category='model_unavailable_or_invalid'`.

---

## 12. Backend API Contract

| Method | Path | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/dev-login` | Development JWT authentication token | No |
| `GET` | `/api/auth/google/login` | Returns Google OAuth authorization URL | No |
| `GET` | `/api/auth/google/callback`| OAuth code exchange callback | No |
| `GET` | `/api/courses` | List all available courses | No |
| `GET` | `/api/courses/{code}` | Get course details and topic list | No |
| `GET` | `/api/courses/{code}/baseline` | Fetch diagnostic assessment (no answer keys) | Yes |
| `POST` | `/api/courses/{code}/baseline` | Submit diagnostic assessment and score | Yes |
| `GET` | `/api/me/mastery?course_code={code}` | Authoritative mastery status for all topics | Yes |
| `POST` | `/api/journeys/generate` | Generate or adapt learning journey with AI | Yes |
| `GET` | `/api/courses/{code}/journey` | Retrieve current personalized learning journey | Yes |
| `GET` | `/api/resources` | Fetch validated English/Tamil video & doc links | No |
| `POST` | `/api/tutor/messages` | AI Tutor chat grounded in learner context | Yes |
| `GET` | `/api/courses/{code}/practice`| List coding practice challenges | No |
| `POST` | `/api/practice/run` | Run testcase in code execution runner | No |
| `POST` | `/api/practice/submit` | Evaluate practice solution with AI | No |
| `GET` | `/api/health` | Service liveness probe | No |

---

## 13. Backend Folder Structure

```text
backend/
├── app/
│   ├── agents/
│   │   ├── learning_agent.py    # Strands agent + LLM adapter + fallback
│   │   ├── prompts.py           # System prompts and versioning
│   │   ├── schemas.py           # Pydantic schemas for journey output
│   │   └── tools.py             # Read-only agent inspection tools
│   ├── routers/
│   │   ├── assessment.py        # Baseline & topic assessment runner
│   │   ├── auth.py              # JWT & Google OAuth routes
│   │   ├── courses.py           # Courses & topic catalog
│   │   ├── dashboard.py         # Student dashboard metrics
│   │   ├── journeys.py          # Journey generation & mastery routes
│   │   ├── practice.py          # Code runner & submissions
│   │   ├── profile.py           # Student profile management
│   │   ├── resources.py         # English/Tamil YouTube & catalog resources
│   │   └── tutor.py             # Contextual AI tutor messages
│   ├── services/
│   │   ├── graph_service.py     # DAG prerequisite traversal
│   │   ├── journey_service.py   # Plan validation & persistence
│   │   ├── llm.py               # Provider switcher (Gemini, Bedrock, OpenAI)
│   │   └── mastery_service.py   # Deterministic 70% threshold logic
│   ├── config.py                # Pydantic Settings and validation
│   ├── database.py              # SQLAlchemy engine & session factory
│   ├── main.py                  # FastAPI application & CORS setup
│   ├── models.py                # Database ORM models
│   ├── schemas.py               # Request/response DTOs
│   └── seed.py                  # Idempotent starter course catalog
├── services/                    # Practice coding runners & catalog
├── tests/                       # Unit & integration test suites
├── Dockerfile                   # Production Python 3.12-slim image
└── requirements.txt             # Pinned dependencies
```

---

## 14. Resource / YouTube & Multi-Language Handling

- **Zero Fake URLs:** The AI agent emits resource *queries*, not URLs.
- **YouTube Data API v3:** When configured, searches YouTube with `relevanceLanguage: "en"` or `"ta"` based on learner preference.
- **Curated Multi-Language Fallback:** Includes verified video IDs from popular educators:
  - English: *freeCodeCamp.org*, *Programming with Mosh*, *StatQuest*.
  - Tamil: *Error Makes Clever*, *Tamil Hacks*, *Tut Dude Tamil*, *Let's Learn Tamil*.
- **Direct Filtering:** Endpoint `/api/resources?language=ta` switches all video and reading material to Tamil equivalents instantly.

---

## 15. Authentication and Security Boundary

1. **Token Authority:** Identity is always derived from the verified Bearer JWT `sub` claim, never from client-supplied request bodies (preventing IDOR vulnerabilities).
2. **Passwordless / OAuth First:** Uses Google OAuth 2.0 with PKCE and state protection, or secure salted credentials.
3. **CORS Hardening:** Configured strictly in `app/main.py` allowing only authorized origins (`http://localhost:5173`, `http://localhost:3000`).
4. **Secret Protection:** No secrets or private keys are checked into source control; all sensitive configuration is loaded via environment variables.

---

## 16. Database Migration / Seed

- **Seed Idempotency:** `seed_courses()` runs once on startup, verifying existing course codes before insertion.
- **Prerequisite Graph Initialization:** Automatic linear prerequisite chaining is seeded for all 6 starter courses.
- **Pre-populated Demo Profiles:** Initialized with realistic assessment scores for immediate demonstration.

---

## 17. Tester Master Plan & Critical Test Cases

### Test Matrix

| ID | Category | Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| `AUTH-01` | Auth | Valid login | JWT token issued, user profile returned | **PASS** |
| `AUTH-02` | Auth | Unauthenticated route access | 401 Unauthorized / 403 Forbidden | **PASS** |
| `AUTH-03` | Auth | Access another learner's journey | Blocked (derives user from token) | **PASS** |
| `ASM-01` | Assessment | Fetch baseline quiz | No `correct_index` in questions payload | **PASS** |
| `ASM-02` | Assessment | Submit baseline quiz answers | Attempt recorded, score updated in DB | **PASS** |
| `MAST-01` | Mastery | Score is 69.99% | Status is `NEEDS_REVISION` | **PASS** |
| `MAST-02` | Mastery | Score is 70.00% | Status is `MASTERED` | **PASS** |
| `MAST-03` | Mastery | Prerequisite unmastered | Dependent topic is marked `LOCKED` | **PASS** |
| `AI-01` | AI Agent | Valid agent journey output | Accepted and saved to `learning_plans` | **PASS** |
| `AI-02` | AI Agent | Agent invents unknown `topic_id` | Rejected by validator / fallback triggered | **PASS** |
| `AI-03` | AI Agent | Agent emits fabricated URL | Rejected by validator / URL stripped | **PASS** |
| `AI-04` | AI Agent | Model times out or returns malformed | Safe fallback plan generated & recorded | **PASS** |
| `SEC-01` | Security | Script/SQL injection in prompt | Escaped safely, no raw execution | **PASS** |
| `DEP-01` | Deployment | Health check endpoint `/api/health` | Returns `{"status": "ok"}` | **PASS** |

---

## 18. Docker and Local Development

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 20+ and Python 3.12+ (for non-containerized development)

### 2. Running with Docker Compose
```bash
# Build and start all services (PostgreSQL, FastAPI Backend, React Frontend)
docker compose up --build -d

# Verify services
docker compose ps
```
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **API Docs (Swagger):** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/api/health`

### 3. Running Locally Without Docker
```bash
# Backend Setup
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend Setup
cd frontend
npm install
npm run dev
```

---

## 19. AWS Deployment Architecture

```text
               ┌───────────────────────┐
               │    Amazon Route 53    │
               └──────────┬────────────┘
                          │
               ┌──────────▼────────────┐
               │  Application Load     │
               │       Balancer        │
               └────┬─────────────┬────┘
                    │             │
        /api/*      │             │  Static / SPA
  ┌─────────────────▼──┐       ┌──▼──────────────────┐
  │  AWS App Runner /  │       │   AWS S3 + CloudFront│
  │  ECS Fargate (API) │       │   (React SPA Bundle) │
  └────────┬───────────┘       └─────────────────────┘
           │
           ├────────────────────────┬────────────────────────┐
           ▼                        ▼                        ▼
  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
  │ Amazon RDS      │      │ Amazon Bedrock  │      │ YouTube API /   │
  │ PostgreSQL 16   │      │ (Claude / Nova) │      │ External Web    │
  └─────────────────┘      └─────────────────┘      └─────────────────┘
```

- **Container Registry:** Amazon ECR (`adaptive-learning-backend`, `adaptive-learning-frontend`).
- **Compute:** AWS App Runner or Amazon ECS Fargate.
- **Secrets Management:** AWS Secrets Manager / Systems Manager Parameter Store.
- **LLM Provider:** Amazon Bedrock (`us.anthropic.claude-sonnet-4-20250514-v1:0`) or Google Gemini API.

---

## 20. CI/CD Lifecycle

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every commit:
1. **Backend QA:** Ruff linter + Pytest test matrix (`test_assessment`, `test_auth`, `test_courses`, `test_journeys_and_mastery`, `test_practice`).
2. **Frontend QA:** ESLint (`0 errors, 0 warnings`) + Vitest component tests + TypeScript production build (`tsc -b && vite build`).
3. **Docker Verification:** Automated build test verifying Dockerfiles build cleanly without cache poisoning.

---

## 21. 5-Minute Hackathon Demo Script

- **0:00–0:30 (Problem Statement):** Traditional learning platforms force all students down the same static path regardless of background knowledge or specific skill gaps.
- **0:30–1:15 (Baseline Diagnostic):** Demo user signs in and selects **Java Programming**. Takes the 5-question diagnostic baseline assessment. Observe: correct answers are not exposed in browser network inspection.
- **1:15–2:00 (Authoritative Mastery Engine):** Submission shows topic breakdown. Student mastered *Basics* (90%) and *Conditionals* (78%), but scored 42% on *Loops*.
- **2:00–3:00 (Adaptive Learning Journey):** System invokes the AI Learning Agent. The generated journey locks *Methods* and highlights *Loops* as **RECOMMENDED** with clear diagnostic reasoning: *"Prerequisite Loops (42%) is below the 70% threshold."*
- **3:00–3:45 (Learning & Multi-Language Resources):** Student clicks into *Loops*, views AI conceptual notes, and toggles between **English** and **Tamil** video tutorials. Solves a practice coding exercise.
- **3:45–4:30 (Reassessment & Adaptation Loop):** Student takes the *Loops* reassessment, scores 85%, and triggers journey re-generation. *Loops* transitions to **MASTERED**, and *Methods* immediately unlocks as the next recommended step!
- **4:30–5:00 (Architecture & Safety):** Walk through backend authority, Strands structured outputs, zero URL hallucination guarantee, and Docker/AWS deployment readiness.

---

## Appendix A — Database Schema Reference

| Table | Important Columns | Relationships & Constraints |
| :--- | :--- | :--- |
| `users` | `id`, `email`, `full_name`, `google_sub`, `avatar_url`, `created_at` | $1 \to 1$ `student_profiles`, $1 \to N$ `enrollments`, $1 \to N$ `learning_plans` |
| `student_profiles` | `id`, `user_id`, `preferred_name`, `learning_goals`, `current_level` | FK `users.id` (Unique) |
| `courses` | `id`, `code`, `title`, `summary`, `created_at` | Unique `code`, $1 \to N$ `course_topics`, $1 \to N$ `enrollments` |
| `course_topics` | `id`, `course_id`, `code`, `title`, `description`, `order` | FK `courses.id`, Unique `(course_id, code)` |
| `topic_prerequisites` | `id`, `topic_id`, `prerequisite_topic_id` | Self-referencing DAG edges between `course_topics` |
| `enrollments` | `id`, `user_id`, `course_id`, `baseline_completed`, `baseline_score` | FK `users.id`, `courses.id`, Unique `(user_id, course_id)` |
| `student_topic_progress` | `id`, `user_id`, `enrollment_id`, `topic_id`, `score`, `status` | Unique `(user_id, topic_id)` |
| `learning_plans` | `id`, `user_id`, `course_id`, `enrollment_id`, `summary`, `source` | FK `users.id`, `courses.id`, `enrollments.id` |
| `learning_plan_nodes` | `id`, `plan_id`, `topic_id`, `status`, `mastery_score`, `reason` | FK `learning_plans.id`, `course_topics.id` |
| `assessment_attempts` | `id`, `user_id`, `enrollment_id`, `score`, `total`, `created_at` | FK `users.id`, `enrollments.id` |
| `ai_runs` | `id`, `user_id`, `task`, `prompt_version`, `status`, `latency_ms` | Audit trail for agent executions |

---

## Appendix B — Environment Variables Reference

```bash
# Core Environment
APP_ENV=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173

# Database
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/adaptive_learning

# Authentication
JWT_SECRET=your-secure-random-jwt-secret
AUTH_SECRET=your-secure-random-jwt-secret
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
OAUTH_REDIRECT_URL=http://localhost:8000/api/auth/google/callback

# AI & LLM Providers
LLM_PROVIDER=google
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20250514-v1:0

# External APIs
YOUTUBE_API_KEY=your-youtube-data-api-key
```

---

## Appendix C — Definition of Done Checklist

- [x] **SD1:** Frontend cleanly renders Auth, Courses, Baseline Assessment, Journey Graph, Coding Practice, Multi-language Resources, Reassessment, and Progress Dashboard.
- [x] **SD1:** `npm run lint` passes with 0 errors and 0 warnings.
- [x] **SD1:** `npm run test -- --run` passes (all Vitest tests green).
- [x] **SD1:** `npm run build` generates production bundle successfully.
- [x] **SD2:** Backend FastAPI server registered with all routes (`journeys`, `resources`, `tutor`, `assessment`, `courses`, `auth`).
- [x] **SD2:** CORS middleware enabled with multi-origin support.
- [x] **SD2:** Authoritative mastery engine strictly enforces 70.0% boundary (`MAST-01`, `MAST-02`).
- [x] **SD2:** Prerequisite DAG locks dependent topics until prior topics are mastered (`MAST-03`).
- [x] **SD2:** Strands Agent structured outputs validated against schema with safe fallback (`AI-01` to `AI-04`).
- [x] **SD2:** 26 automated backend tests pass via `pytest`.
- [x] **SD3:** Production `Dockerfile` for Backend with non-root security.
- [x] **SD3:** Production multi-stage `Dockerfile` for Frontend with Nginx SPA routing.
- [x] **SD3:** `docker-compose.yml` orchestrates PostgreSQL, Backend, and Frontend with health checks.
- [x] **SD3:** GitHub Actions CI/CD workflow created (`.github/workflows/ci.yml`).
- [x] **Security:** Answer keys stripped prior to assessment submission; JWT identity enforced; no secrets in logs or git.
