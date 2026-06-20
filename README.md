# FOSSLove

A production-grade backend for a catalog of free & open-source apps (Windows + Linux).
Browse the catalog, pick apps, and get a ready-to-run **install script** that installs
everything through the right package manager (winget / MS Store on Windows;
flatpak / apt / dnf / pacman / snap on Linux).

## Features

- **Catalog**: categories + apps with per-manager package identifiers and a direct-download
  fallback. Fast, typo-tolerant search (Postgres `pg_trgm`).
- **Install-script generation**: `install_apps.ps1` (PowerShell) and `install_apps.sh`
  (POSIX shell) with per-app manager fallback, progress, timing and a summary.
- **Accounts**: register / verify email / login (JWT access + rotating, revocable refresh
  tokens) / password reset. Anonymous users can browse and generate scripts; signed-up
  users also get **collections**, **favorites**, and script **history**.
- **Admin**: role-gated JSON API plus a point-and-click **admin UI** at `/admin` (SQLAdmin)
  to manage the catalog without touching code.
- **Production concerns**: structured JSON logging, request IDs, rate limiting (Redis or
  in-memory), graceful Redis-optional caching, health & readiness probes, strict validated
  config that fails fast on insecure production settings.
- **Background jobs** (saq): periodic count recompute and expired-token cleanup.

## Tech stack

Python 3.14 · FastAPI · Pydantic v2 · SQLAlchemy 2.0 (async) · asyncpg · PostgreSQL 18 ·
Alembic · Redis 7 · saq · PyJWT + Argon2 · structlog · uv · ruff · mypy · pytest.

## Quickstart (Docker)

```bash
cp .env.example .env        # then edit FOSSLOVE_SECRET_KEY at minimum
make up                     # builds + starts postgres, redis, migrate, api, worker
```

- API + docs: http://localhost:8000/api/v1/docs
- Admin UI: http://localhost:8000/admin (log in with the bootstrap admin — set
  `FOSSLOVE_FIRST_ADMIN_EMAIL` / `FOSSLOVE_FIRST_ADMIN_PASSWORD` in `.env`)
- Health: http://localhost:8000/health · Readiness: http://localhost:8000/health/ready

## Quickstart (local)

```bash
make install                # uv venv + all deps (provisions Python 3.14)
make env                    # create .env from the example
# point FOSSLOVE_POSTGRES_* at a running Postgres, then:
make migrate                # apply schema
make seed                   # load sample catalog
make dev                    # uvicorn with reload (port 8001)
```

Generate a strong secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

## Common tasks

```bash
make upgrade     # bump every dependency to its latest compatible version + relock
make check       # ruff + mypy + pytest
make revision m="add X"   # autogenerate a migration
make worker      # run the saq background worker
make logs        # tail api + worker (docker)
make help        # list everything
```

## Generating a script

```bash
curl -X POST http://localhost:8000/api/v1/scripts/generate \
  -H 'content-type: application/json' \
  -d '{"platform": "windows", "app_ids": [1, 2, 3]}' -o install_apps.ps1
```

`platform` is `windows` or `linux`. Provide `app_ids` (a flat list) or a `collection_id`.
Authenticated requests are recorded to the user's history.

## Configuration

All settings are environment variables prefixed `FOSSLOVE_`, loaded from `.env`
(see `.env.example`). In `production` the app refuses to start with a placeholder secret,
`DEBUG=true`, or wildcard allowed hosts.

## Project layout

```
src/fosslove/
  core/        config, logging, security, exceptions, cache, ratelimit, middleware
  db/          async engine/session, Base, models, event-driven count maintenance
  schemas/     Pydantic request/response models
  services/    business logic (async, take an AsyncSession)
  scriptgen/   Windows + Linux script builders
  api/         dependencies + v1 routers + app factory + health
  admin/       SQLAdmin views + auth backend
  worker/      saq settings + periodic tasks
migrations/    Alembic (async)
tests/         pytest suite (httpx against a test Postgres)
```

See [CLAUDE.md](CLAUDE.md) for architecture decisions and contributor conventions.

## License

MIT
