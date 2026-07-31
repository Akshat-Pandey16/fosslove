.DEFAULT_GOAL := help
SHELL := /bin/bash
UV ?= uv
PORT ?= 8000

.PHONY: help
help:
	@echo "FOSSLove API (Django) — targets:"
	@echo "  install      Create the venv and install all dependencies"
	@echo "  upgrade      Raise every dependency floor to the latest on PyPI, relock, sync"
	@echo "  lock         Re-resolve uv.lock without changing floors"
	@echo "  env          Create .env from .env.example if missing"
	@echo "  dev          Run the development server (:$(PORT))"
	@echo "  run          Run the production server via gunicorn"
	@echo "  shell        Django shell"
	@echo "  dbshell      Database shell"
	@echo "  migrate      Apply migrations"
	@echo "  migrations   Create migrations for model changes"
	@echo "  check-migrations  Fail if models drift from migrations"
	@echo "  seed         Load the bundled catalog fixtures"
	@echo "  reseed       Flush the catalog and reload fixtures"
	@echo "  admin        Create the bootstrap admin from .env"
	@echo "  superuser    Create a superuser interactively"
	@echo "  reset-db     DESTRUCTIVE: flush the database and re-migrate"
	@echo "  static       Collect static files"
	@echo "  lint         Lint with ruff"
	@echo "  format       Format and autofix with ruff"
	@echo "  typecheck    Type-check with mypy --strict"
	@echo "  test         Run the test suite"
	@echo "  test-cov     Run the test suite with coverage"
	@echo "  check        lint + format check + typecheck + test"
	@echo "  clean        Remove caches and build artifacts"

.PHONY: install
install:
	$(UV) sync --all-extras

.PHONY: upgrade
upgrade:
	$(UV) run python scripts/upgrade_deps.py
	$(UV) lock --upgrade
	$(UV) sync --all-extras

.PHONY: lock
lock:
	$(UV) lock

.PHONY: env
env:
	@test -f .env || (cp .env.example .env && echo "Created .env — edit the secrets!")

.PHONY: dev
dev:
	$(UV) run python manage.py runserver 0.0.0.0:$(PORT)

.PHONY: run
run:
	$(UV) run gunicorn fosslove.conf.wsgi:application --bind 0.0.0.0:$(PORT) --workers 4

.PHONY: shell
shell:
	$(UV) run python manage.py shell

.PHONY: dbshell
dbshell:
	$(UV) run python manage.py dbshell

.PHONY: migrate
migrate:
	$(UV) run python manage.py migrate

.PHONY: migrations
migrations:
	$(UV) run python manage.py makemigrations

.PHONY: check-migrations
check-migrations:
	$(UV) run python manage.py makemigrations --check --dry-run

.PHONY: seed
seed:
	$(UV) run python manage.py seed_catalog

.PHONY: reseed
reseed:
	$(UV) run python manage.py seed_catalog --flush

.PHONY: admin
admin:
	$(UV) run python manage.py ensure_admin

.PHONY: superuser
superuser:
	$(UV) run python manage.py createsuperuser

.PHONY: reset-db
reset-db:
	$(UV) run python manage.py flush --no-input
	$(UV) run python manage.py migrate

.PHONY: schema
schema:
	$(UV) run python manage.py spectacular --format openapi-json --validate --fail-on-warn --file openapi.json
	@echo "Wrote apps/api/openapi.json"

.PHONY: static
static:
	$(UV) run python manage.py collectstatic --no-input

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
check:
	$(UV) run ruff check src tests
	$(UV) run ruff format --check src tests
	$(UV) run mypy src
	$(UV) run pytest

.PHONY: clean
clean:
	rm -rf .pytest_cache .mypy_cache .ruff_cache htmlcov .coverage coverage.xml dist build staticfiles
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
