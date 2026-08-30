from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import build_google_oauth_url, create_access_token, exchange_google_code, get_db
from app.models import StudentProfile, User
from app.schemas import AuthTokenResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/google/login")
def google_login() -> dict[str, str]:
    return {"auth_url": build_google_oauth_url()}


@router.get("/google/callback")
def google_callback(
    code: str = Query(...),
    state: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> AuthTokenResponse:
    _ = state
    try:
        _, userinfo = exchange_google_code(code)
    except Exception as exc:  # pragma: no cover - validation of failure path handled in tests
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google login failed") from exc

    user = db.query(User).filter(User.email == userinfo["email"]).first()
    if user is None:
        user = User(
            email=userinfo["email"],
            full_name=userinfo.get("name"),
            google_sub=userinfo.get("sub"),
            avatar_url=userinfo.get("picture"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if profile is None:
        profile = StudentProfile(user_id=user.id, preferred_name=user.full_name)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    token = create_access_token(str(user.id))
    return AuthTokenResponse(token=token, user=UserOut.model_validate(user))
