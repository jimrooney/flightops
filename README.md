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
