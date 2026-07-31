# CLAUDE.md

Guidance for working in this repository. Read this first.

## What FOSSLove is

A production-grade **monorepo** for a catalog of free/open-source apps (Windows + Linux),
grouped into categories. Users browse the catalog, select apps, and the API generates a
ready-to-run **install script** (PowerShell for Windows, POSIX shell for Linux) that
installs everything via the right package manager.

It is a two-app monorepo:

- **`apps/api`** — the Django + DRF backend (Python 3.14, uv).
- **`apps/web`** — the React + Vite frontend (TypeScript 7, Bun).

A root `Makefile` orchestrates both and manages a project-local PostgreSQL cluster.
There is **no Docker in this repository** — deployment will be addressed separately.

## Hard project conventions (do not violate)

- **No comments. No docstrings. Anywhere.** Code must be self-explanatory through naming
  and structure. The only exception is load-bearing tooling pragmas (`# type: ignore`,
  `# noqa`, `# pragma: no cover`) and they should be avoided where the code can be
  restructured to not need them. This applies to Python, config files, YAML — everything.
  (Markdown docs like this file are documentation, not comments.)
- **Use framework and library idioms, never hand-rolled equivalents.** If Django, DRF, or a
  library already solves it, use their helper. Do not reimplement pagination, throttling,
  password hashing, token rotation, email delivery, filtering, or validation.
- **`APIView` only.** Every endpoint is a `rest_framework.views.APIView` subclass with
  explicit `get` / `post` / `patch` / `delete` methods. **No ViewSets, no routers, no
  generic views.** URLs are declared explicitly with `path()`.
- **No `PUT` endpoints.** Partial updates use `PATCH`.
- **Always latest dependencies.** `pyproject.toml` uses `>=` lower-bound floors only — never
  exact `==` pins. `make api-upgrade` raises every floor to the newest release on PyPI,
  relocks, and syncs. The resolved tree lives in `uv.lock`.
- **Strict everything.** `ruff` (lint + format) and `mypy --strict` must pass with zero
  findings. Tests (`pytest`) treat warnings as errors. Adhere to what the linters say —
  fix the code rather than blanket-ignoring rules; scope any ignore to the narrowest path.
- **The database is the source of truth for invariants.** Constraints, partial and
  functional indexes, and triggers live in the schema, not only in Python.
- **src layout.** Backend code under `apps/api/src/fosslove/`. First-party import root is
  `fosslove`.

## Tech stack (backend, July 2026)

- **Runtime:** Python 3.14 (floor 3.13). `uv` manages the interpreter, venv, and lockfile.
- **Web:** Django 6.0 + Django REST Framework 3.17, served by gunicorn (WSGI).
- **DB:** PostgreSQL, `psycopg` 3 with a connection pool. `pg_trgm` + `btree_gin` extensions.
- **Auth:** `djangorestframework-simplejwt` with rotating refresh tokens and
  `token_blacklist` (rotation + reuse rejection come from the library, not custom code).
  Passwords use Django's `Argon2PasswordHasher`.
- **Email tokens:** Django's `PasswordResetTokenGenerator` and `django.core.signing`. There
  is **no verification-token table** — single use is enforced by hashing mutable user state
  (a used link dies because `is_verified` / the password hash / the email changed).
- **Cache + throttling:** Django's cache framework (Redis when `FOSSLOVE_REDIS_URL` is set,
  in-memory otherwise). Rate limiting is DRF throttling with runtime-editable rates.
- **Filtering/search:** `django-filter`, with real trigram fuzzy search via
  `TrigramWordSimilarity` ranked by similarity (a typo like `firefx` matches `Firefox`).
- **Triggers:** `django-pgtrigger` maintains the denormalized category counters in the
  database, so bulk `.update()` / `.delete()` / `bulk_create()` can never cause drift.
- **Singleton config:** `django-solo` for the runtime-editable settings row.
- **Admin:** Django admin at `/django-admin/`.
- **OpenAPI:** `drf-spectacular` at `/api/v1/schema`, `/api/v1/docs`, `/api/v1/redoc`.
- **Logging:** `structlog` (JSON in prod, console in dev), request-id bound per request.
- **Metrics:** `django-prometheus` at `/metrics`.
- **Tooling:** ruff, mypy (+ django-stubs, djangorestframework-stubs), pytest,
  pytest-django, pytest-cov, model-bakery.

## Frontend

