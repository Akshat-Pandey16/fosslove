# FOSSLove

A catalog of free and open-source apps for **Windows and Linux**. Browse the catalog, pick
the apps you want, and download a single **ready-to-run install script** that uses the right
package manager for each one (winget, Microsoft Store, APT, DNF, pacman, Flatpak, Snap, or
direct download).

This is a two-app monorepo:

| App | Path | Stack |
| --- | --- | --- |
| **API** | [`apps/api`](apps/api) | Python 3.14 · FastAPI · Pydantic v2 · SQLAlchemy 2 (async) · PostgreSQL 18 · Redis · `uv` |
| **Web** | [`apps/web`](apps/web) | Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · TanStack Query · Bun |

See [CLAUDE.md](CLAUDE.md) for the full engineering guide and conventions.

## Features

- **Catalog** — search + filter apps by platform and category, per-app package sources.
- **Script builder** — collect apps across the catalog, generate one install script per platform.
- **Accounts** — favorites, named collections (public or private), and script history.
- **Public collections** — share a setup; anyone can install it in one go.
- **Admin panel** — full CRUD for categories and apps (with package references) plus
  **runtime settings** (feature flags, rate limits, email/SMTP, branding) editable without a redeploy.
- **Auth** — JWT access + rotating/revocable refresh tokens, Argon2id, optional email verification.

## Quick start (local dev)

Requires Docker, [`uv`](https://docs.astral.sh/uv/), and [Bun](https://bun.sh/).

```bash
make infra            # start postgres + redis in Docker (shared by the dev servers)

make api-install      # backend deps
make api-migrate      # create the schema
make api-seed         # load a sample catalog
make api-dev          # API on http://localhost:8001

make web-install      # frontend deps
make web-env          # create apps/web/.env.local
make web-dev          # web on http://localhost:3000
```

The backend's API docs live at `http://localhost:8001/api/v1/docs`.

## Quick start (full Docker stack)

```bash
make up               # postgres + redis + api (:8000) + web (:3000), migrations auto-run
make logs             # tail everything
make down             # stop
```

## Common commands

Run `make` for the full list. Backend targets are `api-<target>`, frontend `web-<target>`.

```bash
make api-check        # ruff + mypy + pytest
make web-check        # biome (lint + format) + tsc
make api-reset-db     # DESTRUCTIVE: drop schema, re-migrate, reset identities
make api-upgrade / make web-upgrade   # bump dependencies to latest
```

## Configuration

Backend config is env vars prefixed `FOSSLOVE_` (see [`apps/api/.env.example`](apps/api/.env.example)).
The frontend reads `NEXT_PUBLIC_API_BASE_URL` / `API_INTERNAL_URL` (see
[`apps/web/.env.example`](apps/web/.env.example)). A subset of backend settings is also
editable at runtime from the admin panel.
