.DEFAULT_GOAL := help
SHELL := /bin/bash

.PHONY: help
help:
	@echo "FOSSLove — monorepo (apps/api + apps/web)"
	@echo ""
	@echo "Docker infra (shared by the docker stack AND local dev servers):"
	@echo "  infra          Start ONLY postgres + redis (detached) for local dev"
	@echo "  infra-down     Stop postgres + redis"
	@echo "  infra-logs     Tail postgres + redis logs"
	@echo "  up             Start the FULL docker stack (api + web + postgres + redis)"
	@echo "  down           Stop the full docker stack"
	@echo "  logs           Tail all docker logs"
	@echo ""
	@echo "Backend  (delegates to apps/api/Makefile):"
	@echo "  api-<target>   e.g. api-install api-dev api-migrate api-seed api-check api-reset-db"
	@echo ""
	@echo "Frontend (delegates to apps/web/Makefile):"
	@echo "  web-<target>   e.g. web-install web-dev web-build web-lint web-check"
	@echo ""
	@echo "Run 'make api-help' or 'make web-help' to list each app's own targets."

.PHONY: infra
infra:
	docker compose up -d postgres redis

.PHONY: infra-down
infra-down:
	docker compose stop postgres redis

.PHONY: infra-logs
infra-logs:
	docker compose logs -f postgres redis

.PHONY: up
up:
	docker compose up --build -d

.PHONY: down
down:
	docker compose down

.PHONY: logs
logs:
	docker compose logs -f

api-%:
	$(MAKE) -C apps/api $*

web-%:
	$(MAKE) -C apps/web $*
