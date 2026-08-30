# Phase 1: Authentication and Student Profile

## Purpose

Provide Google OAuth login, issue application JWT tokens, and persist a student profile that can be viewed and updated through protected API routes.

## Inputs

- Google OAuth redirect flow initiated by `/api/auth/google/login`
- Authorization header with a bearer token passed to protected endpoints
- A SQLite-backed database for local testing and development

## Outputs

- JWT issued after successful Google callback handling
- User and `student_profiles` records created automatically when the user first signs in
- Profile data returned or updated through the `/api/profile` endpoints

## API Endpoint(s)

- `GET /api/auth/google/login` - returns a Google OAuth URL
- `GET /api/auth/google/callback` - exchanges the OAuth code, creates/loads the user, and issues a JWT
- `GET /api/profile` - returns the current student profile
- `PUT /api/profile` - updates the current student profile

## Database Tables

- `users`
- `student_profiles`

## Error Cases

- Missing or invalid bearer token -> `401 Unauthorized`
- Google callback failure -> `400 Bad Request`
- User missing from the database after token verification -> `401 Unauthorized`

## Testing Method

- Use mocked Google OAuth responses in pytest to exercise the login callback without real external requests.
- Assert successful JWT issuance and protected profile CRUD behavior.
- Confirm a missing bearer token is rejected.

## Assumption

The OAuth flow is implemented as a server-side callback using environment variables for Google credentials and a local dev redirect URL. The app relies on a JWT secret from environment variables in production.
