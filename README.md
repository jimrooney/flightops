# FlightOps Next

Starter monorepo for a headless flight-ops rebuild.

## Supplier Mock

Use `apps/supplier-mock` to avoid calling live supplier accounts.

Expected mock Rezdy endpoints:

- `GET /healthz`
- `GET /v1/bookings?apiKey=...&minTourStartTime=...&maxTourStartTime=...`
- `GET /v1/bookings/:orderNumber?apiKey=...`

Default local URL is `http://localhost:4010`.

`RezdyAdapter` defaults:

- `REZDY_API_BASE_URL=http://localhost:4010`
- `REZDY_API_KEY=mock-api-key`

## Minimal Ops API

`apps/ops-api` includes:

- `GET /healthz`
- `GET /sync/rezdy/bookings?fromIso=...&toIso=...`

Default URL is `http://localhost:4020`.

## Run

Install dependencies:

- `npm install`

Start mock + API together:

- `npm run dev`

## Smoke Test

This builds the required packages, starts both services, calls sync, validates shape, and exits:

- `npm run test:sync-smoke`

## Cloudflare Worker + D1 (New)

Worker app location:

- `apps/cloudflare-worker`

Provides:

- `GET /healthz`
- `GET /sync/rezdy/bookings?fromIso=...&toIso=...`
- `GET /v1/bookings?minTourStartTime=...&maxTourStartTime=...`
- `GET /v1/bookings/:orderNumber`
- `POST /admin/seed` (seed demo bookings if table is empty)
- `POST /admin/bookings` (create/upsert booking)
- `PUT /admin/bookings/:orderNumber` (update booking)
- `DELETE /admin/bookings/:orderNumber`

Setup:

1. Update `apps/cloudflare-worker/wrangler.toml`:
   - `account_id`
   - `database_id` under `[[d1_databases]]`
2. Log in to Cloudflare:
   - `npx wrangler login`
3. Apply D1 schema:
   - Local: `npm run cf:d1:migrate:local`
   - Remote: `npm run cf:d1:migrate:remote`
4. Start local worker:
   - `npm run cf:dev`
5. Seed bookings once:
   - `curl -X POST http://127.0.0.1:8787/admin/seed`
