# Architecture

## Overview
FlightOpsNXG is a Node/TypeScript monorepo for flight-ops workflows with:
- mock supplier API service
- minimal ops API service
- shared domain/adapter/persistence packages
- smoke-test script validating end-to-end sync

## Workspace Layout
- `apps/cloudflare-worker`
  - Cloudflare Worker API replacement for Node services
  - D1-backed storage for bookings
  - routes:
    - `GET /healthz`
    - `GET /sync/rezdy/bookings`
    - `GET /v1/bookings`
    - `GET /v1/bookings/:orderNumber`
    - `POST /admin/seed`
    - `POST /admin/bookings`
    - `PUT /admin/bookings/:orderNumber`
    - `DELETE /admin/bookings/:orderNumber`
  - config and migrations:
    - `apps/cloudflare-worker/wrangler.toml`
    - `apps/cloudflare-worker/migrations/0001_init.sql`
- `apps/ops-api`
  - HTTP API on port `4020`
  - routes: `GET /healthz`, `GET /sync/rezdy/bookings`, `GET /` and `GET /dashboard`
  - dashboard page fetches sync data and renders KPIs/table
- `apps/supplier-mock`
  - mock supplier on port `4010`
  - routes: `GET /healthz`, `GET /v1/bookings`, `GET /v1/bookings/:orderNumber`
  - serves local fixture data from `src/fixtures/rezdy-bookings.json`
- `apps/scheduler-worker`
  - reserved for background/scheduled jobs
- `packages/adapters`
  - supplier adapter implementations
  - `RezdyAdapter` maps supplier responses to canonical booking shape
- `packages/domain`
  - domain models/rules
- `packages/persistence`
  - persistence contracts and Prisma schema placeholders

## Data Flow
1. `ops-api` receives `/sync/rezdy/bookings` with `fromIso/toIso`.
2. `RezdyAdapter` calls supplier API base URL.
3. In local development this points to `http://localhost:4010` (supplier mock).
4. Supplier mock filters fixture bookings by tour start time window.
5. Ops API returns canonicalized bookings and count in JSON.
6. Dashboard page displays the result set for a selected time window.

## Branding and Package Scope
- Repository branding is `FlightOps`.
- NPM workspace scope is `@flightops/*`.

## Publish Workflow
- Update `docs/BUILD_NOTES.md` when changes are made.
- Update this file when module boundaries/routes/data flow materially change.
- Run `scripts/publish.ps1` to stage, commit, and push.
