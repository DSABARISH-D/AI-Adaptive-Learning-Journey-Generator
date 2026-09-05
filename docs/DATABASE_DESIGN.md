# Adaptive Learner Database Design

## Core Entities

```text
User
  |-- StudentProfile
  |-- Enrollment -- Course -- CourseTopic
  |                    |
  |                    +-- StudentTopicProgress
  |                    +-- BaselineQuiz
  |                    +-- AssessmentAttempt
  |
  +-- LearningActivity
```

## Existing Tables

### `users`

Stores identity and OAuth data: email, full name, Google subject, avatar URL, and creation time.

### `student_profiles`

Stores preferred name, learning goals, interests, and current level. One profile belongs to one user.

### `courses`

Stores stable course code, title, summary, and creation time.

### `course_topics`

Stores ordered topics belonging to a course. The `order` column controls the default prerequisite sequence.

### `enrollments`

Associates a student with a course. The `(user_id, course_id)` pair is unique. It stores status, enrollment date, baseline score, and baseline completion.

### `baseline_quizzes`

Stores generated quiz JSON for an enrollment. Correct answers remain on the backend and are not returned to the browser.

### `student_topic_progress`

Stores per-student evidence for a topic: score, status, completion time, and update time. The `(enrollment_id, topic_id)` pair is unique.

### `assessment_attempts`

Stores every evaluated attempt with assessment type, score, total, student, enrollment, and timestamp.

### `learning_activities`

Stores study events such as lesson completion, resource watch, quiz attempt, and practice activity. Minutes feed the daily goal.

## Target Extensions

The next normalized tables should be added with Alembic migrations:

- `assessment_questions`: question text, type, difficulty, topic, answer metadata
- `assessment_answers`: one answer per attempt/question, correctness, time taken
- `learning_journeys`: generated journey version per enrollment
- `learning_journey_items`: ordered recommendation, status, reason, priority
- `resources`: provider, topic, language, URL, title, thumbnail, cached metadata
- `ai_recommendations`: input snapshot, validated JSON output, model, expiry, status
- `topic_notes`: generated notes keyed by topic, language, and content version
- `coding_submissions`: isolated execution result and test-case summary
- `notifications`: user-visible learning and assessment events

## Integrity Rules

- Foreign keys must use cascade behavior intentionally; student evidence should not be deleted accidentally.
- Scores are integers from 0 through 100 after normalization.
- A topic can be marked `completed` only by backend progression rules.
- A recommendation stores the input snapshot used to generate it for auditability.
- AI-generated content is versioned and cacheable.
- Every student-facing query is scoped by authenticated user ID.

## Migration Policy

Use Alembic for every schema change. `Base.metadata.create_all()` is acceptable only for local test bootstrap; production startup must run reviewed migrations explicitly.
