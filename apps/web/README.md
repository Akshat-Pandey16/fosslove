# FOSSLove Web

React 19 + Vite 8 frontend for the FOSSLove catalog, written in TypeScript 7 and managed with
Bun.

## Requirements

- [Bun](https://bun.sh/) 1.3+
- The API running on `http://localhost:8000` (`make run-api` from the repository root)

## Quick start

```bash
make install     # or: bun install
make env         # creates .env from .env.example
make dev         # http://localhost:5173
```

The dev server proxies `/api` to `VITE_API_ORIGIN`, so there is no CORS setup in development.

## Two TypeScript versions, on purpose

TypeScript 7 is the native (Go) compiler. It is fast and it is what type-checks this project,
but it **does not ship the JavaScript compiler API**, and tools built on that API — including
`typescript-eslint` and `openapi-typescript` — refuse to run under it. TypeScript 6.0.3 is the
last release that exposes that API.

Both are installed, which is the arrangement the TypeScript team recommends:

| Package | Version | Used by |
| --- | --- | --- |
| `typescript-native` (alias of `typescript`) | 7.0.2 | `bun run typecheck`, `bun run build` |
| `typescript` | 6.0.3 | ESLint, `openapi-typescript`, editors |

`bun run typecheck:legacy` type-checks with TypeScript 6 if you need to compare.

## The API client is generated, not written

`src/api/schema.d.ts` is generated from `apps/api/openapi.json` by `openapi-typescript` and
**must not be edited by hand**. Every request goes through `openapi-fetch`, so paths, query
parameters, request bodies and responses are all checked against the real API contract — a
typo in a path or a filter name is a compile error.

After changing a serializer, view or route in the backend:

```bash
make schema        # from the repository root: regenerates openapi.json, then schema.d.ts
```

CI fails if either file is stale.

## Layout

```
src/
  api/         generated schema, openapi-fetch client, token store, error type
  auth/        AuthProvider, auth context, useAuth
  features/    one folder per domain, each exposing typed TanStack Query hooks
  query/       QueryClient factory and the query-key registry
  routes/      router, layout, route guard, pages
  styles/      base reset and layout primitives
  test/        Vitest setup
```

## Auth

Access and refresh tokens live in `localStorage`. `authFetch` attaches the access token, and on
a `401` it refreshes once and replays the original request.

The refresh is **single-flight**: concurrent 401s share one refresh call. This is required, not
an optimisation — the API rotates refresh tokens and blacklists the previous one, so two
parallel refreshes would invalidate each other and sign the user out. `src/api/client.test.ts`
covers this.

## Commands

```
make dev         Vite dev server
make build       Type-check with TypeScript 7, then build
make preview     Serve the production build
make codegen     Regenerate the API types
make lint        ESLint (type-aware, strict)
make typecheck   TypeScript 7
make test        Vitest
make check       lint + typecheck + test + build
```

## Design status

The visual design is deliberately unbuilt. The pages are semantic HTML with a minimal reset so
the data layer, routing and auth can be verified end to end; the design language is a separate
piece of work and nothing here is meant to survive it.
