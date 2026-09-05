# Adaptive Learner AI Workflow

## Responsibility Split

| Responsibility | Owner |
|---|---|
| Authentication and authorization | Backend |
| Password hashing | Backend security layer |
| Answer storage | Database/API |
| Score calculation | Deterministic backend rules |
| Topic percentages | Deterministic backend rules |
| Pass/fail and unlocking | Deterministic backend rules |
| Strength/weakness explanation | Gemini plus backend validation |
| Personalized topic ordering | Gemini proposal plus backend validation |
| Notes and explanations | Gemini service |
| Practice question generation | Gemini service |
| YouTube search | YouTube service |
| Final persisted journey state | Backend |

## Input Contract

Gemini receives learning data only:

```json
{
  "course": "Java Programming",
  "studentLevel": "intermediate",
  "interests": ["loops"],
  "assessmentScores": {
    "Basics": 90,
    "Loops": 42,
    "OOP": 55
  },
  "recentAttempts": [],
  "completedTopics": ["Basics"]
}
```

Never send passwords, JWTs, OAuth secrets, or unnecessary personal data.

## Output Contract

The backend should require structured JSON:

```json
{
  "skillLevel": "INTERMEDIATE",
  "strongTopics": ["Basics"],
  "weakTopics": ["Loops", "OOP"],
  "recommendedTopics": [
    {"topic": "Loops", "priority": 1, "reason": "Low score", "difficulty": "BEGINNER"}
  ],
  "recommendation": "Strengthen loops before advanced OOP."
}
```

Pydantic validation must reject unknown or malformed critical values. Invalid output triggers one retry, structured logging, and deterministic fallback.

## Deterministic Progression Rules

- `80-100`: `MASTERED`
- `70-79`: `COMPLETED`
- `50-69`: `NEEDS_PRACTICE`
- `0-49`: `WEAK`

Gemini may recommend the next action, but it cannot mark a topic completed or unlock a topic by itself.

## Generation Lifecycle

1. Load student profile and evidence.
2. Calculate canonical scores in the backend.
3. Build a versioned Gemini input snapshot.
4. Call Gemini through a service boundary with timeout and retry policy.
5. Validate the structured response.
6. Apply deterministic progression rules.
7. Persist recommendation and journey version.
8. Return the updated dashboard projection.

## Fallback Mode

When Gemini is unavailable, use deterministic rules based on the lowest-scoring incomplete topic. The application must remain usable and should record that fallback mode was used internally.
