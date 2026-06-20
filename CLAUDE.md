# CLAUDE.md

Guidance for working in this repository. Read this first.

## What FOSSLove is

A production-grade backend for a catalog of free/open-source apps (Windows + Linux),
grouped into categories. Users browse the catalog, select apps, and the API generates a
ready-to-run **install script** (PowerShell for Windows, POSIX shell for Linux) that
installs everything via the right package manager. This is a full ground-up rewrite of an
older, poorly-structured FastAPI prototype.

## Hard project conventions (do not violate)

- **No comments. No docstrings. Anywhere.** Code must be self-explanatory through naming
  and structure. The only exception is load-bearing tooling pragmas (`# type: ignore`,
  `# noqa`, `# pragma: no cover`) and they should be avoided where the code can be
  restructured to not need them. This applies to Python, config files, Dockerfiles, YAML —
  everything. (Markdown docs like this file are documentation, not comments.)
- **Always latest dependencies.** `pyproject.toml` uses `>=` lower-bound floors only — never
  exact `==` pins. The resolved tree lives in `uv.lock`. Run `make upgrade` to pull the
  newest compatible versions of everything. When adding a dep, set the floor to the current
  latest from PyPI.
- **Strict everything.** `ruff` (lint + format) and `mypy --strict` must pass. Tests
  (`pytest`) treat warnings as errors.
- **Async end to end.** SQLAlchemy 2.0 async + asyncpg. No sync DB calls in request paths.
- **src layout.** All app code under `src/fosslove/`. First-party import root is `fosslove`.

## Tech stack (June 2026)

- **Runtime:** Python 3.14 (floor 3.13). `uv` manages the interpreter + venv + lockfile.
- **Web:** FastAPI 0.138 on Starlette 1.x, Uvicorn (uvloop + httptools).
- **Validation/serialization:** Pydantic v2.13. We rely on FastAPI's native Pydantic-v2
  JSON serialization (Rust `pydantic-core`) via return-type annotations / `response_model`.
  **No orjson** — `ORJSONResponse`/`UJSONResponse` are deprecated as of FastAPI 0.131, and
  adding orjson forces a slower `pydantic→dict→orjson→bytes` detour.
- **DB:** PostgreSQL 18, SQLAlchemy 2.0.51 (async), Alembic migrations. `pg_trgm` for
  fuzzy app search; `JSONB` for flexible per-manager package metadata.
- **Cache / rate-limit store:** Redis (server 8; redis-py 8.x — latest). **Optional**, with
  a graceful in-memory fallback so the API runs without it (single-process only).
- **Background jobs / scheduler:** none currently — deliberately. Category counts are kept
  correct by a `before_flush` DB event (every write path), and transactional emails
  (verify/reset) use FastAPI `BackgroundTasks`, so nothing needs a broker today. Periodic
  maintenance (recompute counts, expired-token cleanup) is exposed as on-demand admin
  endpoints (`POST /admin/recompute-counts`, `POST /admin/cleanup-tokens`), which a
  cron/k8s-CronJob can call. **If a queue or scheduler becomes necessary** (durable email
  delivery, bulk imports, webhooks, periodic dead-link/package-availability checks), pick
  the option that best fits the scenario at that time — evaluate the field (e.g. arq, saq,
  taskiq, dramatiq, Celery, or a Postgres-backed queue) rather than defaulting to one.
  Note: saq/arq cap redis-py `<8`, so adding one may require lowering the redis floor.
- **Auth:** PyJWT (access + rotating/revocable refresh tokens) + argon2-cffi (Argon2id).
- **Admin UI:** SQLAdmin at `/admin` — a Django-admin-style web UI on our SQLAlchemy
  models, auth-gated to admin users, so staff add/edit catalog apps without touching code.
- **Logging:** structlog (JSON in prod, console in dev), request-id bound per request.
- **Email:** aiosmtplib (pluggable `console` / `smtp` backends).
- **Tooling:** ruff, mypy, pytest (+asyncio/cov/mock), httpx, faker, factory-boy.

## Why FastAPI, not Django

This is an API backend for a separate SPA frontend (CORS to :3000/:5173), the workload is
async-shaped (async DB + httpx fan-out for package checks), and Pydantic + auto-OpenAPI +
DI are central. Django's templating/admin/monolith strengths don't apply; its async story
is still partial. The one thing Django would give free — the admin panel — we get via
SQLAdmin without adopting Django.

## Auth & access model

- **Anonymous** users: browse catalog, generate scripts.
- **Signed-up** users (extra features): saved app **collections** (named bundles),
  **favorites**, and script **generation history**.
- **Admin** role: catalog management (categories, apps, package refs) + the SQLAdmin UI.
- Email verification on signup; password reset; refresh-token rotation with server-side
  revocation (a `jti` per refresh token is persisted).

## Data model (high level)

- `users`, `refresh_tokens`, `verification_tokens` (email-verify + password-reset).
- `categories` (with denormalized `windows_app_count` / `linux_app_count`, maintained
  transactionally + a periodic recompute task to fix drift).
- `apps` (one table, `platform` enum = windows|linux; unique `(category_id, platform, name)`).
- `package_references` (per-app rows: `manager` enum = winget|msstore|apt|dnf|pacman|
  flatpak|snap|direct, `identifier`, optional `extra` JSONB). The script engine picks the
  best available manager per app, with fallbacks. Direct-download is the last resort.
- `collections` + `collection_apps` (ordered M2M), `favorites`, `script_runs` (history).

## Script generation

- Windows → `install_apps.ps1`: per app try winget → MS Store → direct download (silent).
- Linux → `install_apps.sh`: detect distro/manager (apt/dnf/pacman) + flatpak/snap; per app
  try flatpak → native → snap → direct.
- Output is streamed as a file download. Authenticated runs are recorded to history.

## Layout

```
src/fosslove/
  core/        config, logging, security, exceptions, cache, ratelimit, middleware, pagination
  db/          engine/session, Base, models/
  schemas/     Pydantic request/response models
  services/    business logic (take an AsyncSession)
  scriptgen/   windows + linux script builders
  api/         deps + v1 routers + app factory
  admin/       SQLAdmin views + auth backend
  seed.py      idempotent sample-catalog seeding
migrations/    Alembic (async env.py)
tests/         pytest suite (httpx ASGITransport against a test Postgres)
```

## Common commands

```
make install     # uv sync --all-extras
make upgrade     # bump every dependency to latest + re-sync
make dev         # uvicorn with reload
make migrate     # alembic upgrade head
make revision m="..."   # autogenerate a migration
make seed        # load sample catalog data
make check       # ruff + mypy + pytest
make up / make down     # full docker stack (api + postgres + redis)
```

## Config

All settings are env vars prefixed `FOSSLOVE_`, loaded via pydantic-settings from `.env`
(see `.env.example`). Production boot fails fast on insecure defaults (placeholder secret,
`DEBUG=true`, wildcard hosts). Generate a secret with
`python -c "import secrets; print(secrets.token_urlsafe(64))"`.
