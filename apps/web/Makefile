.DEFAULT_GOAL := help
SHELL := /bin/bash
BUN ?= bun

.PHONY: help
help:
	@echo "FOSSLove web — make targets:"
	@echo "  install     Install dependencies"
	@echo "  upgrade     Upgrade every dependency to latest"
	@echo "  env         Create .env.local from .env.example if missing"
	@echo "  dev         Run the dev server (:3000)"
	@echo "  build       Production build"
	@echo "  start       Run the production server"
	@echo "  lint        Lint + format check (biome)"
	@echo "  format      Auto-format and fix (biome)"
	@echo "  typecheck   Type-check (tsc)"
	@echo "  check       lint + typecheck"
	@echo "  clean       Remove build artifacts"

.PHONY: install
install:
	$(BUN) install

.PHONY: upgrade
upgrade:
	$(BUN) update --latest

.PHONY: env
env:
	@test -f .env.local || (cp .env.example .env.local && echo "Created .env.local")

.PHONY: dev
dev:
	$(BUN) run dev

.PHONY: build
build:
	$(BUN) run build

.PHONY: start
start:
	$(BUN) run start

.PHONY: lint
lint:
	$(BUN) run lint

.PHONY: format
format:
	$(BUN) run format

.PHONY: typecheck
typecheck:
	$(BUN) run typecheck

.PHONY: check
check: lint typecheck

.PHONY: clean
clean:
	rm -rf .next out node_modules/.cache
