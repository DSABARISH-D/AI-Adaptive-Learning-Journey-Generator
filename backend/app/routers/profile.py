from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_profile, get_current_user, get_db
from app.models import StudentProfile, User
from app.schemas import ProfileUpdate, StudentProfileOut

router = APIRouter(prefix="/api", tags=["profile"])


@router.get("/profile", response_model=StudentProfileOut)
def get_profile(
    profile: StudentProfile | None = Depends(get_current_profile),
    user: User = Depends(get_current_user),
) -> StudentProfile:
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    profile.user_id = user.id
    return profile


@router.put("/profile", response_model=StudentProfileOut)
def update_profile(
    payload: ProfileUpdate,
    profile: StudentProfile | None = Depends(get_current_profile),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StudentProfile:
    if profile is None:
        profile = StudentProfile(user_id=user.id, preferred_name=user.full_name)
        db.add(profile)

    if payload.preferred_name is not None:
        profile.preferred_name = payload.preferred_name
    if payload.learning_goals is not None:
        profile.learning_goals = payload.learning_goals
    if payload.interests is not None:
        profile.interests = payload.interests
    if payload.current_level is not None:
        profile.current_level = payload.current_level

    db.add(profile)
    db.commit()
    db.refresh(profile)
    profile.user_id = user.id
    return profile