React 19.2 + Vite 8 (Rolldown) + React Router 8 + TanStack Query 5, Bun as package manager and
toolchain. Nothing from the previous Next.js frontend was carried over.

### Two TypeScript versions, deliberately

TypeScript 7 is the native Go compiler and **ships no JavaScript compiler API**, so
`typescript-eslint` and `openapi-typescript` cannot run under it. TypeScript 6.0.3 is the last
release that exposes that API. Both are installed:

- `typescript-native` (npm alias of `typescript@7.0.2`) — type-checks the project.
- `typescript@6.0.3` — what ESLint, `openapi-typescript` and editors resolve.

Do not "fix" this by deleting one of them; the ecosystem needs both until typescript-eslint
supports TS ≥ 7.1.

### The API client is generated

`apps/api/openapi.json` is committed, and `apps/web/src/api/schema.d.ts` is generated from it
by `openapi-typescript`. **Never hand-edit either file.** All requests go through
`openapi-fetch`, so paths, query parameters, bodies and responses are checked against the real
contract at compile time. After any backend change to a serializer, view or route, run
`make schema`. CI fails when either file is stale.

Because of this, DRF views must declare accurate schemas: paginated endpoints use
`paginated(...)` and `page_parameters(...)` from `fosslove.core.schema`, and no endpoint may
declare a bare `dict` response — `tests/test_schema.py` enforces both.

### Auth

Tokens live in `localStorage`; `authFetch` attaches the access token and, on a 401, refreshes
once and replays the request. The refresh is **single-flight** — this is a correctness
requirement, not an optimisation, because the API rotates refresh tokens and blacklists the
previous one, so parallel refreshes would invalidate each other.

### Design status

The design language is **not built yet**. Pages are semantic HTML over a minimal CSS reset,
present only to prove the data, routing and auth layers work end to end. No styling system has
been chosen — that is a deliberate open decision, not an oversight.

## App layout

Each Django app owns its models, serializers, views, urls, and admin.

```
apps/api/
  manage.py
  openapi.json                  committed API contract; regenerate with `make schema`
  pyproject.toml  uv.lock  Makefile  .env.example
  scripts/upgrade_deps.py       raises dependency floors to the latest on PyPI
  src/fosslove/
    conf/         settings, urls, wsgi, asgi
    core/         cache, auth helpers, exceptions, logging, middleware, pagination,
                  permissions, request helpers, slugs, throttling, checks, health views
    accounts/     User, SessionMetadata, auth + profile endpoints, token generators, emails
    catalog/      Category, App, PackageReference, triggers, filters, public + admin endpoints
    userdata/     Collection, CollectionApp, Favorite, ScriptRun, script generation
    siteconfig/   SiteConfiguration singleton (runtime-editable settings)
    activity/     ActivityLog + audit endpoints
    scriptgen/    Windows + Linux script builders (framework-agnostic)
  tests/          pytest-django suite

apps/web/
  package.json  bun.lock  Makefile  .env.example
  vite.config.ts  vitest.config.ts  tsconfig.json  eslint.config.js
  src/
    api/          generated schema.d.ts, openapi-fetch client, token store, ApiError
    auth/         AuthProvider, context, useAuth
    features/     one folder per domain, each exposing typed TanStack Query hooks
    query/        QueryClient factory, query-key registry
    routes/       router, layout, auth guard, pages
    styles/       base reset
    test/         Vitest setup
```

## URL surface

Everything is under `/api/v1/`, declared with explicit `path()` entries and namespaced
`include()`s:

- `auth/` — register, login, refresh, logout, verify-email, resend-verification,
  password-reset, password-reset/confirm, email-change/confirm
- `user/` — profile (`GET`/`PATCH`/`DELETE`), change-password, email, sessions,
  sessions/`<id>`, export
- `categories`, `categories/<id>`, `categories/by-slug/<slug>`
- `apps`, `apps/<id>`, `apps/by-slug/<platform>/<slug>`
- `collections`, `collections/public`, `collections/<id>`, `collections/<id>/apps`
- `favorites`, `favorites/ids`, `favorites/<app_id>`
- `scripts/generate`, `scripts/history`
- `admin/` — categories, apps, apps/import, catalog/export, recompute-counts, activity,
  settings, cleanup-tokens

Outside the versioned prefix: `/`, `/health`, `/health/ready`, `/metrics`, `/django-admin/`.

## Data model

- `accounts_user` — UUID pk, email with a **functional unique index on `LOWER(email)`**
  (case-insensitive without a nondeterministic collation, so `LIKE` and admin search still
  work). `is_staff` is the admin flag; the API exposes it as a computed `role`.
