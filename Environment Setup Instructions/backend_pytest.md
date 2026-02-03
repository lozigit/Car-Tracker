## 1) Do this
cd infra
docker compose up -d
cd ..

docker exec -it infra-db-1 psql -U cartrack -d postgres -c "DROP DATABASE IF EXISTS cartrack_test;"
docker exec -it infra-db-1 psql -U cartrack -d postgres -c "CREATE DATABASE cartrack_test;"

cd backend
.\.venv\Scripts\Activate.bat

To run all tests --> pytest -q
To run one test file --> pytest -q tests\test_phase2_happy_path.py::test_phase2_happy_path
To run one test within a test file --> pytest -q tests\test_phase2_happy_path.py::_signup
