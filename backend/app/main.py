"""FastAPI application entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers.auth import router as auth_router
from app.routers.courses import router as courses_router
from app.routers.assessment import router as assessment_router
from app.routers.profile import router as profile_router
from app.routers.dashboard import router as dashboard_router
from app.routers.practice import router as practice_router
from app.routers.journeys import router as journeys_router
from app.routers.resources import router as resources_router
from app.routers.tutor import router as tutor_router
from app.seed import seed_courses


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Create tables and seed data on startup."""
    Base.metadata.create_all(bind=engine)
    seed_courses()
    yield


app = FastAPI(
    title="AI Adaptive Learning Journey Generator",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
allowed_origins = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
] or ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handler — consistent error shape
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def generic_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    """Catch-all so unhandled errors never leak raw tracebacks to the client."""
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": str(exc)}},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(courses_router)
app.include_router(assessment_router)
app.include_router(dashboard_router)
app.include_router(practice_router)
app.include_router(journeys_router)
app.include_router(resources_router)
app.include_router(tutor_router)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok", "service": "ai-adaptive-learning-generator"}
