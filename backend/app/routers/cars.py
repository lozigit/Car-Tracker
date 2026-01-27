from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_current_household, get_db
from app.models import Car
from app.schemas import CarCreate, CarOut, CarUpdate

router = APIRouter(prefix="/api/cars", tags=["cars"])


def _to_out(c: Car) -> CarOut:
    return CarOut(
        id=c.id,
        household_id=c.household_id,
        registration_number=c.registration_number,
        make=c.make,
        model=c.model,
        is_archived=c.is_archived,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


@router.get("", response_model=list[CarOut])
def list_cars(
    include_archived: bool = False,
    db: Session = Depends(get_db),
    household=Depends(get_current_household),
):
    q = db.query(Car).filter(Car.household_id == household.id)
    if not include_archived:
        q = q.filter(Car.is_archived.is_(False))
    cars = q.order_by(Car.created_at.desc()).all()
    return [_to_out(c) for c in cars]


@router.post("", response_model=CarOut, status_code=status.HTTP_201_CREATED)
def create_car(
    payload: CarCreate,
    db: Session = Depends(get_db),
    household=Depends(get_current_household),
):
    car = Car(
        household_id=household.id,
        registration_number=payload.registration_number.upper().strip(),
        make=payload.make,
        model=payload.model,
    )
    db.add(car)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Car already exists for household")
    db.refresh(car)
    return _to_out(car)


@router.get("/{car_id}", response_model=CarOut)
def get_car(
    car_id: str,
    db: Session = Depends(get_db),
    household=Depends(get_current_household),
):
    try:
        cid = uuid.UUID(car_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    car = db.get(Car, cid)
    if not car or car.household_id != household.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    return _to_out(car)


@router.patch("/{car_id}", response_model=CarOut)
def update_car(
    car_id: str,
    payload: CarUpdate,
    db: Session = Depends(get_db),
    household=Depends(get_current_household),
):
    try:
        cid = uuid.UUID(car_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    car = db.get(Car, cid)
    if not car or car.household_id != household.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    if payload.registration_number is not None:
        car.registration_number = payload.registration_number.upper().strip()
    if payload.make is not None:
        car.make = payload.make
    if payload.model is not None:
        car.model = payload.model
    if payload.is_archived is not None:
        car.is_archived = payload.is_archived

    car.updated_at = datetime.utcnow()
    db.add(car)
    db.commit()
    db.refresh(car)
    return _to_out(car)


@router.post("/{car_id}/archive", response_model=CarOut)
def archive_car(
    car_id: str,
    db: Session = Depends(get_db),
    household=Depends(get_current_household),
):
    try:
        cid = uuid.UUID(car_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    car = db.get(Car, cid)
    if not car or car.household_id != household.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    car.is_archived = True
    car.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(car)
    return _to_out(car)


@router.post("/{car_id}/unarchive", response_model=CarOut)
def unarchive_car(
    car_id: str,
    db: Session = Depends(get_db),
    household=Depends(get_current_household),
):
    try:
        cid = uuid.UUID(car_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    car = db.get(Car, cid)
    if not car or car.household_id != household.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    car.is_archived = False
    car.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(car)
    return _to_out(car)
