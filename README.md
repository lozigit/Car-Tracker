# CAR TRACK — Phase 1 Starter (Spec v1.2, no `uv`)

Implements **Phase 1** from the spec:
1. Auth (signup/login), household creation, session handling (JWT bearer token)
2. Cars: create/edit/list/archive
3. Responsive UI shell (dashboard + car detail pages)
4. Basic validation + error handling

---

## Prereqs (Windows 11)
- Python **3.14**
- Node **20+**
- Docker Desktop (Linux containers)
- VS Code

---

## 1) Start infrastructure (Postgres + Redis)
```powershell
cd infra
docker compose up -d
```

---

## 2) Backend (FastAPI + Postgres + Alembic)

### Create venv + install
```powershell
cd ..\backend
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
pip install -e ".[dev]"
```

### Configure env
```powershell
copy .env.example .env
```

### Run migrations
```powershell
python -m alembic upgrade head
```

### Run API
```powershell
python -m uvicorn app.main:app --reload --port 8000
```

Open:
- http://localhost:8000/health
- http://localhost:8000/docs

---

## 3) Frontend (React + TS + Vite)
```powershell
cd ..\frontend
npm install
npm run dev -- --port 5173
```

Open:
- http://localhost:5173
