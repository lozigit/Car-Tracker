from __future__ import annotations

from datetime import UTC, datetime, timedelta

import bcrypt
from jose import jwt

from app.config import Settings


def hash_password(password: str) -> str:
    # Store as a string in the DB (bcrypt returns bytes)
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(*, settings: Settings, subject: str, minutes: int) -> str:
    now = datetime.now(UTC)
    exp = now + timedelta(minutes=minutes)
    payload = {"sub": subject, "iat": int(now.timestamp()), "exp": int(exp.timestamp())}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)
