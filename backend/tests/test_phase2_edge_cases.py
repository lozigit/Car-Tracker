import uuid
from datetime import date, timedelta


def _signup_and_login(client) -> tuple[str, str]:
    email = f"user_{uuid.uuid4().hex[:10]}@example.com"
    password = "string1234"
    r = client.post("/api/auth/signup", json={"email": email, "password": password})
    assert r.status_code in (200, 201), r.text
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    token = r.json().get("access_token") or r.json().get("token")
    assert token
    return token, email


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _create_household(client, token: str) -> str:
    r = client.post("/api/households", headers=_auth(token), json={"name": f"H-{uuid.uuid4().hex[:6]}"})
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def _create_car(client, token: str) -> str:
    r = client.post(
        "/api/cars",
        headers=_auth(token),
        json={"registration_number": f"VRM{uuid.uuid4().hex[:4]}", "make": "Test", "model": "Car"},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def test_renewal_rejects_invalid_date_range(client):
    token, _ = _signup_and_login(client)
    _create_household(client, token)
    car_id = _create_car(client, token)

    today = date.today()
    payload = {
        "kind": "MOT",
        "valid_from": (today + timedelta(days=10)).isoformat(),
        "valid_to": (today + timedelta(days=1)).isoformat(),  # invalid: ends before start
    }
    r = client.post(f"/api/cars/{car_id}/renewals", headers=_auth(token), json=payload)

    # Could be 422 from Pydantic validation or 400 from your own validation
    assert r.status_code in (400, 422), r.text


def test_delete_renewal_soft_deletes_and_disappears_from_list(client):
    token, _ = _signup_and_login(client)
    _create_household(client, token)
    car_id = _create_car(client, token)

    today = date.today()
    payload = {
        "kind": "INSURANCE",
        "valid_from": (today - timedelta(days=1)).isoformat(),
        "valid_to": (today + timedelta(days=30)).isoformat(),
    }
    r = client.post(f"/api/cars/{car_id}/renewals", headers=_auth(token), json=payload)
    assert r.status_code in (200, 201), r.text
    renewal_id = r.json()["id"]

    # Delete
    r = client.delete(f"/api/renewals/{renewal_id}", headers=_auth(token))
    assert r.status_code in (200, 204), r.text

    # List renewals: should not include deleted (or should have is_deleted=true, depending on your API)
    r = client.get(f"/api/cars/{car_id}/renewals", headers=_auth(token))
    assert r.status_code == 200, r.text
    items = r.json()
    assert all(item["id"] != renewal_id for item in items), items


def test_requires_auth_for_protected_endpoints(client):
    # no auth header
    r = client.get("/api/renewals/upcoming?days=30")
    assert r.status_code in (401, 403), r.text

    r = client.get("/api/settings/reminders")
    assert r.status_code in (401, 403), r.text
