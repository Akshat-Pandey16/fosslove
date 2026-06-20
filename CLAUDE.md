# CLAUDE.md

Guidance for working in this repository. Read this first.

## What FOSSLove is

A production-grade **monorepo** for a catalog of free/open-source apps (Windows + Linux),
grouped into categories. Users browse the catalog, select apps, and the API generates a
ready-to-run **install script** (PowerShell for Windows, POSIX shell for Linux) that
installs everything via the right package manager. This is a full ground-up rewrite of an
older, poorly-structured FastAPI prototype.

It is a two-app monorepo:

- **`apps/api`** — the FastAPI backend (Python).
- **`apps/web`** — the Next.js 16 frontend (TypeScript, Bun).

A root `Makefile` orchestrates both, and `docker-compose.yml` runs the full stack
(postgres + redis + api + web). A `packages/` dir can be added later for shared code.

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
- **src layout.** Backend code under `apps/api/src/fosslove/`. First-party import root is
  `fosslove`. The on-disk depth is cosmetic — imports stay `import fosslove`.
- **Frontend conventions mirror the backend.** No comments (same rule), always-latest deps
  (caret ranges, `make web-upgrade`), Biome (lint+format) and `tsc` must pass. Bun is the
  package manager + toolchain. JSONB is a last resort on the DB — prefer typed columns
  (e.g. `app_settings` is a typed single-row table, not a JSONB blob).

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
- **Admin:** two surfaces — the **Next.js admin panel** at `/admin` on the frontend (custom
  CRUD for categories, apps + package refs, and runtime settings), and **SQLAdmin** on the
  API host (a Django-admin-style fallback on the SQLAlchemy models). Both are admin-gated.
- **Logging:** structlog (JSON in prod, console in dev), request-id bound per request.
- **Email:** aiosmtplib (pluggable `console` / `smtp` backends).
- **Tooling:** ruff, mypy, pytest (+asyncio/cov/mock), httpx, faker, factory-boy.

## Frontend stack (`apps/web`, June 2026)

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**, **Bun** toolchain.
- **SSR/SSG** for the public catalog (SEO + first paint); auth/admin areas are client-rendered.
- **Tailwind CSS v4** + **shadcn/ui** (built on **Base UI**, style `base-nova`). Compose
  triggers with the Base UI `render` prop, not Radix `asChild`. `Select` needs an `items` map.
- **TanStack Query** (server state), **React Hook Form + Zod** (forms), **zustand** (the
  persistent script-builder selection), **motion** (animations: `Reveal`, route fade,
  `AnimatePresence`), **sonner** (toasts), **next-themes** (system/dark/light).
- **Biome** for lint+format (the ruff analog); `tsc --noEmit` for types.
- Auth tokens (access + rotating refresh) live in `localStorage`; the API client injects the
  bearer and transparently refreshes on 401. Server components fetch via `API_INTERNAL_URL`.
- Design identity: violet/indigo accent on warm-charcoal dark, Bricolage Grotesque display,
  no grid/glow — deliberately distinct from the maintainer's portfolio site.

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
- **Email is gated by `FOSSLOVE_EMAIL_ENABLED` (default off).** While off: the EmailSender
  no-ops, new users are auto-verified on registration, and resend/reset short-circuit. Turn
  it on (with SMTP creds) to activate the full verify/reset flow.

## Runtime settings (admin-editable)

A subset of config is editable at runtime from the admin panel (`GET`/`PATCH
/admin/settings`) without a restart: **feature flags** (registration on/off, email
verification gating), **rate limiting** (enabled + default/auth limits), **email & SMTP**
(backend, from, host/port/user/password/TLS), and **branding** (project name, frontend URL).
These live in a **typed single-row `app_settings` table** that *overlays* the env defaults
(a NULL column inherits the env value). `RuntimeSettings` (`core/runtime_settings.py`) caches
the overlay in memory with a short TTL + reload-on-write; consumers (rate-limit middleware,
auth register, EmailSender) read the effective values per request. Security/startup-bound
settings stay **env-only**: `SECRET_KEY`, JWT alg, DB connection, `CORS_ORIGINS`,
`ALLOWED_HOSTS`.

