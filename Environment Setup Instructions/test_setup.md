1. Run tests

Open a terminal in root:

docker exec -it infra-db-1 psql -U cartrack -d postgres -c "DROP DATABASE IF EXISTS cartrack_test;"
docker exec -it infra-db-1 psql -U cartrack -d postgres -c "CREATE DATABASE cartrack_test;"

cd backend
.\.venv\Scripts\activate.bat
python -m ruff check .
python -m pytest

Notes

To run all tests --> pytest -q
To run one test file --> pytest -q tests\test_phase2_happy_path.py::test_phase2_happy_path
To run one test within a test file --> pytest -q tests\test_phase2_happy_path.py::\_signup
To see output use -s

You only need npm install again if package-lock.json changed or you deleted node_modules.

You only need alembic upgrade head when you pulled new migrations or reset the DB.
