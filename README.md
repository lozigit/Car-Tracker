# CAR TRACK — Phase 0 Starter (Spec v1.2, no `uv`)

This repo scaffolds **Phase 0 (Project setup)** from the CAR TRACK spec:
- Monorepo layout (`backend/`, `frontend/`, `infra/`)
- FastAPI backend with a healthcheck
- React + TypeScript (Vite) frontend
- Docker Compose for Postgres + Redis
- GitHub Actions CI: lint + test + build
- VS Code recommendations for Windows 11

> Spec reference: `CARTRACKspec_v1.2.md`

---

## Repo layout

```
backend/   FastAPI API (Python)
frontend/  React web app (Vite + TS)
infra/     Docker compose + env examples
.github/   CI workflows
.vscode/   VS Code settings
```

---

## Prereqs (Windows 11)

- Python **3.13** installed (and `py` launcher available)
- Node **20+** and **pnpm**
- Docker Desktop
- VS Code

---

## Phase 0 — Step-by-step (no `uv`)

### 1) Clone and open in VS Code
```powershell
git clone <your repo url>
cd CARTRACK_v1.2_phase0_no_uv
code .
```

### 2) Start infrastructure (Postgres + Redis)
```powershell
cd infra
docker compose up -d
```

### 3) Backend (FastAPI)

Create and activate a virtual environment:

```powershell
cd ..\backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
pip install -e ".[dev]"
```

Run the API:
```powershell
python -m uvicorn app.main:app --reload --port 8000
```

Open:
- http://localhost:8000/health
- http://localhost:8000/docs

#### Backend lint/tests
```powershell
python -m ruff check .
python -m pytest
```

### 4) Frontend (Vite React + TS)
```powershell
cd ..\frontend
pnpm install
pnpm dev --port 5173
```

Open:
- http://localhost:5173

---

## CI expectations (GitHub Actions)

CI will run:
- Backend: ruff + pytest
- Frontend: pnpm lint + pnpm build

---

## Next: Phase 1
Once you’re happy everything boots, we’ll start:
- Auth + household creation
- Cars CRUD + archive
- DB models + migrations (Alembic)
