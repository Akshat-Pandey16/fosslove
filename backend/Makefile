.DEFAULT_GOAL := help
SHELL := /bin/bash
UV ?= uv

.PHONY: help
help:
	@echo "FOSSLove — make targets:"
	@echo "  install     Create venv and install all (incl. dev) dependencies"
	@echo "  upgrade     Upgrade every dependency to its latest compatible version"
	@echo "  lock        Resolve and pin the dependency tree into uv.lock"
	@echo "  env         Create .env from .env.example if missing"
	@echo "  run         Run the API (no reload)"
	@echo "  dev         Run the API with autoreload"
	@echo "  lint        Lint with ruff"
	@echo "  format      Auto-format and fix with ruff"
	@echo "  typecheck   Static type-check with mypy"
	@echo "  test        Run the test suite"
	@echo "  test-cov    Run tests with coverage"
	@echo "  check       Run lint + typecheck + tests"
	@echo "  migrate     Apply all migrations"
	@echo "  downgrade   Roll back the last migration"
	@echo "  revision    Autogenerate a migration: make revision m=\"message\""
	@echo "  reset-db    DESTRUCTIVE: drop schema, re-apply migrations, reset identities"
	@echo "  reseed      DESTRUCTIVE: reset-db then load sample catalog data"
	@echo "  seed        Seed sample catalog data"
	@echo "  up          Start the full docker stack"
	@echo "  down        Stop the docker stack"
	@echo "  logs        Tail api logs"
	@echo "  clean       Remove caches and build artifacts"

.PHONY: install
install:
	$(UV) sync --all-extras

.PHONY: upgrade
upgrade:
	$(UV) lock --upgrade
	$(UV) sync --all-extras

.PHONY: lock
lock:
	$(UV) lock

.PHONY: env
env:
	@test -f .env || (cp .env.example .env && echo "Created .env — edit the secrets!")

.PHONY: run
run:
	$(UV) run uvicorn fosslove.main:app --host 0.0.0.0 --port 8001

.PHONY: dev
dev:
	$(UV) run uvicorn fosslove.main:app --host 0.0.0.0 --port 8001 --reload

.PHONY: lint
lint:
	$(UV) run ruff check src tests

.PHONY: format
format:
	$(UV) run ruff format src tests
	$(UV) run ruff check --fix src tests

.PHONY: typecheck
typecheck:
	$(UV) run mypy src

.PHONY: test
test:
	$(UV) run pytest

.PHONY: test-cov
test-cov:
	$(UV) run pytest --cov --cov-report=term-missing --cov-report=xml

.PHONY: check
check: lint typecheck test

.PHONY: migrate
migrate:
	$(UV) run alembic upgrade head

.PHONY: downgrade
downgrade:
	$(UV) run alembic downgrade -1

.PHONY: revision
revision:
	$(UV) run alembic revision --autogenerate -m "$(m)"

.PHONY: reset-db
reset-db:
	$(UV) run python -m fosslove.db.reset
	$(UV) run alembic upgrade head

.PHONY: reseed
reseed: reset-db seed

.PHONY: seed
seed:
	$(UV) run python -m fosslove.seed

.PHONY: up
up:
	docker compose up --build -d

.PHONY: down
down:
	docker compose down

.PHONY: logs
logs:
	docker compose logs -f api

.PHONY: clean
clean:
	rm -rf .pytest_cache .mypy_cache .ruff_cache htmlcov .coverage coverage.xml dist build
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
