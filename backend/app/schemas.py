from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


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
