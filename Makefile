.DEFAULT_GOAL := help
SHELL := /bin/bash

API_DIR := apps/api
WEB_DIR := apps/web
API_PORT ?= 8000
WEB_PORT ?= 5173

PGPORT ?= 5432
PGDATA ?= $(CURDIR)/.pgdata
PGUSER ?= fosslove
PGDATABASE ?= fosslove
PGSOCKET ?= /tmp/fosslove-pg
PG_BIN ?= $(shell d=$$(command -v pg_ctl 2>/dev/null); if [ -n "$$d" ]; then dirname $$d; else ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1; fi)

.PHONY: help
help:
	@echo "FOSSLove — monorepo (apps/api: Django, apps/web: React + Vite)"
	@echo ""
	@echo "Setup:"
	@echo "  install            Install backend and frontend dependencies"
	@echo "  env                Create .env files from the examples"
	@echo "  bootstrap          env + db-init + db-start + install + migrate + seed + admin"
	@echo ""
	@echo "Run:"
	@echo "  run-api            Run ONLY the Django dev server (:$(API_PORT))"
	@echo "  run-web            Run ONLY the Vite dev server (:$(WEB_PORT))"
	@echo "  run-all            Run both servers together"
	@echo "  run-api-prod       Run the API under gunicorn"
	@echo ""
	@echo "Database (local Postgres cluster, no Docker):"
	@echo "  db-init            Create a project-local Postgres cluster in .pgdata"
	@echo "  db-start           Start it on :$(PGPORT)"
	@echo "  db-stop            Stop it"
	@echo "  db-status          Show cluster status"
	@echo "  db-psql            Open psql against it"
	@echo "  db-logs            Tail the cluster log"
	@echo "  db-destroy         DESTRUCTIVE: stop and delete the cluster"
	@echo ""
	@echo "Backend shortcuts (any apps/api target works as api-<target>):"
	@echo "  migrate migrations seed reseed admin superuser shell reset-db static"
	@echo ""
	@echo "Quality:"
	@echo "  check              Run every check for both apps"
	@echo "  lint format typecheck test"
	@echo ""
	@echo "Dependencies:"
	@echo "  upgrade            Upgrade BOTH apps to the latest published versions"
	@echo "  api-upgrade        Raise Python floors to latest on PyPI, relock, sync"
	@echo "  web-upgrade        bun update --latest"
	@echo ""
	@echo ""
	@echo "API contract:"
	@echo "  schema             Regenerate openapi.json and the typed frontend client"
	@echo ""
	@echo "  clean              Remove caches and build artifacts"

.PHONY: install
install: api-install web-install

.PHONY: env
env:
	@$(MAKE) -C $(API_DIR) env
	@$(MAKE) -C $(WEB_DIR) env

.PHONY: bootstrap
bootstrap: env db-init db-start install
	@$(MAKE) api-migrate
	@$(MAKE) api-seed
	@$(MAKE) api-admin
	@echo "Bootstrap complete. Run: make run-api and make run-web (or make run-all)"

.PHONY: run-api
run-api:
	@$(MAKE) -C $(API_DIR) dev PORT=$(API_PORT)

.PHONY: run-api-prod
run-api-prod:
	@$(MAKE) -C $(API_DIR) run PORT=$(API_PORT)

.PHONY: run-web
run-web:
	@$(MAKE) -C $(WEB_DIR) dev PORT=$(WEB_PORT)

.PHONY: run-all
run-all:
	@echo "api  -> http://localhost:$(API_PORT)"
	@echo "web  -> http://localhost:$(WEB_PORT)"
	@trap "kill 0" EXIT INT TERM; \
	$(MAKE) run-api & \
	$(MAKE) run-web & \
	wait

.PHONY: db-init
db-init:
	@test -n "$(PG_BIN)" || (echo "PostgreSQL binaries not found. Install postgresql, or set PG_BIN." && exit 1)
	@if [ -d "$(PGDATA)" ]; then echo "Cluster already exists at $(PGDATA)"; else \
		mkdir -p "$(PGDATA)" "$(PGSOCKET)" && \
		$(PG_BIN)/initdb -D "$(PGDATA)" -U $(PGUSER) --auth=trust >/dev/null && \
		echo "Created cluster at $(PGDATA)"; fi

.PHONY: db-start
db-start:
	@mkdir -p "$(PGSOCKET)"
	@$(PG_BIN)/pg_ctl -D "$(PGDATA)" -o "-p $(PGPORT) -k $(PGSOCKET) -c listen_addresses=127.0.0.1" -l "$(PGDATA)/server.log" start >/dev/null 2>&1 || true
	@sleep 1
	@$(PG_BIN)/pg_isready -h 127.0.0.1 -p $(PGPORT) >/dev/null 2>&1 || (echo "Failed to start Postgres. See $(PGDATA)/server.log" && exit 1)
	@$(PG_BIN)/psql -h 127.0.0.1 -p $(PGPORT) -U $(PGUSER) -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='$(PGDATABASE)'" | grep -q 1 || \
		$(PG_BIN)/psql -h 127.0.0.1 -p $(PGPORT) -U $(PGUSER) -d postgres -c "CREATE DATABASE $(PGDATABASE) OWNER $(PGUSER)" >/dev/null
	@echo "Postgres ready on 127.0.0.1:$(PGPORT) (database: $(PGDATABASE))"

.PHONY: db-stop
db-stop:
	@$(PG_BIN)/pg_ctl -D "$(PGDATA)" stop >/dev/null 2>&1 && echo "Postgres stopped." || echo "Postgres was not running."

.PHONY: db-status
db-status:
	@$(PG_BIN)/pg_ctl -D "$(PGDATA)" status || true

.PHONY: db-psql
db-psql:
	@$(PG_BIN)/psql -h 127.0.0.1 -p $(PGPORT) -U $(PGUSER) -d $(PGDATABASE)

.PHONY: db-logs
db-logs:
	@tail -f "$(PGDATA)/server.log"

.PHONY: db-destroy
db-destroy: db-stop
	@rm -rf "$(PGDATA)" && echo "Removed $(PGDATA)"

.PHONY: check
check: api-check web-check

.PHONY: lint
lint: api-lint web-lint

.PHONY: format
format: api-format web-format

.PHONY: typecheck
typecheck: api-typecheck web-typecheck

.PHONY: test
test: api-test web-test

.PHONY: schema
schema:
	@$(MAKE) -C $(API_DIR) schema
	@$(MAKE) -C $(WEB_DIR) codegen

.PHONY: upgrade
upgrade: api-upgrade web-upgrade

.PHONY: clean
clean:
	@$(MAKE) -C $(API_DIR) clean
	@$(MAKE) -C $(WEB_DIR) clean

api-%:
	@$(MAKE) -C $(API_DIR) $*

web-%:
	@$(MAKE) -C $(WEB_DIR) $*
