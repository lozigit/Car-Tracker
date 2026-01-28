0) Open repo root in VS Code
1) Start infra (Postgres + Redis)
cd infra
docker compose up -d

2) Backend: venv + deps + migrations + run API
cd ..\backend
.\.venv\Scripts\activate.bat
pip install -e ".[dev]"
copy .env.example .env
python -m alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000


(Leave that terminal running.)

3) Frontend: install deps + run

Open a second terminal:

cd frontend
npm install
npm run dev -- --port 5173

4) Run tests

Open a third terminal (or stop uvicorn if you prefer), from backend\:

cd backend
.\.venv\Scripts\activate.bat
python -m ruff check .
python -m pytest

Notes

You only need npm install again if package-lock.json changed or you deleted node_modules.

You only need alembic upgrade head when you pulled new migrations or reset the DB.