## Data model (high level)

- `users`, `refresh_tokens`, `verification_tokens` (email-verify + password-reset).
- `categories` (with denormalized `windows_app_count` / `linux_app_count`, maintained
  transactionally + a periodic recompute task to fix drift).
- `apps` (one table, `platform` enum = windows|linux; unique `(category_id, platform, name)`).
- `package_references` (per-app rows: `manager` enum = winget|msstore|apt|dnf|pacman|
  flatpak|snap|direct, `identifier`, optional `extra` JSONB). The script engine picks the
  best available manager per app, with fallbacks. Direct-download is the last resort.
- `collections` + `collection_apps` (ordered M2M), `favorites`, `script_runs` (history).
- `app_settings` (typed single-row overlay for runtime-editable config — see Runtime settings).

## Script generation

- Windows → `install_apps.ps1`: per app try winget → MS Store → direct download (silent).
- Linux → `install_apps.sh`: detect distro/manager (apt/dnf/pacman) + flatpak/snap; per app
  try flatpak → native → snap → direct.
- Output is streamed as a file download. Authenticated runs are recorded to history.

## Layout

```
apps/
  api/                       Python FastAPI backend (own pyproject/uv.lock/Dockerfile/Makefile)
    src/fosslove/
      core/      config, logging, security, exceptions, cache, ratelimit, middleware,
                 runtime_settings, pagination
      db/        engine/session, Base, models/ (incl. app_settings), events, reset
      schemas/   Pydantic request/response models (incl. settings)
      services/  business logic (take an AsyncSession)
      scriptgen/ windows + linux script builders
      api/       deps + v1 routers (auth, users, catalog, collections, favorites,
                 scripts, admin) + app factory
      admin/     SQLAdmin views + auth backend
      seed.py    idempotent sample-catalog seeding
    migrations/  Alembic (async env.py)
    tests/       pytest suite (httpx ASGITransport against a test Postgres)
  web/                       Next.js 16 frontend (Bun, own Dockerfile/Makefile)
    src/app/                 routes: (site) public + account, (auth), admin
    src/components/          ui (shadcn), layout, catalog, builder, admin, motion
    src/lib/                 api client + types, auth, stores, hooks
Makefile                     root orchestrator (infra + api-* / web-* delegators)
docker-compose.yml           postgres + redis + migrate + api + web
```

## Common commands

Root `Makefile` orchestrates both apps. Backend targets are `api-<t>`, frontend `web-<t>`.

```
make infra              # start ONLY postgres + redis (for local dev servers)
make up / make down     # full docker stack (postgres + redis + api + web)
make logs               # tail all docker logs

make api-install        # uv sync --all-extras           (in apps/api)
make api-dev            # uvicorn with reload (:8001)
make api-migrate        # alembic upgrade head
make api-revision m="…" # autogenerate a migration
make api-seed           # load sample catalog data
make api-reset-db       # DESTRUCTIVE: drop schema, re-migrate, reset identities
make api-check          # ruff + mypy + pytest
make api-upgrade        # bump every Python dep to latest + re-sync

make web-install        # bun install                    (in apps/web)
make web-dev            # next dev (:3000)
make web-build          # production build
make web-check          # biome (lint+format) + tsc
make web-upgrade        # bun update --latest
```

Typical local dev: `make infra` once, then `make api-dev` and `make web-dev` in two terminals.

## Config

All settings are env vars prefixed `FOSSLOVE_`, loaded via pydantic-settings from `.env`
(see `.env.example`). Production boot fails fast on insecure defaults (placeholder secret,
`DEBUG=true`, wildcard hosts). Generate a secret with
`python -c "import secrets; print(secrets.token_urlsafe(64))"`.
