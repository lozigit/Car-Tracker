from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import Settings
from app.db import make_engine, make_session_factory
from app.models import Household, HouseholdMember, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_settings() -> Settings:
    return Settings.from_env()


def get_db(settings: Settings = Depends(get_settings)):
    engine = make_engine(settings)
    SessionLocal = make_session_factory(engine)
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user_id = uuid.UUID(sub)
    except (JWTError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from err

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_household(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Household:
    member = (
        db.query(HouseholdMember)
        .filter(HouseholdMember.user_id == user.id)
        .order_by(HouseholdMember.created_at.asc())
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No household found. Create a household first.",
        )
    household = db.get(Household, member.household_id)
    if not household:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Household not found")
    return household
