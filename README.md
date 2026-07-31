# FOSSLove

A catalog of free and open-source apps for **Windows and Linux**. Browse the catalog, pick
the apps you want, and download a single **ready-to-run install script** that uses the right
package manager for each one (winget, Microsoft Store, APT, DNF, pacman, Flatpak, Snap, or
direct download).

This is a two-app monorepo:

| App | Path | Stack |
| --- | --- | --- |
| **API** | [`apps/api`](apps/api) | Python 3.14 · Django 6 · Django REST Framework · PostgreSQL · Redis (optional) · `uv` |
| **Web** | [`apps/web`](apps/web) | React 19 · Vite 8 · TypeScript 7 · React Router 8 · TanStack Query · Bun |

See [CLAUDE.md](CLAUDE.md) for the full engineering guide and conventions.

## Features

- **Catalog** — fuzzy search and filtering by platform and category, per-app package sources.
- **Script builder** — collect apps across the catalog, generate one install script per platform.
- **Accounts** — favorites, named collections (public or private), and script history.
- **Public collections** — share a setup; anyone can install it in one go.
- **Admin** — full CRUD for categories and apps plus **runtime settings** (feature flags,
  rate limits, email/SMTP, branding) editable without a redeploy.
- **Auth** — JWT access + rotating/revocable refresh tokens, Argon2id, optional email
  verification.

## Requirements

[`uv`](https://docs.astral.sh/uv/), PostgreSQL 16+, and [Bun](https://bun.sh/) for the
frontend. There is **no Docker** in this repo — `make db-*` manages a project-local
PostgreSQL cluster for you.

## Quick start

```bash
make bootstrap        # env files + local Postgres + install + migrate + seed + admin user
make run-api          # API on http://localhost:8000
```

```bash
make run-web          # web on http://localhost:5173
make run-all          # both servers together
```

API docs are at `http://localhost:8000/api/v1/docs`, Django admin at
`http://localhost:8000/django-admin/`.

The frontend's API client is **generated** from the backend's OpenAPI schema, so the two stay
in sync by construction. After changing a serializer, view or route, run `make schema` — CI
fails if the committed schema or the generated client is stale.

> The web UI has no design language yet. Pages are semantic HTML over a minimal reset, built to
> prove the data, routing and auth layers work end to end.

If port 5432 is already taken, run the local cluster elsewhere:

```bash
make db-start PGPORT=5433      # then set FOSSLOVE_POSTGRES_PORT=5433 in apps/api/.env
```

## Common commands

Run `make` for the full list. Any backend target is available as `api-<target>`, any
frontend target as `web-<target>`.

```bash
make run-api / run-web / run-all / run-api-prod
make db-init / db-start / db-stop / db-status / db-psql / db-logs / db-destroy
make api-migrate / api-migrations / api-seed / api-reseed / api-superuser
make web-install / web-build / web-test / web-codegen
make check            # lint + format check + typecheck + tests for both apps
make schema           # regenerate openapi.json and the typed frontend client
make upgrade          # raise every dependency to the latest published version
```

## Configuration

Backend config is env vars prefixed `FOSSLOVE_` (see
[`apps/api/.env.example`](apps/api/.env.example)). A subset is also editable at runtime
from the admin API or the Django admin. Production startup is blocked by system checks if
insecure defaults are left in place.
