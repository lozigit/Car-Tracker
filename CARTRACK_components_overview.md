# CAR TRACK — Components Overview (Phase 1)

## Big picture

CAR TRACK is split into **three parts** that you run together during development:

- **infra**: the supporting services your app needs (database, cache)
- **backend**: your Python API (FastAPI) that talks to the database and implements rules
- **frontend**: the website users click around in (React) that calls the API

Think of it like:

**Browser UI (frontend)** → calls → **Python API (backend)** → reads/writes → **Postgres (infra)**  
…and **Redis (infra)** is there for fast “short-term” storage later (sessions, rate limiting, background jobs, etc).

---

## Infra (Docker: Postgres + Redis)

### Postgres (database)
- This is where your **real data lives**: users, households, cars, later renewals, documents, etc.
- It’s a relational database (tables, constraints, relationships).
- In dev, Docker runs it so you don’t need to install Postgres locally.

**Why it matters:**  
When you create a car in the UI, the backend stores it in Postgres. When you reload the page tomorrow, it’s still there because Postgres persisted it.

### Redis (cache / fast store)
- A very fast in-memory key/value store.
- In Phase 1 you might not “use” it yet, but we bring it up because it’s commonly needed soon for:
  - rate limiting login attempts
  - caching API lookups
  - background job queues (e.g., reminder emails)
  - session-ish data if you later go that way

**Key point:** Redis is usually **not your source of truth**; Postgres is.

### Docker Compose
- The `docker compose up -d` command starts both services together.
- Docker also creates a “volume” so your Postgres data survives restarts.

---

## Backend (Python: FastAPI + SQLAlchemy + Alembic)

This is the **engine room** of the app.

### FastAPI (web framework)
- Defines your HTTP API:
  - endpoints like `POST /api/auth/login` or `GET /api/cars`
- Handles:
  - routing (which function runs for which URL)
  - request validation (via Pydantic models)
  - JSON responses
  - auth dependency injection (`Depends(...)`)

When you run:

```bash
python -m uvicorn app.main:app --reload
```

…you’re starting a local web server on `http://127.0.0.1:8000`.

### Pydantic (data validation + schemas)
- Pydantic models describe the “shape” of data coming in and out.
- Example: `SignupRequest` requires a valid email + password length rules.
- If the frontend sends invalid JSON, Pydantic rejects it automatically with a clear error response.

### SQLAlchemy (database layer / ORM)
- SQLAlchemy maps Python classes to database tables.
- Example: `Car` class ↔ `cars` table.
- You create/update/query objects, and SQLAlchemy turns that into SQL for Postgres.

**Why ORM is handy:**
- relationships become easier later (e.g., a car has renewals, documents, etc.)
- constraints and indexes can be expressed cleanly

### Alembic (database migrations)
- Migrations are “version control for your database schema”.
- When you change models (add a column/table), you create a migration so every environment can update consistently.

Apply migrations with:

```bash
python -m alembic upgrade head
```

### Auth approach in Phase 1 (JWT)
- Login returns an **access token** (a JWT).
- Frontend stores it in `localStorage`.
- Each API call includes:
  - `Authorization: Bearer <token>`
- Backend verifies token on protected routes.

### Ruff + Pytest
- **Ruff**: linting (style + bug prevention) and auto-fixes for some upgrades.
- **Pytest**: runs automated tests (Phase 1 starts small, grows over time).

---

## Frontend (React + TypeScript + Vite)

This is the **user interface** in the browser.

### React (UI framework)
- Pages are components.
- React handles:
  - rendering forms and lists
  - routing between pages (Dashboard → Car Detail)
  - managing UI state (loading, errors, inputs)

### TypeScript (typed JavaScript)
- Adds type safety so it’s harder to make silly mistakes.
- You’ll see types like:

```ts
type Car = { id: string; registration_number: string; ... }
```

### Vite (dev server + bundler)
- Runs the dev server on `http://localhost:5173`
- Hot reloads the UI when you save a file.

### How frontend talks to backend
There’s a small API helper (fetch wrapper) that:
- adds JSON headers
- attaches the bearer token automatically
- throws a useful error if the API call fails

---

## How it all fits together (example: “Add Car”)

When you click **Add Car** in the UI:

1) **Frontend** sends `POST /api/cars` with JSON payload  
2) **Backend**:
   - checks JWT token (are you logged in?)
   - finds your household (Phase 1 shortcut)
   - validates payload (Pydantic)
   - writes to Postgres (SQLAlchemy)  
3) **Postgres** stores the row  
4) Backend returns JSON  
5) Frontend updates the UI

---

## What you’ll typically run day-to-day

- **Infra**: `docker compose up -d` (rarely changes once running)
- **Backend**: `uvicorn ... --reload` (runs while coding)
- **Frontend**: `npm run dev` (runs while coding)

And when schema changes:
- `alembic upgrade head`

Before commits / when debugging:
- `ruff check .`
- `pytest`
