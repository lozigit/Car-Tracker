from __future__ import annotations

from enum import StrEnum


class RenewalKind(StrEnum):
    """Canonical renewal types.

    Keep this as the single source of truth across:
    - SQLAlchemy models
    - Pydantic schemas
    - frontend API types
    """

    INSURANCE = "INSURANCE"
    MOT = "MOT"
    TAX = "TAX"
