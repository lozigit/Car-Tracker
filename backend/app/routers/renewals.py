from __future__ import annotations

import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.deps import get_current_household, get_db
from app.enums import RenewalKind
from app.models import Car, RenewalRecord
from app.schemas import (
    RenewalCreate,
    RenewalOut,
    RenewalUpdate,
    UpcomingRenewalOut,
)

router = APIRouter(prefix="/api", tags=["renewals"])


def _to_out(r: RenewalRecord) -> RenewalOut:
    return RenewalOut(
        id=r.id,
        car_id=r.car_id,
        kind=r.kind,
        valid_from=r.valid_from,
        valid_to=r.valid_to,
        provider=r.provider,
        reference=r.reference,
        cost_pence=r.cost_pence,
        notes=r.notes,
        is_deleted=r.is_deleted,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


def _parse_uuid(value: str, *, not_found_detail: str):
    try:
        return uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=not_found_detail) from None


@router.get("/cars/{car_id}/renewals", response_model=list[RenewalOut])
def list_renewals(
    car_id: str,
    kind: RenewalKind | None = None,
    db: Session = Depends(get_db),
    household=Depends(get_current_household),
):
    cid = _parse_uuid(car_id, not_found_detail="Car not found")
    car = db.get(Car, cid)
    if not car or car.household_id != household.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    q = db.query(RenewalRecord).filter(
        RenewalRecord.car_id == cid,
        RenewalRecord.is_deleted.is_(False),
    )
    if kind is not None:
        q = q.filter(RenewalRecord.kind == kind)

    rows = q.order_by(RenewalRecord.valid_to.desc()).all()
    return [_to_out(r) for r in rows]


@router.post("/cars/{car_id}/renewals", response_model=RenewalOut, status_code=status.HTTP_201_CREATED)
def create_renewal(
    car_id: str,
    payload: RenewalCreate,
    db: Session = Depends(get_db),
    household=Depends(get_current_household),
):
    cid = _parse_uuid(car_id, not_found_detail="Car not found")
    car = db.get(Car, cid)
    if not car or car.household_id != household.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    r = RenewalRecord(
        car_id=cid,
        kind=payload.kind,
        valid_from=payload.valid_from,
        valid_to=payload.valid_to,
        provider=payload.provider,
        reference=payload.reference,
        cost_pence=payload.cost_pence,
        notes=payload.notes,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return _to_out(r)


@router.patch("/renewals/{renewal_id}", response_model=RenewalOut)
def update_renewal(
    renewal_id: str,
    payload: RenewalUpdate,
    db: Session = Depends(get_db),
    household=Depends(get_current_household),
):
    rid = _parse_uuid(renewal_id, not_found_detail="Renewal not found")
    r = db.get(RenewalRecord, rid)
    if not r or r.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Renewal not found")

    car = db.get(Car, r.car_id)
    if not car or car.household_id != household.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Renewal not found")

    if payload.valid_from is not None:
        r.valid_from = payload.valid_from
    if payload.valid_to is not None:
        r.valid_to = payload.valid_to
    if payload.provider is not None:
        r.provider = payload.provider
    if payload.reference is not None:
        r.reference = payload.reference
    if payload.cost_pence is not None:
        r.cost_pence = payload.cost_pence
    if payload.notes is not None:
        r.notes = payload.notes

    r.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(r)
    return _to_out(r)


@router.delete("/renewals/{renewal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_renewal(
    renewal_id: str,
    db: Session = Depends(get_db),
    household=Depends(get_current_household),
):
    rid = _parse_uuid(renewal_id, not_found_detail="Renewal not found")
    r = db.get(RenewalRecord, rid)
    if not r or r.is_deleted:
        return

    car = db.get(Car, r.car_id)
    if not car or car.household_id != household.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Renewal not found")

    r.is_deleted = True
    r.updated_at = datetime.utcnow()
    db.commit()
    return


@router.get("/renewals/upcoming", response_model=list[UpcomingRenewalOut])
def upcoming_renewals(
    days: int = Query(60, ge=1, le=365),
    db: Session = Depends(get_db),
    household=Depends(get_current_household),
):
    """Return items that are missing, overdue, or due within the next N days."""

    today = date.today()

    cars = (
        db.query(Car)
        .filter(Car.household_id == household.id)
        .filter(Car.is_archived.is_(False))
        .order_by(Car.created_at.desc())
        .all()
    )

    out: list[UpcomingRenewalOut] = []

    for car in cars:
        # load renewals for car in one query per car (fine for Phase 2 scale)
        rows = (
            db.query(RenewalRecord)
            .filter(RenewalRecord.car_id == car.id)
            .filter(RenewalRecord.is_deleted.is_(False))
            .order_by(RenewalRecord.valid_from.asc())
            .all()
        )

        by_kind: dict[RenewalKind, list[RenewalRecord]] = {k: [] for k in RenewalKind}
        for r in rows:
            by_kind[r.kind].append(r)

        for kind in RenewalKind:
            rs = by_kind[kind]
            # pick the best matches if multiple overlap
            current = max(
                (r for r in rs if r.valid_from <= today <= r.valid_to),
                key=lambda r: r.valid_to,
                default=None,
            )
            past = max(
                (r for r in rs if r.valid_to < today),
                key=lambda r: r.valid_to,
                default=None,
            )

            if current:
                days_until = (current.valid_to - today).days
                if days_until <= days:
                    out.append(
                        UpcomingRenewalOut(
                            car_id=car.id,
                            car_registration_number=car.registration_number,
                            kind=kind,
                            status="due",
                            due_date=current.valid_to,
                            days_until=days_until,
                            current_valid_to=current.valid_to,
                        )
                    )
                continue

            if past:
                # overdue/lapsed
                out.append(
                    UpcomingRenewalOut(
                        car_id=car.id,
                        car_registration_number=car.registration_number,
                        kind=kind,
                        status="overdue",
                        due_date=past.valid_to,
                        days_until=-(today - past.valid_to).days,
                        current_valid_to=None,
                    )
                )
                continue

            # no records at all
            out.append(
                UpcomingRenewalOut(
                    car_id=car.id,
                    car_registration_number=car.registration_number,
                    kind=kind,
                    status="missing",
                )
            )

    # Sort: missing first, then overdue, then due soon, then next scheduled
    priority = {"missing": 0, "overdue": 1, "due": 2}
    out.sort(key=lambda x: (priority.get(x.status, 99), x.days_until if x.days_until is not None else 10_000))
    return out
