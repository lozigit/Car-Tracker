from __future__ import annotations

import os
from dataclasses import dataclass


def _getenv(name: str, default: str | None = None) -> str | None:
    v = os.getenv(name)
    return v if v is not None and v != "" else default


@dataclass(frozen=True)
class Settings:
    database_url: str
    jwt_secret: str
    jwt_alg: str
    access_token_expire_minutes: int
    cors_origins: list[str]

    @staticmethod
    def from_env() -> Settings:
        db = _getenv("DATABASE_URL", "postgresql+psycopg://cartrack:cartrack@localhost:5432/cartrack")
        jwt_secret = _getenv("JWT_SECRET", "change-me-in-dev")
        jwt_alg = _getenv("JWT_ALG", "HS256")
        exp = int(_getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
        cors = _getenv("CORS_ORIGINS", "http://localhost:5173")
        cors_origins = [c.strip() for c in cors.split(",") if c.strip()]
        return Settings(
            database_url=db,
            jwt_secret=jwt_secret,
            jwt_alg=jwt_alg,
            access_token_expire_minutes=exp,
            cors_origins=cors_origins,
        )
