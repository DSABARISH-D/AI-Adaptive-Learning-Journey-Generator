"""FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Create local development tables and seed course data."""
    # TODO(production): use Alembic migrations as a deployment step rather than
    # creating schema automatically during application startup.
    if settings.app_env.strip().lower() != "production":
        Base.metadata.create_all(bind=engine)
    seed_courses()
    yield


app = FastAPI(
    title="AI Adaptive Learning Journey Generator",
    lifespan=lifespan,
)

allowed_origins = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
] or ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(Exception)
async def generic_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    """Log server-side details but never return exception text to a client."""
    logger.exception("Unhandled application error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected server error occurred.",
            }
        },
    )


app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(courses_router)
app.include_router(assessment_router)
app.include_router(dashboard_router)
app.include_router(practice_router)
app.include_router(journeys_router)
app.include_router(resources_router)
app.include_router(tutor_router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok", "service": "ai-adaptive-learning-generator"}
