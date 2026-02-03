import uuid
from datetime import date, timedelta

import pytest


def _signup(client, email: str, password: str) -> None:
    r = client.post("/api/auth/signup", json={"email": email, "password": password})
    assert r.status_code in (200, 201), r.text


def _login(client, email: str, password: str) -> str:
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    data = r.json()
    # supports either {"access_token": "..."} or {"token": "..."}
    token = data.get("access_token") or data.get("token")
    assert token, f"Login response missing token: {data}"
    return token


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _create_household(client, token: str, name: str) -> dict:
    r = client.post("/api/households", headers=_auth_headers(token), json={"name": name})
    assert r.status_code in (200, 201), r.text
    return r.json()


def _create_car(client, token: str, registration_number: str, make: str = "Ford", model: str = "Focus") -> dict:
    payload = {"registration_number": registration_number, "make": make, "model": model}
    r = client.post("/api/cars", headers=_auth_headers(token), json=payload)
    assert r.status_code in (200, 201), r.text
    return r.json()


def _create_renewal(client, token: str, car_id: str, kind: str, valid_from: date, valid_to: date) -> dict:
    payload = {
        "kind": kind,
        "valid_from": valid_from.isoformat(),
        "valid_to": valid_to.isoformat(),
        "provider": "Test Provider",
        "reference": f"REF-{uuid.uuid4().hex[:8]}",
        "cost_pence": 12345,
        "notes": "test",
    }
    r = client.post(f"/api/cars/{car_id}/renewals", headers=_auth_headers(token), json=payload)
    assert r.status_code in (200, 201), r.text
    return r.json()


def _list_renewals(client, token: str, car_id: str) -> list[dict]:
    r = client.get(f"/api/cars/{car_id}/renewals", headers=_auth_headers(token))
    assert r.status_code == 200, r.text
    return r.json()


def _upcoming(client, token: str, days: int = 90) -> list[dict]:
    r = client.get(f"/api/renewals/upcoming?days={days}", headers=_auth_headers(token))
    assert r.status_code == 200, r.text
    return r.json()


def _get_reminders(client, token: str) -> dict:
    r = client.get("/api/settings/reminders", headers=_auth_headers(token))
    assert r.status_code == 200, r.text
    return r.json()


def _put_reminders(client, token: str, payload: dict) -> dict:
    # r = client.get("/api/settings/reminders", headers=_auth_headers(token))
    # assert r.status_code == 200, r.text
    # return r.json()
    r = client.put("/api/settings/reminders", headers=_auth_headers(token), json={"preferences": payload},)
    assert r.status_code == 200, r.text
    return r.json()

# def test_phase2_create_household_and_car(client, unique_email):
#     password = "string1234"

#     # Signup
#     _signup(client, unique_email, password)

#     # Login
#     token = _login(client, unique_email, password)

#     # 2) Create household
#     household = _create_household(client, token, name=f"House-{uuid.uuid4().hex[:6]}")
#     assert household.get("id"), household

#     # 3) Create a car
#     car = _create_car(client, token, registration_number="AB12CDE")
#     assert car.get("id"), car
#     car_id = car["id"]


@pytest.mark.parametrize("kinds", [["INSURANCE", "MOT", "TAX"]])
def test_phase2_happy_path(client, unique_email, kinds):
    password = "string1234"

    # 1) Signup + Login
    _signup(client, unique_email, password)
    token = _login(client, unique_email, password)

    # 2) Create household
    household = _create_household(client, token, name=f"House-{uuid.uuid4().hex[:6]}")
    assert household.get("id"), household

    # 3) Create a car
    car = _create_car(client, token, registration_number="AB12CDE")
    assert car.get("id"), car
    car_id = car["id"]

    # 4) Add renewals for each kind
    today = date.today()
    for i, kind in enumerate(kinds):
        # stagger dates a little
        start = today - timedelta(days=10)
        end = today + timedelta(days=30 + i)
        created = _create_renewal(client, token, car_id, kind=kind, valid_from=start, valid_to=end)
        assert created["kind"] == kind

    # 5) List renewals and verify we have 3
    renewals = _list_renewals(client, token, car_id)
    got_kinds = sorted([r["kind"] for r in renewals if not r.get("is_deleted")])
    assert sorted(kinds) == got_kinds

    # 6) Upcoming renewals endpoint returns something relevant
    upcoming = _upcoming(client, token, days=365)
    assert isinstance(upcoming, list)
    # minimal, shape-based assertions (don’t overfit the API response yet)
    assert any(item.get("car_id") == car_id for item in upcoming), upcoming
    assert any(item.get("kind") in kinds for item in upcoming), upcoming

    # 7) Reminder preferences: read defaults, write, read back
    defaults = _get_reminders(client, token)
    assert isinstance(defaults, dict)

    new_prefs = {
        "INSURANCE": [30, 7, 1],
        "MOT": [28, 7, 1],
        "TAX": [30, 14, 7]
    }
    saved = _put_reminders(client, token, new_prefs)
    assert isinstance(saved, dict)

    read_back = _get_reminders(client, token)
    print("HERE:", read_back)
    prefs = read_back.get("preferences", read_back)  # supports either envelope or plain dict
    # allow server-side normalization (dedupe/sort), so compare sets
    assert set(prefs.get("INSURANCE", [])) == {30, 7, 1}
    assert set(prefs.get("MOT", [])) == {28, 7, 1}
    assert set(prefs.get("TAX", [])) == {30, 14, 7}
