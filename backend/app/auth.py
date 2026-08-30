from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import StudentProfile, User

security = HTTPBearer(auto_error=False)


def create_access_token(subject: str) -> str:
    secret = os.getenv("JWT_SECRET", "dev-secret")
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    return jwt.encode({"sub": subject, "exp": expires_at}, secret, algorithm="HS256")


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    secret = os.getenv("JWT_SECRET", "dev-secret")
    try:
        payload = jwt.decode(credentials.credentials, secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if profile is None:
        profile = StudentProfile(user_id=user.id, preferred_name=user.full_name)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def build_google_oauth_url() -> str:
    client_id = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "test-client-id")
    return (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={client_id}"
        "&redirect_uri=http://localhost:8000/api/auth/google/callback"
        "&response_type=code&scope=openid%20email%20profile&access_type=offline"
    )


def exchange_google_code(code: str) -> tuple[dict, dict]:
    client_id = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "test-client-id")
    client_secret = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "test-client-secret")
    token_response = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": "http://localhost:8000/api/auth/google/callback",
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    token_response.raise_for_status()
    token_payload = token_response.json()

    userinfo_response = httpx.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {token_payload['access_token']}"},
        timeout=10,
    )
    userinfo_response.raise_for_status()
    userinfo = userinfo_response.json()

    return token_payload, userinfo
