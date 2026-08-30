from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
import urllib.parse
from sqlalchemy.orm import Session

from app.auth import build_google_oauth_url, create_access_token, exchange_google_code, get_db
from app.config import settings
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
    format: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
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

    # We can omit auto-creating the profile here, but let's keep it if we want to be safe,
    # or let's remove it and handle it in profile router.
    # The instructions say "Update the profile router to handle the case where user has no profile gracefully"
    # That implies the profile might NOT exist when hitting the profile router.
    # So I will remove auto-creation from here!

    token = create_access_token(str(user.id))
    user_out = UserOut.model_validate(user)
    
    if format == "json":
        return AuthTokenResponse(token=token, user=user_out)

    user_json = user_out.model_dump_json()
    frontend_url = f"{settings.frontend_url}/auth/callback?token={token}&user={urllib.parse.quote(user_json)}"
    return RedirectResponse(url=frontend_url)
