# Build Notes

## 2026-03-07
### Ops Board Jump Links + Date Navigation Fix
- Added per-row airplane jump icon on `/booking-edit` passenger rows linking to `/ops-board` day view for the booking date.
- Added per-row airplane jump icon on `/dashboard` booking rows linking to `/ops-board` day view for that booking start date.
- Added ops board query preselect support for `view` and `date` (`/ops-board?view=day&date=YYYY-MM-DD`) for deep links.
- Fixed ops board date navigation so calendar input and `<` / `>` day buttons are no longer forced back to the initial query date after first load.

## 2026-03-06
### Ops Board Mobile Drag + LAN Dev Command
- Reworked `/ops-board` booking leg drag to support touch devices using pointer events while preserving desktop drag/drop behavior.
- Unified drop/save handling for desktop and touch drag paths so booking move persistence stays consistent.
- Added local LAN startup command to `/configuration`:
  - `npm run dev -w @flightops/cloudflare-worker -- --ip 0.0.0.0 --port 8787`

### Configuration Tab + Front Door Landing
- Moved API/config utility content off homepage and into API app under new `Configuration` tab/page (`/configuration`).
- Added `Configuration` tab to dashboard, booking, and ops board navigation.
- Kept `Open Bookings Dashboard` on the site homepage.
- Simplified root `index.html` (local project front door) to just FlightOps title + dashboard button.

### Public Landing + Gentleman's Password Gate
- Added public landing page at `/` as open site entry point.
- Added password gate page at `/auth` for tool access.
- Protected UI routes now require authentication cookie:
  - `/dashboard`
  - `/booking` (redirect target)
  - `/booking-edit`
  - `/ops-board`
- Implemented simple password flow using `pizza` and cookie `fo_access=1` (30-day expiry).
- Updated `/booking` to redirect into `/booking-edit` so add/edit is the primary booking detail interface.

### Booking Pages + Top Navigation Tabs
- Added top tab-bar navigation to worker pages: Dashboard, Booking Detail, and Add/Edit Booking.
- Dashboard booking IDs now link to a dedicated booking detail page.
- Added `/booking` page to load and view full booking JSON by booking ID.
- Added `/booking-edit` page to create/update/delete bookings using existing admin endpoints.
- Deployed worker update and verified page routes are live on `api.flightops.co.nz`.

### Go Live Dashboard Launcher
- Updated root `index.html` so VS Code `Go Live` checks whether `http://127.0.0.1:8787/healthz` is reachable.
- Added conditional redirect to `http://127.0.0.1:8787/dashboard` only when local worker dev server is up.
- Added server-down guidance with copyable startup command `npm run cf:dev` and retry button.

### VS Code Built-in Audio Cues
- Added workspace `.vscode/settings.json` to enable built-in VS Code audio cues.
- Enabled `audioCues.enabled`, `audioCues.taskCompleted`, and `audioCues.taskFailed`.
- Enabled terminal and chat-related audio cue settings supported by this VS Code build.
- Added `Completion Sound` section to `docs/AI_CONTEXT.md` with user troubleshooting steps via Settings -> `Audio Cues`.

### Dashboard Seed Reset Safety
- Added a `Reset Seed` button to the Cloudflare Worker dashboard.
- Added browser confirmation dialog before reset to reduce accidental deletion.
- Added `POST /admin/reset-seed` endpoint to wipe and reinsert default seeded bookings.
- Verified live reset response includes deleted/inserted counts.

### VS Code One-Click Dashboard
- Added workspace `.vscode/tasks.json` task `CF Dev` for `npm run cf:dev`.
- Added workspace `.vscode/launch.json` config `Dashboard (One Click)` to open Brave at `http://127.0.0.1:8787/dashboard` with prelaunch task.

## 2026-03-05
### Publish Completion Sound Timing
- Updated `scripts/publish.ps1` so completion sound plays only after:
  - push completes
  - final publish status is printed
  - console output is flushed
