from fastapi import FastAPI

from app.routers.auth import router as auth_router
from app.routers.courses import router as courses_router
from app.routers.profile import router as profile_router

app = FastAPI(title="AI Adaptive Learning Journey Generator")

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(courses_router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "ai-adaptive-learning-generator"}
