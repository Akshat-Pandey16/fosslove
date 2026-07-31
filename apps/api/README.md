# FOSSLove API

Django 6 + Django REST Framework backend for the FOSSLove catalog. Serves the app catalog,
user collections and favorites, and generates ready-to-run install scripts for Windows and
Linux.

## Requirements

- Python 3.13+ (3.14 is pinned via `.python-version`; `uv` will fetch it)
- PostgreSQL 16+
- [uv](https://docs.astral.sh/uv/)
- Redis (optional — the cache and throttle store fall back to in-memory when absent)

## Quick start

From the repository root:

```bash
make bootstrap     # env files + local Postgres cluster + install + migrate + seed + admin
make run-api       # http://localhost:8000
```

Or step by step from `apps/api`:

```bash
make env           # create .env from .env.example
make install       # uv sync --all-extras
make migrate
make seed          # load the 18 bundled catalog fixtures (idempotent)
make superuser
make dev
```

## Endpoints

Everything lives under `/api/v1/`. Interactive docs: `/api/v1/docs` (Swagger UI),
`/api/v1/redoc`, raw schema at `/api/v1/schema`.

| Area | Routes |
| --- | --- |
| Auth | `auth/register`, `auth/login`, `auth/refresh`, `auth/logout`, `auth/verify-email`, `auth/resend-verification`, `auth/password-reset`, `auth/password-reset/confirm`, `auth/email-change/confirm` |
| Account | `user/` (`GET`/`PATCH`/`DELETE`), `user/change-password`, `user/email`, `user/sessions`, `user/sessions/<id>`, `user/export` |
| Catalog | `categories`, `categories/<id>`, `categories/by-slug/<slug>`, `apps`, `apps/<id>`, `apps/by-slug/<platform>/<slug>` |
| Collections | `collections`, `collections/public`, `collections/<id>`, `collections/<id>/apps` |
| Favorites | `favorites`, `favorites/ids`, `favorites/<app_id>` |
| Scripts | `scripts/generate`, `scripts/history` |
| Admin | `admin/categories`, `admin/apps`, `admin/apps/import`, `admin/catalog/export`, `admin/recompute-counts`, `admin/activity`, `admin/settings`, `admin/cleanup-tokens` |

Outside the versioned prefix: `/` (service info), `/health`, `/health/ready`, `/metrics`,
and the Django admin at `/django-admin/`.

Every endpoint is an `APIView` with explicit method handlers. There are no `PUT` routes —
partial updates use `PATCH`.

### The schema is a contract, not documentation

`openapi.json` is committed and the frontend's TypeScript client is generated from it, so the
schema has to describe what the API actually returns. Two rules follow, both enforced by
`tests/test_schema.py`:

- No endpoint may declare a bare `dict`/`str` response. Use a real serializer — `core/serializers.py`
  has `MessageSerializer` and friends for the small ones.
- Paginated endpoints must use `paginated(...)` and `page_parameters(...)` from `core/schema.py`,
  because drf-spectacular cannot infer pagination or `django-filter` parameters from a plain
  `APIView`. Without them the schema would claim a bare array and advertise no filters.

Regenerate with `make schema` (from the repo root this also refreshes the frontend client).
CI fails if the committed schema is stale.

### Response shapes

Paginated collections:

```json
{ "items": [], "meta": { "page": 1, "size": 20, "total": 0, "pages": 0 } }
```

Errors:

```json
{ "error": { "code": "conflict", "message": "…", "details": null }, "request_id": "…" }
```

Catalog reads send `ETag` and `Cache-Control`; send `If-None-Match` to get a `304`.
Throttled requests return `429` with `Retry-After`.

## Make targets

```
install      Create the venv and install all dependencies
upgrade      Raise every dependency floor to the latest on PyPI, relock, sync
lock         Re-resolve uv.lock without changing floors
env          Create .env from .env.example if missing
dev          Run the development server
run          Run under gunicorn
shell        Django shell
dbshell      Database shell
migrate      Apply migrations
migrations   Create migrations for model changes
check-migrations  Fail if models drift from migrations
seed         Load the bundled catalog fixtures
reseed       Flush the catalog and reload fixtures
admin        Create the bootstrap admin from .env
superuser    Create a superuser interactively
schema       Regenerate and validate openapi.json
reset-db     DESTRUCTIVE: flush the database and re-migrate
static       Collect static files
lint         Lint with ruff
format       Format and autofix with ruff
typecheck    Type-check with mypy --strict
test         Run the test suite
test-cov     Run the test suite with coverage
check        lint + format check + typecheck + test
clean        Remove caches and build artifacts
```

## Configuration

Environment variables prefixed `FOSSLOVE_`, read from `.env`. See `.env.example` for the
full list. In production, Django system checks refuse to start on a placeholder secret,
`DEBUG=true`, wildcard `ALLOWED_HOSTS`, the default database password, or an inconsistent
email configuration.

A subset of configuration is editable at runtime (feature flags, rate limits, email/SMTP,
branding) through `admin/settings` or the Django admin. Those values live in a single-row
table where `NULL` means "inherit the environment value".

## Notable implementation details

- **Category counters are maintained by database triggers** (`django-pgtrigger`), so bulk
  `.update()`, `.delete()`, and `bulk_create()` keep them exact. `admin/recompute-counts`
  exists only to repair counters written directly to the database.
- **Refresh-token rotation and reuse rejection** come from `simplejwt`'s blacklist app.
  Session metadata (user agent, IP, last used) is a 1:1 sidecar on `OutstandingToken`.
- **Email links are stateless.** Verification, password reset, and email change use
  Django's token generators and signed payloads; single use is enforced by hashing mutable
  user state rather than by a token table.
- **Search is genuinely fuzzy** — `TrigramWordSimilarity` ranked by score, so `firefx`
  finds `Firefox`.
- **Case-insensitive email** via a functional unique index on `LOWER(email)`, which keeps
  `LIKE` and admin search working.

## Testing

```bash
make test
make test-cov
```

The suite uses `pytest-django` against a real PostgreSQL database and covers the auth
lifecycle, catalog CRUD, trigger-maintained counters (including bulk operations),
collections, favorites, script generation, runtime settings, throttling, the audit log,
and the seed commands.