- Added final publish status line with commit hash and clean/dirty tree check.
- Added playback reliability fallback:
  - tries delayed background playback first
  - falls back to synchronous local playback if background launch fails

### Dashboard Time UX Improvements
- Updated Worker dashboard (`/dashboard`) to use split date/time controls instead of raw ISO fields.
- Added local-time default mode (QT/browser timezone) with optional Zulu/UTC toggle.
- Added quick range controls:
  - `Today`
  - previous day `<`
  - next day `>`
- Updated dashboard rendering to display local timestamps when local mode is active.

### Cloudflare Pages Frontend Migration
- Added `site/index.html` as Cloudflare Pages static frontend entry.
- Created Cloudflare Pages project `flightops` and deployed first static build.
- Updated DNS target strategy to serve apex from `flightops.pages.dev` while keeping Worker API on `api.flightops.co.nz`.

### Cloudflare Worker + D1 Scaffold
- Added `apps/cloudflare-worker` workspace with `wrangler.toml`, TypeScript worker entrypoint, and D1 migration.
- Added Worker routes for health, sync, supplier-compatible booking reads, and admin CRUD/seed endpoints.
- Added D1 schema migration `0001_init.sql` with indexed booking time column.
- Added root scripts:
  - `cf:dev`
  - `cf:deploy`
  - `cf:typecheck`
  - `cf:d1:migrate:local`
  - `cf:d1:migrate:remote`
- Updated README with setup instructions for Cloudflare login, D1 migration, local dev, and seeding.
- Created remote D1 database `flightops-bookings` and applied migration `0001_init.sql`.
- Deployed Worker `flightops-api` to route `api.flightops.co.nz/*`.
- Verified live endpoints using host-resolved checks:
  - `GET /healthz` OK
  - `POST /admin/seed` OK
  - `GET /sync/rezdy/bookings` OK

### FlightOpsNXG Rebrand
- Renamed repository workspace branding from `SkySeat` to `FlightOps`.
- Updated package scope from `@skyseat/*` to `@flightops/*`.
- Updated workspace scripts and smoke-test script to use new package names.

### Ops Dashboard Page
- Added dashboard HTML route to `apps/ops-api/src/main.ts`:
  - `GET /`
  - `GET /dashboard`
- Dashboard loads booking data from `/sync/rezdy/bookings` and renders:
  - summary KPI cards
  - booking table with status/product/start/passenger details
  - selectable ISO date range controls

### Expanded Mock Supplier Data
- Expanded `apps/supplier-mock/src/fixtures/rezdy-bookings.json` from 2 bookings to 15 bookings.
- Added mixed statuses (`CONFIRMED`, `PENDING_SUPPLIER`, `CANCELLED`) and varied passenger counts.

### Repository Docs Alignment
- Added `docs/` directory to this repository.
- Replaced copied architecture content with FlightOpsNXG monorepo architecture.
- Added publish script support via `scripts/publish.ps1`.
## 2026-03-05

### Publish Sound Automation
- Added `scripts/publish.ps1` to standardize publish steps (commit + push).
- Added publish-complete sound playback for `C:\Home\Jim\System\sounds\gotthis.wav`.
- Updated `AI_CONTEXT.md` so publish now explicitly requires running the script and playing the sound.

### Sound Routing Update
- Switched publish-complete sound from `garage.wav` to `gotthis.wav`.
- Added agent rule: use `garage.wav` only when a blocking user prompt/decision is required.
- Added agent rule: use `gotthis.wav` at completion checkpoints (task finished and validated, awaiting user direction).

### Publish Workflow Clarification
- Updated `AI_CONTEXT.md` to mark publish handling as an explicit agent rule.
- Clarified that when the user says `publish`, the agent should execute the documented workflow exactly.

## 2026-03-04

