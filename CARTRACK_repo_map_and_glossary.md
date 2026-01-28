# CAR TRACK — Repo Map + Glossary (Phase 1)

## Folder map (what’s where)

At repo root you typically have:

```
Car_Tracker/
  infra/
  backend/
  frontend/
  .github/
  .vscode/
  README.md
```

### `infra/` — “support services” (Docker)
Typical contents:
- `docker-compose.yml` — starts Postgres + Redis containers
- (optional) `.env` — environment values for docker compose

You run this when you want your database/cache available locally:
```bash
docker compose up -d
```

### `backend/` — Python API (FastAPI)

Common structure:

```
backend/
  app/
    main.py
    config.py
    db.py
    models.py
    schemas.py
    deps.py
    security.py
    routers/
      auth.py
      households.py
      cars.py
  alembic/
    env.py
    versions/
      0001_init.py
  tests/
    test_health.py
  pyproject.toml
  .env.example
  alembic.ini
```

**What each key file does:**
- `app/main.py` — creates the FastAPI app, wires up routers, CORS, health endpoint
- `app/config.py` — reads environment variables into a Settings object
- `app/db.py` — SQLAlchemy base + session factory (how we talk to the DB)
- `app/models.py` — ORM classes: `User`, `Household`, `Car` (maps to tables)
- `app/schemas.py` — Pydantic models for request/response validation
- `app/deps.py` — FastAPI “dependencies” like `get_db()` and `get_current_user()`
- `app/security.py` — password hashing + JWT creation
- `app/routers/*.py` — API endpoints grouped by feature area
- `alembic/` — migration tooling and migration files
- `tests/` — pytest tests
- `pyproject.toml` — dependencies + tool config (ruff, pytest, etc.)
- `.env.example` — environment variable template for local dev
- `alembic.ini` — Alembic logging and config

### `frontend/` — Website UI (React)

Common structure:

```
frontend/
  src/
    main.tsx
    lib/
      api.ts
      ui.tsx
    pages/
      Login.tsx
      Signup.tsx
      Household.tsx
      Dashboard.tsx
      CarDetail.tsx
  package.json
  vite.config.ts
  tsconfig.json
```

**What each key file does:**
- `src/main.tsx` — app entry point + routing
- `src/lib/api.ts` — wrapper around `fetch` + token storage + API calls
- `src/pages/*` — your screens/pages
- `package.json` — frontend dependencies + scripts (`npm run dev`, `npm run build`)
- `vite.config.ts` — Vite dev server config

### `.github/` — CI (automated checks)
- GitHub Actions workflow(s) for linting/testing on pushes and PRs.

### `.vscode/` — editor settings (helpful defaults)
- points VS Code at your backend venv (when configured correctly)
- turns on format-on-save, pytest config, etc.

---

## How requests flow (mental model)

**Frontend** runs in the browser and calls the API:
- Browser → `http://localhost:5173` (Vite dev server)

**Backend** runs as a local server:
- API → `http://localhost:8000` (Uvicorn + FastAPI)

**Infra** is Docker:
- Postgres → `localhost:5432`
- Redis → `localhost:6379`

So when you add a car:
1) frontend sends HTTP request to backend
2) backend validates, authenticates, writes to Postgres
3) backend returns JSON
4) frontend updates the page

---

## Glossary (plain English)

### API
A set of URLs your frontend can call to do things like login, create cars, list cars.

### Endpoint / Route
A specific API URL + method, e.g.:
- `POST /api/auth/login`
- `GET /api/cars`

### HTTP methods (GET/POST/PATCH)
- **GET**: fetch data (read)
- **POST**: create something
- **PATCH**: update part of something

### JSON
The data format used between frontend and backend. Looks like:
```json
{ "registration_number": "AB12CDE", "make": "VW", "model": "ID.3" }
```

### ORM (Object-Relational Mapper)
A tool (SQLAlchemy) that lets you work with database rows as Python objects.

### Model (SQLAlchemy model)
A Python class representing a database table row, e.g. `Car`.

### Schema (Pydantic schema)
A Python class representing validated input/output data for an endpoint.

### Migration (Alembic migration)
A scripted change to the database structure (tables/columns/indexes).
You apply them with:
```bash
python -m alembic upgrade head
```

### JWT (JSON Web Token)
A signed token string that proves “this user is logged in”.
Frontend stores it and sends it on each request.

### CORS
A browser security rule: the backend must allow the frontend’s origin (domain/port).
In dev: allow `http://localhost:5173`.

### Linting (Ruff)
Automated style and correctness checks. Helps catch issues early.

### Tests (Pytest)
Automated checks that verify your code works (e.g., `GET /health` returns ok).

---

## Quick “what do I run?”

### Start everything (manual)
**Infra**
```bash
cd infra
docker compose up -d
```

**Backend**
```bash
cd backend
python -m alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm run dev -- --port 5173
```

### Run checks
```bash
cd backend
python -m ruff check .
python -m pytest
```
