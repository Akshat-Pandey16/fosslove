.DEFAULT_GOAL := help
SHELL := /bin/bash

.PHONY: help
help:
	@echo "FOSSLove — root targets (orchestrates apps/api + apps/web):"
	@echo "  install        Install backend + frontend dependencies"
	@echo "  dev            Run backend (:8001) and frontend (:3000) together"
	@echo "  check          Backend checks (ruff+mypy+pytest) + frontend checks (lint+typecheck)"
	@echo "  build          Build the frontend for production"
	@echo "  up / down      Start / stop the full docker stack (api + web + postgres + redis)"
	@echo "  logs           Tail docker logs for all services"
	@echo ""
	@echo "  be-<target>    Run an apps/api Makefile target  (e.g. make be-migrate, make be-reseed)"
	@echo "  fe-<target>    Run an apps/web Makefile target  (e.g. make fe-build, make fe-lint)"

.PHONY: install
install:
	$(MAKE) -C apps/api install
	$(MAKE) -C apps/web install

.PHONY: dev
dev:
	@trap 'kill 0' EXIT INT TERM; \
	$(MAKE) -C apps/api dev & \
	$(MAKE) -C apps/web dev & \
	wait

.PHONY: check
check:
	$(MAKE) -C apps/api check
	$(MAKE) -C apps/web check

.PHONY: build
build:
	$(MAKE) -C apps/web build

.PHONY: up
up:
	docker compose up --build -d

.PHONY: down
down:
	docker compose down

.PHONY: logs
logs:
	docker compose logs -f

be-%:
	$(MAKE) -C apps/api $*

fe-%:
	$(MAKE) -C apps/web $*
