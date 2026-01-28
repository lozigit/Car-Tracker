from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.enums import RenewalKind


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    created_at: datetime


class HouseholdCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)


class HouseholdOut(BaseModel):
    id: uuid.UUID
    name: str
    created_at: datetime


class CarCreate(BaseModel):
    registration_number: str = Field(min_length=2, max_length=16)
    make: str | None = Field(default=None, max_length=64)
    model: str | None = Field(default=None, max_length=64)


class CarUpdate(BaseModel):
    registration_number: str | None = Field(default=None, min_length=2, max_length=16)
    make: str | None = Field(default=None, max_length=64)
    model: str | None = Field(default=None, max_length=64)
    is_archived: bool | None = None


class CarOut(BaseModel):
    id: uuid.UUID
    household_id: uuid.UUID
    registration_number: str
    make: str | None
    model: str | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime


# -------------------------
# Phase 2: renewals
# -------------------------


class RenewalCreate(BaseModel):
    kind: RenewalKind
    valid_from: date
    valid_to: date

    provider: str | None = Field(default=None, max_length=120)
    reference: str | None = Field(default=None, max_length=120)
    cost_pence: int | None = Field(default=None, ge=0)
    notes: str | None = None


class RenewalUpdate(BaseModel):
    valid_from: date | None = None
    valid_to: date | None = None

    provider: str | None = Field(default=None, max_length=120)
    reference: str | None = Field(default=None, max_length=120)
    cost_pence: int | None = Field(default=None, ge=0)
    notes: str | None = None


class RenewalOut(BaseModel):
    id: uuid.UUID
    car_id: uuid.UUID
    kind: RenewalKind
    valid_from: date
    valid_to: date

    provider: str | None
    reference: str | None
    cost_pence: int | None
    notes: str | None

    is_deleted: bool
    created_at: datetime
    updated_at: datetime


UpcomingStatus = Literal["missing", "due", "overdue", "next_scheduled"]


class UpcomingRenewalOut(BaseModel):
    car_id: uuid.UUID
    car_registration_number: str
    kind: RenewalKind

    status: UpcomingStatus
    due_date: date | None = None
    days_until: int | None = None

    current_valid_to: date | None = None
    next_valid_from: date | None = None
    next_valid_to: date | None = None


# -------------------------
# Phase 2: reminder preferences
# -------------------------


class ReminderPreferencesPayload(BaseModel):
    # keys are RenewalKind values ("INSURANCE"|"MOT"|"TAX")
    preferences: dict[str, list[int]]

    @field_validator("preferences")
    @classmethod
    def _validate_prefs(cls, v: dict[str, list[int]]):
        allowed = {k.value for k in RenewalKind}
        unknown = set(v.keys()) - allowed
        if unknown:
            raise ValueError(f"Unknown renewal kinds: {sorted(unknown)}")
        # normalize lists (unique, sorted desc maybe not; keep asc)
        for key, offsets in v.items():
            if any(o < 0 for o in offsets):
                raise ValueError(f"Offsets must be >= 0 for {key}")
            v[key] = sorted(set(int(o) for o in offsets), reverse=True)
        return v


class ReminderPreferencesOut(BaseModel):
    preferences: dict[str, list[int]]
