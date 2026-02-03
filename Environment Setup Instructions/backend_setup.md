0. Open repo root in VS Code
1. Start infra (Postgres + Redis)
   cd infra
   docker compose up -d

2. Backend: venv + deps + migrations + run API
   cd ..\backend
   .\.venv\Scripts\activate.bat
   pip install -e ".[dev]"
   copy .env.example .env
   python -m alembic upgrade head
   python -m uvicorn app.main:app --reload --port 8000