- `accounts_sessionmetadata` — 1:1 sidecar on simplejwt's `OutstandingToken` holding
  user agent / IP / last-used. The blacklist remains the single source of truth for
  whether a session is valid.
- `catalog_category` — denormalized `windows_app_count` / `linux_app_count`, non-negative
  check constraints, maintained by **database triggers**.
- `catalog_app` — `platform` choices, unique `(category, platform, name)` and
  `(platform, slug)`, a partial index for active rows, and GIN trigram indexes on
  `name` and `summary`.
- `catalog_packagereference` — unique `(app, manager)`, non-negative priority.
- `userdata_collection` / `userdata_collectionapp` / `userdata_favorite` — the join tables
  use **composite primary keys** (`CompositePrimaryKey`), no surrogate ids.
- `userdata_scriptrun` — `app_ids` is a typed Postgres **array**, not JSON.
- `activity_activitylog` — audit trail with indexes for the filters the admin UI exposes.
- `siteconfig_siteconfiguration` — single row; every column is nullable and `NULL` means
  "inherit the environment value".

Every paginated query uses an explicit `order_by` ending in a unique tiebreaker so
pagination is deterministic.

## Auth and access model

- **Anonymous**: browse the catalog, generate scripts.
- **Signed-up**: collections, favorites, script history (requires a verified email).
- **Staff**: catalog management, runtime settings, activity log, Django admin.
- Access + rotating refresh tokens; reusing a rotated refresh token is rejected because
  rotation blacklists the old one.
- **Email is gated by `FOSSLOVE_EMAIL_ENABLED` (default off).** While off, new users are
  auto-verified and the verify/reset/change flows short-circuit.

## Runtime settings

A subset of config is editable at runtime via `GET`/`PATCH /api/v1/admin/settings` and the
Django admin: feature flags, rate limits, email/SMTP, and branding. These live in the
typed single-row `siteconfig_siteconfiguration` table that **overlays** the env defaults —
a `NULL` column inherits from the environment. Security- and startup-bound settings stay
env-only: `SECRET_KEY`, database connection, `CORS_ORIGINS`, `ALLOWED_HOSTS`.

## Script generation

- Windows → `install_apps.ps1`: per app try winget → MS Store → direct download (silent).
- Linux → `install_apps.sh`: detect distro/manager (apt/dnf/pacman) plus flatpak/snap; per
  app try flatpak → native → snap → direct.
- Returned as a file download. Runs are recorded to history for authenticated users, and
  apps with no installer for the target platform come back in `X-Fosslove-Skipped`.

## Common commands

The root `Makefile` is the full control surface. Any backend target is reachable as
`api-<target>`, any frontend target as `web-<target>`.

```
make bootstrap          # env + local Postgres + install + migrate + seed + admin

make run-api            # Django dev server only (:8000)
make run-web            # Vite dev server only (:5173)
make run-all            # both together
make run-api-prod       # API under gunicorn

make db-init            # create a project-local Postgres cluster in .pgdata
make db-start / db-stop / db-status / db-psql / db-logs / db-destroy

make api-migrate        # apply migrations
make api-migrations     # create migrations
make api-check-migrations   # fail if models drift from migrations
make api-seed           # load the bundled catalog fixtures (idempotent)
make api-reseed         # flush the catalog and reload
make api-admin          # create the bootstrap admin from .env
make api-superuser      # create a superuser interactively

make check              # lint + format check + typecheck + tests, both apps
make schema             # regenerate openapi.json AND the typed frontend client
make upgrade            # raise every dependency to the latest published version

make web-install        # bun install
make web-build          # typecheck with TS 7, then build
make web-test           # vitest
make web-codegen        # regenerate src/api/schema.d.ts only
```

There is no Docker setup in this repo. `make db-*` manages a project-local PostgreSQL
cluster under `.pgdata/` (gitignored). If port 5432 is already in use, override it:
`make db-start PGPORT=5433` and set `FOSSLOVE_POSTGRES_PORT=5433` in `apps/api/.env`.

## Config

All settings are env vars prefixed `FOSSLOVE_`, loaded from `apps/api/.env` (see
`.env.example`). Production boot is guarded by Django system checks that fail on insecure
defaults (placeholder secret, `DEBUG=true`, wildcard hosts, default DB password, unsafe
email config). Generate a secret with
`python -c "import secrets; print(secrets.token_urlsafe(64))"`.
