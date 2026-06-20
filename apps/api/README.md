# FOSSLove — Backend

Production-grade async FastAPI backend for the FOSSLove catalog: browse free/open-source
apps, build collections, and generate ready-to-run install scripts (PowerShell for Windows,
POSIX shell for Linux).

See the repository root `README.md` for the full-stack overview and `CLAUDE.md` for
engineering conventions.

## Stack

Python 3.14 · FastAPI · Pydantic v2 · SQLAlchemy 2.0 (async) · asyncpg · PostgreSQL 18 ·
Redis (optional) · Alembic · SQLAdmin · structlog · `uv`.

## Quick start

```
make install     # create venv + install all extras
make env         # create .env from .env.example
make migrate     # apply migrations
make seed        # load sample catalog
make dev         # run with autoreload on :8001
make check       # ruff + mypy + pytest
```

## Database reset

```
make reset-db    # DESTRUCTIVE: drop schema, re-apply migrations, reset identities
make reseed      # reset-db + seed
```
