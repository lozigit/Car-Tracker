from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_current_household, get_current_user, get_db
from app.models import Household, HouseholdMember
from app.schemas import HouseholdCreate, HouseholdOut

router = APIRouter(prefix="/api/households", tags=["households"])


@router.post("", response_model=HouseholdOut, status_code=status.HTTP_201_CREATED)
def create_household(payload: HouseholdCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    existing = db.query(HouseholdMember).filter(HouseholdMember.user_id == user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Household already exists for this user (Phase 1 limitation).",
        )

    household = Household(name=payload.name)
    db.add(household)
    db.commit()
    db.refresh(household)

    member = HouseholdMember(household_id=household.id, user_id=user.id, role="admin")
    db.add(member)
    db.commit()

    return HouseholdOut(id=household.id, name=household.name, created_at=household.created_at)


@router.get("/current", response_model=HouseholdOut)
def get_current(household=Depends(get_current_household)):
    return HouseholdOut(id=household.id, name=household.name, created_at=household.created_at)