### Section Containers Replacing Raw `<hr>` Lines
- Reworked link rendering to create bordered section containers instead of rendering raw separator lines.
- Sheet `HTML` rows containing `<hr>` now start a new section.
- Empty sections are removed automatically unless they contain a section title.

### Titled Section Bars
- Added section title parsing for `<hr>` separator rows.
- Supported title sources:
  - `data-title` attribute on `<hr>`
  - `title` attribute on `<hr>`
  - fallback text in the same HTML cell
- Added a full-width styled title bar (`.section-title`) with a compact, darker blue look.

### Edit Mode UI Trim
- `Configure Save API` button now appears only while edit mode is on.
- Removed instructional status text shown on edit mode toggle.

### Drag-and-Drop Reordering (Edit Mode)
- Added drag/drop support for link tiles while edit mode is enabled.
- Drop target is highlighted to show insertion point.
- Frontend sends `action: "move_row"` with `row` and `targetRow`, then reloads links from the sheet on success.
- Updated insertion logic to match right-side drop marker (drop after hovered tile).

### Edit Mode Quick Entry/Exit
- Added long-press activation on link tiles (works with touch and mouse hold).
- Added click-off behavior to exit edit mode when clicking outside buttons/controls/modal.

### HUD Visual Pass
- Applied a futuristic HUD-style theme refresh with neon cyan accents, darker glass panels, and techno typography.
- Added layered radial ring/glow background treatment across the page.
- Added header-specific image background support using `images/hud-title-bg.png`.
- Tuned the global ring treatment back to the flatter version while keeping the new HUD palette and component styling.

### Edit Mode Content Creation
- Added `Add Button` control (visible in edit mode) to append new links to the sheet.
- Added `+ Title Bar` control for untitled sections to create/update section titles in the sheet.
- Added Apps Script action support docs for:
  - `add_link`
  - `set_section_title`
  - `insert_section_break`

### Android/Touch Reorder Support
- Added pointer-based touch drag reorder flow for edit mode to support browsers where HTML5 drag/drop is unreliable (for example Android Brave).
- Kept desktop drag/drop behavior intact.

## 2026-03-03

### Navbar Link Click Area Fix
- Moved button styling class (`BlueBox`) to the anchor element so the full visible button area is clickable.
- Preserved spacing and hover behavior with targeted CSS updates.

### Sheet-Driven Icons
- Added optional icon support using Google Sheet column C.
- Expected icon value formats:
  - Iconify ID (example: `lucide:plane`, `mdi:airplane`)
  - Direct image URL
- If column C is empty, renderer falls back to text-only link.

### Icon + Label Rendering
- Icon rows render icon above label, with small label text and fixed icon size.
- Added inline layout guards for icon rows to reduce cache-related visual drift.
- Tightened icon button horizontal spacing to remove excess side padding.

### Icon Chooser Utility
- Added `icon-chooser.html` to pick icons and copy icon ID or URL.
- Added icon source selector aligned with in-page edit modal sets.
- Added full-set browsing toggle with pagination controls (`Previous` / `Next`).
- Replaced broken `solar-bold` set with working `ph` (Phosphor) set.

### Button Visual Style
- Replaced hatched button background with solid light blue (`#9cb9e6`).

### Edit Mode Enhancements
- Added in-page edit mode controls to update icon values directly in the sheet.
- Added per-link delete control (dash-in-circle) in edit mode to delete rows from the sheet.
- Added modal link to open `icon-chooser.html` in a separate tab.

### Visual Refresh (Option A)
- Updated homepage to a dark aviation-themed gradient background.
- Added elevated header panel and updated title/tagline:
  - `JimRooney.com`
  - `Welcome to the house of Jim`
- Refined tile buttons, editor controls, and modal styling to match the new visual direction.

### Design Exploration Assets
- Added SVG mockups for UI direction exploration:
  - `images/ui-mockup-option-a.svg`
  - `images/ui-mockup-option-b.svg`
  - `images/ui-mockup-option-c.svg`

