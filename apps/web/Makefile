.DEFAULT_GOAL := help
SHELL := /bin/bash

BUN ?= bun
PORT ?= 5173

.PHONY: help
help:
	@echo "install      Install dependencies"
	@echo "upgrade      Update every dependency to the latest published version"
	@echo "env          Create .env from .env.example if missing"
	@echo "dev          Run the Vite dev server"
	@echo "build        Type-check and build for production"
	@echo "preview      Serve the production build"
	@echo "codegen      Regenerate the API types from apps/api/openapi.json"
	@echo "lint         Lint with ESLint"
	@echo "format       Lint and autofix with ESLint"
	@echo "typecheck    Type-check with TypeScript 7"
	@echo "test         Run the test suite"
	@echo "check        lint + typecheck + test + build"
	@echo "clean        Remove build output and caches"

.PHONY: install
install:
	$(BUN) install

.PHONY: upgrade
upgrade:
	$(BUN) update --latest

.PHONY: env
env:
	@test -f .env || (cp .env.example .env && echo "Created apps/web/.env")

.PHONY: dev
dev:
	$(BUN) run dev --port $(PORT)

.PHONY: build
build:
	$(BUN) run build

.PHONY: preview
preview:
	$(BUN) run preview

.PHONY: codegen
codegen:
	$(BUN) run codegen

.PHONY: lint
lint:
	$(BUN) run lint

.PHONY: format
format:
	$(BUN) run format

.PHONY: typecheck
typecheck:
	$(BUN) run typecheck

.PHONY: test
test:
	$(BUN) run test

.PHONY: check
check: lint typecheck test build

.PHONY: clean
clean:
	@rm -rf dist coverage node_modules/.vite
