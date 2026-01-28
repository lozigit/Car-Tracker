from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.enums import RenewalKind
from app.models import ReminderPreference
from app.schemas import ReminderPreferencesOut, ReminderPreferencesPayload

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _default_preferences() -> dict[str, list[int]]:
    # days before expiry to notify; UI can allow per-user/per-car overrides later
    return {
        RenewalKind.INSURANCE.value: [30, 7, 1],
        RenewalKind.MOT.value: [30, 7, 1],
        RenewalKind.TAX.value: [30, 7, 1],
    }


@router.get("/reminders", response_model=ReminderPreferencesOut)
def get_reminder_preferences(db: Session = Depends(get_db), user=Depends(get_current_user)):
    row = db.query(ReminderPreference).filter(ReminderPreference.user_id == user.id).first()
    if not row:
        return ReminderPreferencesOut(preferences=_default_preferences())
    return ReminderPreferencesOut(preferences=row.preferences_json)


@router.put("/reminders", response_model=ReminderPreferencesOut)
def upsert_reminder_preferences(
    payload: ReminderPreferencesPayload,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    row = db.query(ReminderPreference).filter(ReminderPreference.user_id == user.id).first()
    if not row:
        row = ReminderPreference(user_id=user.id, preferences_json=payload.preferences)
        db.add(row)
    else:
        row.preferences_json = payload.preferences
        row.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(row)
    return ReminderPreferencesOut(preferences=row.preferences_json)
