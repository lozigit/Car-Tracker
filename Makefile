.PHONY: infra-up infra-down backend-dev backend-test backend-lint frontend-dev frontend-build

infra-up:
	cd infra && docker compose up -d

infra-down:
	cd infra && docker compose down

backend-dev:
	cd backend && python -m venv .venv && . .venv/bin/activate && pip install -U pip && pip install -e ".[dev]" && uvicorn app.main:app --reload --port 8000

backend-lint:
	cd backend && . .venv/bin/activate && ruff check .

backend-test:
	cd backend && . .venv/bin/activate && pytest

frontend-dev:
	cd frontend && pnpm install && pnpm dev --port 5173

frontend-build:
	cd frontend && pnpm install && pnpm build
