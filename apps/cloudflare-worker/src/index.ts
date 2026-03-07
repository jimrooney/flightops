import { seedBookings, type SeedBooking, type SeedParticipant } from "./seed-data.js";

type BookingRange = { fromIso: string; toIso: string };

type CanonicalBooking = {
  supplier: "rezdy";
  supplierBookingId: string;
  productCode: string;
  status: "confirmed" | "pending" | "cancelled";
  startTimeIso: string;
  passengers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    category: "adult";
  }>;
};

type BookingRow = {
  order_number: string;
  status: string;
  supplier_id: string;
  product_code: string;
  start_time_local: string;
  payload_json: string;
};

type Env = {
  BOOKINGS_DB: D1Database;
};

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="sky2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e6cff"/>
      <stop offset="100%" stop-color="#1147b8"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#sky2)"/>
  <circle cx="32" cy="32" r="19" fill="none" stroke="#9dc2ff" stroke-width="3"/>
  <path d="M16 35.5l29-3.5 5-4-3 8-19 3 6 9-5 2-6-9-9 1.5z" fill="#ffffff"/>
</svg>`;

const landingHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FlightOps</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 0; background: #f4f7fb; color: #10243f; }
    main { max-width: 980px; margin: 0 auto; padding: 28px 16px 40px; }
    .panel { background: #fff; border: 1px solid #d7e1ee; border-radius: 12px; padding: 16px; }
    h1 { margin: 0 0 10px; }
    p { color: #4f6480; }
    a.btn { display: inline-block; margin-top: 8px; text-decoration: none; border-radius: 8px; padding: 10px 14px; background: #0f62fe; color: #fff; font-weight: 700; }
    .muted { margin-top: 10px; font-size: .9rem; color: #6b7f99; }
  </style>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
  <main>
    <section class="panel">
      <h1>FlightOps</h1>
      <p>Welcome to FlightOps. This public page is a placeholder for site info and graphics.</p>
      <a class="btn" href="/dashboard">Go to Dashboard</a>
      <div class="muted">Dashboard/tools require a password.</div>
    </section>
  </main>
</body>
</html>`;

const configurationHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FlightOps Configuration</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 0; background: #f4f7fb; color: #10243f; }
    main { max-width: 980px; margin: 0 auto; padding: 16px 14px 34px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .tab { text-decoration: none; border: 1px solid #c8d5e7; border-radius: 8px; padding: 8px 12px; color: #11438d; background: #ecf3ff; font-weight: 600; }
    .tab.active { background: #0f62fe; color: #fff; border-color: #0f62fe; }
    .panel { background: #fff; border: 1px solid #d7e1ee; border-radius: 12px; padding: 16px; }
    h1 { margin: 0 0 10px; }
    p { color: #4f6480; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
    a.btn { text-decoration: none; padding: 10px 14px; border-radius: 10px; border: 1px solid #c8d5e7; color: #10243f; background: #f8fbff; }
    .btn { text-decoration: none; padding: 10px 14px; border-radius: 10px; border: 1px solid #c8d5e7; color: #10243f; background: #f8fbff; cursor: pointer; font: inherit; }
    .danger { background: #fee2e2; color: #991b1b; border: 1px solid #f5b7b7; }
    .toggle { display: flex; gap: 8px; align-items: center; font-weight: 600; margin-top: 14px; }
    input[type="checkbox"] { width: 18px; height: 18px; accent-color: #0f62fe; }
    #status { margin-top: 10px; color: #4f6480; }
    code { background: #eef4ff; border: 1px solid #d6e4ff; border-radius: 8px; padding: 2px 6px; }
  </style>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
<main>
  <nav class="tabs">
    <a class="tab" href="/dashboard">Dashboard</a>
    <a class="tab" href="/booking-edit">Add/Edit Booking</a>
    <a class="tab" href="/ops-board">Ops Board</a>
    <a class="tab active" href="/configuration">Configuration</a>
  </nav>
  <section class="panel">
    <h1>Configuration</h1>
    <p>Operations frontend hosted on Cloudflare Pages. API is served by Cloudflare Worker + D1.</p>
    <div class="actions">
      <a class="btn" href="/healthz">API Health</a>
      <a class="btn" href="/sync/rezdy/bookings?fromIso=2026-02-28T00:00:00.000Z&toIso=2026-03-03T23:59:59.000Z">Sample Sync Query</a>
    </div>
    <p style="margin-top:16px">Primary API base: <code>https://api.flightops.co.nz</code></p>
    <p style="margin-top:8px">Local LAN dev command: <code>npm run dev -w @flightops/cloudflare-worker -- --ip 0.0.0.0 --port 8787</code></p>
    <label class="toggle"><input id="zuluToggleConfig" type="checkbox" /> Use Zulu / UTC on Dashboard</label>
    <div class="actions">
      <button id="resetSeedBtn" class="btn danger" title="Delete current bookings and reinsert default seed">Reset Seed Data</button>
      <button id="testSoundBtn" class="btn" title="Play browser completion sound">Test Browser Sound</button>
    </div>
    <div id="status">Ready.</div>
  </section>
</main>
<script>
const settingsKey = "flightops_dashboard_use_zulu";
const zuluToggleConfigEl = document.getElementById("zuluToggleConfig");
const resetSeedBtn = document.getElementById("resetSeedBtn");
const testSoundBtn = document.getElementById("testSoundBtn");
const statusEl = document.getElementById("status");

function readZuluSetting() {
  try { return localStorage.getItem(settingsKey) === "1"; } catch (_) { return false; }
}
function writeZuluSetting(value) {
  try { localStorage.setItem(settingsKey, value ? "1" : "0"); } catch (_) {}
}

async function resetSeed() {
  const ok = confirm("Reset seeded bookings? This will delete all current bookings and reinsert the default fake dataset.");
  if (!ok) return;
  statusEl.textContent = "Resetting seed data...";
  const res = await fetch("/admin/reset-seed", { method: "POST" });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || "Failed to reset seed data");
  statusEl.textContent = "Seed reset. Deleted " + (data.deleted || 0) + ", inserted " + (data.inserted || 0) + ".";
}

function playCompletionTone() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) throw new Error("Browser audio API not available.");
  const ctx = new Ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.26);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.28);
  setTimeout(() => ctx.close().catch(() => {}), 350);
}

zuluToggleConfigEl.checked = readZuluSetting();
zuluToggleConfigEl.addEventListener("change", () => {
  writeZuluSetting(zuluToggleConfigEl.checked);
  statusEl.textContent = zuluToggleConfigEl.checked
    ? "Dashboard time mode set to Zulu / UTC."
    : "Dashboard time mode set to Local time (QT/browser timezone).";
});
resetSeedBtn.addEventListener("click", () => { resetSeed().catch((e) => statusEl.textContent = e.message || "Error"); });
testSoundBtn.addEventListener("click", () => {
  try {
    playCompletionTone();
    statusEl.textContent = "Played browser completion sound.";
  } catch (e) {
    statusEl.textContent = (e && e.message) ? e.message : "Failed to play browser sound.";
  }
});
</script>
</body>
</html>`;

function authHtml(nextPath: string, failed = false): string {
  const safeNext = nextPath || "/dashboard";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FlightOps Access</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 0; background: #f4f7fb; color: #10243f; display: grid; place-items: center; min-height: 100vh; }
    .card { width: min(460px, 92vw); background: #fff; border: 1px solid #d7e1ee; border-radius: 12px; padding: 16px; }
    h1 { margin: 0 0 8px; font-size: 1.2rem; }
    p { color: #4f6480; margin: 0 0 10px; }
    form { display: grid; gap: 10px; }
    input, button { height: 38px; border-radius: 8px; border: 1px solid #c8d5e7; padding: 0 10px; font: inherit; }
    button { background: #0f62fe; color: #fff; border: 0; cursor: pointer; font-weight: 700; }
    .error { color: #991b1b; background: #fee2e2; border: 1px solid #f5b7b7; border-radius: 8px; padding: 8px; }
  </style>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
  <div class="card">
    <h1>FlightOps Access</h1>
    <p>Enter password to access dashboard tools.</p>
    ${failed ? '<div class="error">Incorrect password.</div>' : ""}
    <form method="post" action="/auth?next=${encodeURIComponent(safeNext)}">
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Continue</button>
    </form>
  </div>
</body>
</html>`;
}

const dashboardHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FlightOps Dashboard</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 0; background: #f4f7fb; color: #10243f; }
    main { max-width: 1150px; margin: 0 auto; padding: 16px 14px 34px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .tab { text-decoration: none; border: 1px solid #c8d5e7; border-radius: 8px; padding: 8px 12px; color: #11438d; background: #ecf3ff; font-weight: 600; }
    .tab.active { background: #0f62fe; color: #fff; border-color: #0f62fe; }
    .panel { background: #fff; border: 1px solid #d7e1ee; border-radius: 12px; padding: 14px; }
    h1 { margin: 0 0 8px; font-size: 1.4rem; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: end; margin: 8px 0 12px; }
    .stack { display: grid; gap: 6px; }
    .split { display: flex; gap: 8px; }
    input, button, select, textarea { border-radius: 8px; border: 1px solid #c8d5e7; padding: 0 10px; font: inherit; }
    input, button, select { height: 36px; }
    textarea { min-height: 340px; padding: 10px; font-family: Consolas, "Courier New", monospace; }
    input[type="date"], input[type="time"] { background: #fff; }
    button { background: #0f62fe; color: #fff; border: 0; cursor: pointer; }
    .ghost { background: #ecf3ff; color: #11438d; border: 1px solid #c8d5e7; }
    .danger { background: #fee2e2; color: #991b1b; border: 1px solid #f5b7b7; }
    .icon-btn { width: 38px; padding: 0; font-size: 1rem; }
    .utc-badge { display: inline-flex; align-items: center; justify-content: center; height: 24px; padding: 0 9px; border-radius: 999px; border: 1px solid #a9c0e4; background: #ecf3ff; color: #11438d; font-size: .78rem; font-weight: 700; text-decoration: none; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.35); display: none; align-items: center; justify-content: center; z-index: 2000; }
    .modal-backdrop.open { display: flex; }
    .modal-card { width: min(860px, 94vw); background: #fff; border: 1px solid #d7e1ee; border-radius: 12px; padding: 14px; position: relative; }
    .modal-close { position: absolute; right: 10px; top: 10px; width: 32px; height: 32px; border-radius: 8px; background: #ecf3ff; color: #11438d; border: 1px solid #c8d5e7; cursor: pointer; }
    .modal-title { margin: 0 32px 8px 0; font-size: 1.05rem; }
    .kpis { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .kpi { border: 1px solid #d7e1ee; border-radius: 10px; background: #f8fbff; padding: 8px 10px; min-width: 110px; }
    .label { color: #4f6480; font-size: .8rem; }
    .value { font-size: 1.2rem; font-weight: 700; }
    .table { margin-top: 12px; overflow: auto; background: #fff; border: 1px solid #d7e1ee; border-radius: 12px; }
    table { width: 100%; border-collapse: collapse; min-width: 820px; }
    th, td { text-align: left; border-bottom: 1px solid #e8eef7; padding: 8px 10px; font-size: .9rem; }
    th { background: #f5f9ff; }
    .status { padding: 2px 8px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .confirmed { background: #dcfce7; color: #166534; }
    .pending { background: #fef3c7; color: #92400e; }
    .cancelled { background: #fee2e2; color: #991b1b; }
    .link-btn { color: #11438d; text-decoration: none; font-weight: 700; }
    .jump-cell { width: 44px; text-align: center; }
    .ops-link { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px; text-decoration: none; background: #ecf3ff; border: 1px solid #c8d5e7; color: #11438d; font-size: 1rem; }
    .ops-link:hover { background: #dbe9ff; border-color: #a9c0e4; }
  </style>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
<main>
  <nav class="tabs">
    <a class="tab active" href="/dashboard">Dashboard</a>
    <a class="tab" href="/booking-edit">Add/Edit Booking</a>
    <a class="tab" href="/ops-board">Ops Board</a>
    <a class="tab" href="/configuration">Configuration</a>
  </nav>
  <section class="panel">
    <h1>FlightOps Bookings Dashboard</h1>
    <div class="row">
      <button id="calendarBtn" class="ghost icon-btn" title="Open date/time range">&#128197;</button>
      <label class="stack">
        <span>Range</span>
        <select id="rangeMode">
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </label>
      <a id="utcBadge" class="utc-badge" href="/configuration" title="Zulu / UTC mode is on. Open Configuration to change.">UTC</a>
      <button id="prevBtn" class="ghost" title="Previous period">&lt;</button>
      <button id="todayBtn" class="ghost">Today</button>
      <button id="nextBtn" class="ghost" title="Next period">&gt;</button>
    </div>
    <div id="status">Ready.</div>
    <div class="kpis" id="kpis"></div>
  </section>
  <div id="rangeModal" class="modal-backdrop" aria-hidden="true">
    <div class="modal-card" role="dialog" aria-modal="true" aria-label="Date and time range">
      <button id="closeModalBtn" class="modal-close" aria-label="Close">X</button>
      <h2 class="modal-title">Date and Time Range</h2>
      <div class="row">
        <div class="stack">
          <label>From</label>
          <div class="split">
            <input id="fromDate" type="date" />
            <input id="fromTime" type="time" step="60" />
          </div>
        </div>
        <div class="stack">
          <label>To</label>
          <div class="split">
            <input id="toDate" type="date" />
            <input id="toTime" type="time" step="60" />
          </div>
        </div>
        <button id="loadBtn">Load</button>
      </div>
    </div>
  </div>
  <section class="table">
    <table>
      <thead><tr><th class="jump-cell" title="Open on Ops Board">Ops</th><th>Booking</th><th>Status</th><th>Product</th><th>Start</th><th>Pax</th><th>Names</th></tr></thead>
      <tbody id="rows"></tbody>
    </table>
  </section>
</main>
<script>
const fromDateEl = document.getElementById("fromDate");
const fromTimeEl = document.getElementById("fromTime");
const toDateEl = document.getElementById("toDate");
const toTimeEl = document.getElementById("toTime");
const calendarBtn = document.getElementById("calendarBtn");
const rangeModeEl = document.getElementById("rangeMode");
const rangeModalEl = document.getElementById("rangeModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const loadBtn = document.getElementById("loadBtn");
const todayBtn = document.getElementById("todayBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const rowsEl = document.getElementById("rows");
const statusEl = document.getElementById("status");
const kpisEl = document.getElementById("kpis");
const utcBadgeEl = document.getElementById("utcBadge");
const settingsKey = "flightops_dashboard_use_zulu";
const useZulu = (() => {
  try { return localStorage.getItem(settingsKey) === "1"; } catch (_) { return false; }
})();
const publishSignalPollMs = 10000;
let lastPublishSignalMs = 0;
let publishSignalArmed = false;
utcBadgeEl.style.display = useZulu ? "inline-flex" : "none";

function pad(n) { return String(n).padStart(2, "0"); }
function statusClass(s) { return s === "confirmed" ? "confirmed" : (s === "cancelled" ? "cancelled" : "pending"); }
function toYmdLocal(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function partsFromDate(d, isZulu) {
  if (isZulu) {
    return {
      date: d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()),
      time: pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes())
    };
  }
  return {
    date: d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()),
    time: pad(d.getHours()) + ":" + pad(d.getMinutes())
  };
}

function fromControlsToDate(dateStr, timeStr, isZulu) {
  if (!dateStr || !timeStr) return null;
  if (isZulu) return new Date(dateStr + "T" + timeStr + ":00.000Z");
  return new Date(dateStr + "T" + timeStr + ":00");
}

function setControlsFromRange(start, end) {
  const a = partsFromDate(start, useZulu);
  const b = partsFromDate(end, useZulu);
  fromDateEl.value = a.date;
  fromTimeEl.value = a.time;
  toDateEl.value = b.date;
  toTimeEl.value = b.time;
}

function readRangeFromControls() {
  const start = fromControlsToDate(fromDateEl.value, fromTimeEl.value, useZulu);
  const end = fromControlsToDate(toDateEl.value, toTimeEl.value, useZulu);
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

function rangeFromAnchor(anchor, mode) {
  if (useZulu) {
    const y = anchor.getUTCFullYear();
    const m = anchor.getUTCMonth();
    const d = anchor.getUTCDate();
    if (mode === "day") {
      return { start: new Date(Date.UTC(y, m, d, 0, 0, 0, 0)), end: new Date(Date.UTC(y, m, d, 23, 59, 59, 999)) };
    }
    if (mode === "week") {
      const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
      const day = (start.getUTCDay() + 6) % 7;
      start.setUTCDate(start.getUTCDate() - day);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 6);
      end.setUTCHours(23, 59, 59, 999);
      return { start, end };
    }
    const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    return { start, end };
  }
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const d = anchor.getDate();
  if (mode === "day") {
    return { start: new Date(y, m, d, 0, 0, 0, 0), end: new Date(y, m, d, 23, 59, 59, 999) };
  }
  if (mode === "week") {
    const start = new Date(y, m, d, 0, 0, 0, 0);
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  return { start: new Date(y, m, 1, 0, 0, 0, 0), end: new Date(y, m + 1, 0, 23, 59, 59, 999) };
}

function setTodayRange() {
  const mode = rangeModeEl.value;
  const range = rangeFromAnchor(new Date(), mode);
  setControlsFromRange(range.start, range.end);
}

function shiftRange(delta) {
  const mode = rangeModeEl.value;
  const current = readRangeFromControls();
  const anchor = current ? new Date(current.start) : new Date();
  if (useZulu) {
    if (mode === "day") anchor.setUTCDate(anchor.getUTCDate() + delta);
    else if (mode === "week") anchor.setUTCDate(anchor.getUTCDate() + (7 * delta));
    else anchor.setUTCMonth(anchor.getUTCMonth() + delta);
  } else {
    if (mode === "day") anchor.setDate(anchor.getDate() + delta);
    else if (mode === "week") anchor.setDate(anchor.getDate() + (7 * delta));
    else anchor.setMonth(anchor.getMonth() + delta);
  }
  const nextRange = rangeFromAnchor(anchor, mode);
  setControlsFromRange(nextRange.start, nextRange.end);
}

function formatDisplayTime(iso) {
  const d = new Date(iso);
  if (useZulu) return d.toISOString();
  return d.toLocaleString("en-NZ", { hour12: false }) + " local";
}

function render(bookings) {
  let confirmed = 0, pending = 0, cancelled = 0, pax = 0;
  rowsEl.innerHTML = bookings.map((b) => {
    if (b.status === "confirmed") confirmed++;
    else if (b.status === "cancelled") cancelled++;
    else pending++;
    pax += b.passengers.length;
    const names = b.passengers.map((p) => p.firstName + " " + p.lastName).join(", ");
    const bookingLink = "/booking-edit?id=" + encodeURIComponent(b.supplierBookingId);
    const boardDate = toYmdLocal(b.startTimeIso);
    const opsLink = "/ops-board?view=day&date=" + encodeURIComponent(boardDate);
    return "<tr><td class='jump-cell'><a class='ops-link' href='" + opsLink + "' title='Open Ops Board for " + boardDate + "' aria-label='Open Ops Board for " + boardDate + "'>&#9992;</a></td><td><a class='link-btn' href='" + bookingLink + "'>" + b.supplierBookingId + "</a></td><td><span class='status " + statusClass(b.status) + "'>" + b.status + "</span></td><td>" + b.productCode + "</td><td>" + formatDisplayTime(b.startTimeIso) + "</td><td>" + b.passengers.length + "</td><td>" + names + "</td></tr>";
  }).join("");
  kpisEl.innerHTML = [
    ["Bookings", bookings.length], ["Passengers", pax], ["Confirmed", confirmed], ["Pending", pending], ["Cancelled", cancelled]
  ].map((x) => "<div class='kpi'><div class='label'>" + x[0] + "</div><div class='value'>" + x[1] + "</div></div>").join("");
}

function openRangeModal() {
  rangeModalEl.classList.add("open");
  rangeModalEl.setAttribute("aria-hidden", "false");
}
function closeRangeModal() {
  rangeModalEl.classList.remove("open");
  rangeModalEl.setAttribute("aria-hidden", "true");
}

function playCompletionTone() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return false;
  const ctx = new Ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.26);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.28);
  setTimeout(() => ctx.close().catch(() => {}), 350);
  return true;
}

async function pollPublishSignal() {
  try {
    const res = await fetch("/admin/publish-signal");
    const data = await res.json();
    if (!res.ok || !data.ok) return;
    const incoming = Number(data.lastPublishedMs || 0);
    if (!publishSignalArmed) {
      lastPublishSignalMs = incoming;
      publishSignalArmed = true;
      return;
    }
    if (incoming > lastPublishSignalMs) {
      lastPublishSignalMs = incoming;
      const played = playCompletionTone();
      statusEl.textContent = played
        ? "Publish detected. Browser completion sound played."
        : "Publish detected. Browser audio was blocked or unavailable.";
    }
  } catch (_) {}
}

async function load() {
  const range = readRangeFromControls();
  if (!range) {
    statusEl.textContent = "Enter valid date/time range.";
    return;
  }
  statusEl.textContent = "Loading...";
  const fromIso = range.start.toISOString();
  const toIso = range.end.toISOString();
  const url = "/sync/rezdy/bookings?fromIso=" + encodeURIComponent(fromIso) + "&toIso=" + encodeURIComponent(toIso);
  const res = await fetch(url);
  const data = await res.json();
  render(data.bookings || []);
  statusEl.textContent = "Loaded " + (data.count || 0) + " bookings.";
}

calendarBtn.addEventListener("click", openRangeModal);
closeModalBtn.addEventListener("click", closeRangeModal);
rangeModalEl.addEventListener("click", (e) => { if (e.target === rangeModalEl) closeRangeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeRangeModal(); });
rangeModeEl.addEventListener("change", () => { setTodayRange(); load().catch((e) => statusEl.textContent = e.message || "Error"); });
todayBtn.addEventListener("click", () => { setTodayRange(); load().catch((e) => statusEl.textContent = e.message || "Error"); });
prevBtn.addEventListener("click", () => { shiftRange(-1); load().catch((e) => statusEl.textContent = e.message || "Error"); });
nextBtn.addEventListener("click", () => { shiftRange(1); load().catch((e) => statusEl.textContent = e.message || "Error"); });
loadBtn.addEventListener("click", () => { load().then(closeRangeModal).catch((e) => statusEl.textContent = e.message || "Error"); });

setTodayRange();
load().catch((e) => statusEl.textContent = e.message || "Error");
pollPublishSignal().catch(() => {});
setInterval(() => { pollPublishSignal().catch(() => {}); }, publishSignalPollMs);
</script>
</body>
</html>`;

const bookingHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FlightOps Booking Detail</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 0; background: #f4f7fb; color: #10243f; }
    main { max-width: 1150px; margin: 0 auto; padding: 16px 14px 34px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .tab { text-decoration: none; border: 1px solid #c8d5e7; border-radius: 8px; padding: 8px 12px; color: #11438d; background: #ecf3ff; font-weight: 600; }
    .tab.active { background: #0f62fe; color: #fff; border-color: #0f62fe; }
    .panel { background: #fff; border: 1px solid #d7e1ee; border-radius: 12px; padding: 14px; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: end; margin: 8px 0 12px; }
    input, button { height: 36px; border-radius: 8px; border: 1px solid #c8d5e7; padding: 0 10px; font: inherit; }
    button { background: #0f62fe; color: #fff; border: 0; cursor: pointer; }
    .ghost { background: #ecf3ff; color: #11438d; border: 1px solid #c8d5e7; }
    #status { margin: 6px 0 10px; color: #4f6480; }
    pre { background: #0f172a; color: #e2e8f0; border-radius: 10px; padding: 12px; overflow: auto; }
  </style>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
<main>
  <nav class="tabs">
    <a class="tab" href="/dashboard">Dashboard</a>
    <a class="tab active" href="/booking">Booking Detail</a>
    <a class="tab" href="/booking-edit">Add/Edit Booking</a>
    <a class="tab" href="/ops-board">Ops Board</a>
  </nav>
  <section class="panel">
    <h1>Booking Detail</h1>
    <div class="row">
      <label for="bookingId">Booking ID</label>
      <input id="bookingId" type="text" placeholder="e.g. RZ-1001" />
      <button id="loadBtn">Load Booking</button>
      <button id="editBtn" class="ghost">Edit</button>
    </div>
    <div id="status">Enter a booking ID and click Load Booking.</div>
    <pre id="payload">(no booking loaded)</pre>
  </section>
</main>
<script>
const bookingIdEl = document.getElementById("bookingId");
const loadBtn = document.getElementById("loadBtn");
const editBtn = document.getElementById("editBtn");
const statusEl = document.getElementById("status");
const payloadEl = document.getElementById("payload");

function currentId() { return bookingIdEl.value.trim(); }
function setFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) bookingIdEl.value = id;
}

async function loadBooking() {
  const id = currentId();
  if (!id) {
    statusEl.textContent = "Enter a booking ID.";
    return;
  }
  statusEl.textContent = "Loading " + id + "...";
  const res = await fetch("/v1/bookings/" + encodeURIComponent(id));
  const data = await res.json();
  if (!res.ok || data.requestStatus !== "SUCCESS" || !data.booking) {
    payloadEl.textContent = "(not found)";
    statusEl.textContent = data.error || "Booking not found.";
    return;
  }
  payloadEl.textContent = JSON.stringify(data.booking, null, 2);
  statusEl.textContent = "Loaded booking " + id + ".";
}

loadBtn.addEventListener("click", () => loadBooking().catch((e) => statusEl.textContent = e.message || "Error"));
editBtn.addEventListener("click", () => {
  const id = currentId();
  if (!id) {
    statusEl.textContent = "Enter a booking ID first.";
    return;
  }
  window.location.href = "/booking-edit?id=" + encodeURIComponent(id);
});

setFromQuery();
if (currentId()) loadBooking().catch((e) => statusEl.textContent = e.message || "Error");
</script>
</body>
</html>`;

const bookingEditHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FlightOps Add/Edit Booking</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 0; background: #f4f7fb; color: #10243f; }
    main { max-width: 1200px; margin: 0 auto; padding: 16px 14px 34px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .tab { text-decoration: none; border: 1px solid #c8d5e7; border-radius: 8px; padding: 8px 12px; color: #11438d; background: #ecf3ff; font-weight: 600; }
    .tab.active { background: #0f62fe; color: #fff; border-color: #0f62fe; }
    .panel { background: #fff; border: 1px solid #d7e1ee; border-radius: 12px; padding: 14px; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: end; margin: 8px 0 12px; }
    .grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    label { font-size: .84rem; color: #4f6480; display: grid; gap: 5px; }
    input, button, select, textarea { border-radius: 8px; border: 1px solid #c8d5e7; font: inherit; }
    input, button, select { height: 36px; padding: 0 10px; }
    textarea { width: 100%; min-height: 220px; padding: 10px; font-family: Consolas, "Courier New", monospace; }
    button { background: #0f62fe; color: #fff; border: 0; cursor: pointer; }
    .ghost { background: #ecf3ff; color: #11438d; border: 1px solid #c8d5e7; }
    .danger { background: #fee2e2; color: #991b1b; border: 1px solid #f5b7b7; }
    #status { margin: 6px 0 10px; color: #4f6480; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border-bottom: 1px solid #e8eef7; padding: 6px; text-align: left; font-size: .9rem; }
    th { background: #f5f9ff; }
    td input, td select { width: 100%; }
    .summary { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; color: #4f6480; font-size: .9rem; }
    .jump-cell { width: 44px; text-align: center; }
    .ops-link { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px; text-decoration: none; background: #ecf3ff; border: 1px solid #c8d5e7; color: #11438d; font-size: 1rem; }
    .ops-link:hover { background: #dbe9ff; border-color: #a9c0e4; }
  </style>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
<main>
  <nav class="tabs">
    <a class="tab" href="/dashboard">Dashboard</a>
    <a class="tab active" href="/booking-edit">Add/Edit Booking</a>
    <a class="tab" href="/ops-board">Ops Board</a>
    <a class="tab" href="/configuration">Configuration</a>
  </nav>
  <section class="panel">
    <h1>Add / Edit / Delete Booking</h1>
    <div class="grid">
      <label>Booking ID<input id="bookingId" type="text" placeholder="e.g. RZ-NEW-100" /></label>
      <label>Status
        <select id="statusSelect">
          <option>CONFIRMED</option>
          <option>PENDING_SUPPLIER</option>
          <option>CANCELLED</option>
        </select>
      </label>
      <label>Supplier ID<input id="supplierId" type="text" value="flightops-mock" /></label>
      <label>Product Code<input id="productCode" type="text" value="FLIGHT-001" /></label>
      <label>Flight Start (Local/ISO)<input id="startTime" type="datetime-local" /></label>
      <label>Pickup Location<input id="pickupLocation" type="text" placeholder="Queenstown CBD / self-drive / airport" /></label>
      <label>Booking Contact Name<input id="contactName" type="text" placeholder="Agent or lead passenger" /></label>
      <label>Booking Contact Email<input id="contactEmail" type="email" placeholder="name@example.com" /></label>
      <label>Booking Contact Phone<input id="contactPhone" type="text" placeholder="+64 ..." /></label>
    </div>

    <div class="row">
      <button id="newBtn" class="ghost">New Template</button>
      <button id="loadBtn" class="ghost">Load Existing</button>
      <button id="saveBtn">Save (Create/Update)</button>
      <button id="deleteBtn" class="danger">Delete</button>
      <button id="showJsonBtn" class="ghost">Show JSON</button>
    </div>

    <div class="summary" id="paxSummary"></div>
    <table>
      <thead><tr><th class="jump-cell" title="Open on Ops Board">Ops</th><th>First Name</th><th>Last Name</th><th>Type</th><th>Weight (kg)</th><th>Barcode</th><th></th></tr></thead>
      <tbody id="paxRows"></tbody>
    </table>
    <div class="row"><button id="addPaxBtn" class="ghost">+ Add Passenger</button></div>

    <div id="status">Use New Template for a new booking, or Load Existing to edit one.</div>
    <textarea id="payload" spellcheck="false" style="display:none;"></textarea>
  </section>
</main>
<script>
const bookingIdEl = document.getElementById("bookingId");
const statusSelectEl = document.getElementById("statusSelect");
const supplierIdEl = document.getElementById("supplierId");
const productCodeEl = document.getElementById("productCode");
const startTimeEl = document.getElementById("startTime");
const pickupLocationEl = document.getElementById("pickupLocation");
const contactNameEl = document.getElementById("contactName");
const contactEmailEl = document.getElementById("contactEmail");
const contactPhoneEl = document.getElementById("contactPhone");
const payloadEl = document.getElementById("payload");
const statusEl = document.getElementById("status");
const paxRowsEl = document.getElementById("paxRows");
const paxSummaryEl = document.getElementById("paxSummary");
const newBtn = document.getElementById("newBtn");
const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const addPaxBtn = document.getElementById("addPaxBtn");
const showJsonBtn = document.getElementById("showJsonBtn");

function currentId() { return bookingIdEl.value.trim(); }
function toLocalDatetimeValue(isoLike) {
  const d = new Date(isoLike || Date.now());
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
}
function toIsoFromLocalInput(value) {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
}

function bookingDayYmd() {
  if (startTimeEl.value) {
    return startTimeEl.value.slice(0, 10);
  }
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function opsBoardDayHref() {
  return "/ops-board?view=day&date=" + encodeURIComponent(bookingDayYmd());
}

function refreshOpsLinks() {
  const href = opsBoardDayHref();
  const title = "Open Ops Board for " + bookingDayYmd();
  Array.from(document.querySelectorAll(".ops-link")).forEach((el) => {
    el.href = href;
    el.title = title;
    el.setAttribute("aria-label", title);
  });
}

function passengerRow(p = {}) {
  const tr = document.createElement("tr");
  tr.innerHTML = "<td class='jump-cell'><a class='ops-link' href='#' title='Open Ops Board for booking day' aria-label='Open Ops Board for booking day'>&#9992;</a></td>" +
    "<td><input class='first' value='" + (p.firstName || "") + "' /></td>" +
    "<td><input class='last' value='" + (p.lastName || "") + "' /></td>" +
    "<td><select class='ptype'><option value='adult'>adult</option><option value='child'>child</option><option value='infant'>infant</option></select></td>" +
    "<td><input class='weight' type='number' min='0' step='0.1' value='" + (p.weightKg || "") + "' /></td>" +
    "<td><input class='barcode' value='" + (p.barcode || "") + "' /></td>" +
    "<td><button type='button' class='danger del'>X</button></td>";
  tr.querySelector(".ptype").value = p.passengerType || "adult";
  tr.querySelector(".del").addEventListener("click", () => { tr.remove(); updateSummary(); });
  ["input", "change"].forEach(evt => tr.addEventListener(evt, updateSummary));
  return tr;
}

function readPassengers() {
  return Array.from(paxRowsEl.querySelectorAll("tr")).map((tr, idx) => {
    const firstName = tr.querySelector(".first").value.trim() || "Unknown";
    const lastName = tr.querySelector(".last").value.trim() || "Unknown";
    const passengerType = tr.querySelector(".ptype").value;
    const weightKg = tr.querySelector(".weight").value.trim();
    const barcode = tr.querySelector(".barcode").value.trim() || (currentId() || "RZ-NEW") + "-" + (idx + 1);
    return { firstName, lastName, passengerType, weightKg, barcode };
  });
}

function updateSummary() {
  const pax = readPassengers();
  let adults = 0, children = 0, infants = 0;
  pax.forEach((p) => {
    if (p.passengerType === "infant") infants++;
    else if (p.passengerType === "child") children++;
    else adults++;
  });
  paxSummaryEl.textContent = "Passengers: " + pax.length + " | adults: " + adults + " | children: " + children + " | infants: " + infants;
  refreshOpsLinks();
}

function setPassengers(rows) {
  paxRowsEl.innerHTML = "";
  rows.forEach((p) => paxRowsEl.appendChild(passengerRow(p)));
  if (!rows.length) paxRowsEl.appendChild(passengerRow({ firstName: "Jane", lastName: "Doe", passengerType: "adult", weightKg: "82", barcode: (currentId() || "RZ-NEW-100") + "-1" }));
  updateSummary();
}

function buildPayloadFromForm() {
  const id = currentId() || "RZ-NEW-100";
  const participants = readPassengers().map((p) => ({
    fields: [
      { label: "First Name", value: p.firstName },
      { label: "Last Name", value: p.lastName },
      { label: "Barcode", value: p.barcode },
      { label: "Passenger Type", value: p.passengerType },
      { label: "Weight Kg", value: p.weightKg || "" },
      { label: "Pickup Location", value: pickupLocationEl.value.trim() },
      { label: "Contact Name", value: contactNameEl.value.trim() },
      { label: "Contact Email", value: contactEmailEl.value.trim() },
      { label: "Contact Phone", value: contactPhoneEl.value.trim() }
    ]
  }));

  return {
    orderNumber: id,
    status: statusSelectEl.value,
    supplierId: supplierIdEl.value.trim() || "flightops-mock",
    contact: {
      name: contactNameEl.value.trim(),
      email: contactEmailEl.value.trim(),
      phone: contactPhoneEl.value.trim()
    },
    pickup: { location: pickupLocationEl.value.trim() },
    items: [
      {
        productCode: productCodeEl.value.trim() || "FLIGHT-001",
        startTimeLocal: toIsoFromLocalInput(startTimeEl.value),
        participants
      }
    ]
  };
}

function parseField(fields, label) {
  return fields.find((f) => f.label === label)?.value || "";
}

function fillFormFromPayload(payload) {
  bookingIdEl.value = payload.orderNumber || "";
  statusSelectEl.value = payload.status || "CONFIRMED";
  supplierIdEl.value = payload.supplierId || "flightops-mock";
  const item = (payload.items && payload.items[0]) || {};
  productCodeEl.value = item.productCode || "FLIGHT-001";
  startTimeEl.value = toLocalDatetimeValue(item.startTimeLocal);

  const firstParticipant = item.participants && item.participants[0];
  const firstFields = firstParticipant ? firstParticipant.fields : [];
  pickupLocationEl.value = payload.pickup?.location || parseField(firstFields, "Pickup Location");
  contactNameEl.value = payload.contact?.name || parseField(firstFields, "Contact Name");
  contactEmailEl.value = payload.contact?.email || parseField(firstFields, "Contact Email");
  contactPhoneEl.value = payload.contact?.phone || parseField(firstFields, "Contact Phone");

  const pax = (item.participants || []).map((pt) => ({
    firstName: parseField(pt.fields, "First Name"),
    lastName: parseField(pt.fields, "Last Name"),
    passengerType: parseField(pt.fields, "Passenger Type") || "adult",
    weightKg: parseField(pt.fields, "Weight Kg"),
    barcode: parseField(pt.fields, "Barcode")
  }));
  setPassengers(pax);
  payloadEl.value = JSON.stringify(payload, null, 2);
  refreshOpsLinks();
}

function setFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) bookingIdEl.value = id;
}

function newTemplate() {
  const id = currentId() || "RZ-NEW-100";
  if (!currentId()) bookingIdEl.value = id;
  const payload = {
    orderNumber: id,
    status: "CONFIRMED",
    supplierId: "flightops-mock",
    contact: { name: "", email: "", phone: "" },
    pickup: { location: "" },
    items: [{ productCode: "FLIGHT-001", startTimeLocal: new Date().toISOString(), participants: [] }]
  };
  fillFormFromPayload(payload);
  statusEl.textContent = "Template loaded. Enter booking details and save.";
}

async function loadExisting() {
  const id = currentId();
  if (!id) {
    statusEl.textContent = "Enter a booking ID to load.";
    return;
  }
  statusEl.textContent = "Loading " + id + "...";
  const res = await fetch("/v1/bookings/" + encodeURIComponent(id));
  const data = await res.json();
  if (!res.ok || data.requestStatus !== "SUCCESS" || !data.booking) {
    statusEl.textContent = data.error || "Booking not found.";
    return;
  }
  fillFormFromPayload(data.booking);
  statusEl.textContent = "Loaded booking " + id + ".";
}

async function saveBooking() {
  const id = currentId();
  if (!id) {
    statusEl.textContent = "Enter a booking ID before saving.";
    return;
  }
  const payload = buildPayloadFromForm();
  payload.orderNumber = id;
  statusEl.textContent = "Saving " + id + "...";
  const res = await fetch("/admin/bookings/" + encodeURIComponent(id), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    statusEl.textContent = data.error || "Failed to save booking.";
    return;
  }
  payloadEl.value = JSON.stringify(payload, null, 2);
  statusEl.textContent = "Saved booking " + id + ".";
}

async function deleteBooking() {
  const id = currentId();
  if (!id) {
    statusEl.textContent = "Enter a booking ID before deleting.";
    return;
  }
  const ok = confirm("Delete booking " + id + "? This cannot be undone.");
  if (!ok) return;
  statusEl.textContent = "Deleting " + id + "...";
  const res = await fetch("/admin/bookings/" + encodeURIComponent(id), { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    statusEl.textContent = data.error || "Failed to delete booking.";
    return;
  }
  statusEl.textContent = "Deleted booking " + id + ".";
}

newBtn.addEventListener("click", newTemplate);
loadBtn.addEventListener("click", () => loadExisting().catch((e) => statusEl.textContent = e.message || "Error"));
saveBtn.addEventListener("click", () => saveBooking().catch((e) => statusEl.textContent = e.message || "Error"));
deleteBtn.addEventListener("click", () => deleteBooking().catch((e) => statusEl.textContent = e.message || "Error"));
addPaxBtn.addEventListener("click", () => { paxRowsEl.appendChild(passengerRow({})); updateSummary(); });
["input", "change"].forEach((evt) => startTimeEl.addEventListener(evt, refreshOpsLinks));
showJsonBtn.addEventListener("click", () => {
  payloadEl.style.display = payloadEl.style.display === "none" ? "block" : "none";
  if (payloadEl.style.display === "block") payloadEl.value = JSON.stringify(buildPayloadFromForm(), null, 2);
});

setFromQuery();
if (currentId()) {
  loadExisting().catch(() => newTemplate());
} else {
  newTemplate();
}
</script>
</body>
</html>`;

const opsBoardHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FlightOps Ops Board</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 0; background: #f4f7fb; color: #10243f; }
    main { max-width: 1220px; margin: 0 auto; padding: 16px 14px 34px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .tab { text-decoration: none; border: 1px solid #c8d5e7; border-radius: 8px; padding: 8px 12px; color: #11438d; background: #ecf3ff; font-weight: 600; }
    .tab.active { background: #0f62fe; color: #fff; border-color: #0f62fe; }
    .panel { background: #fff; border: 1px solid #d7e1ee; border-radius: 12px; padding: 14px; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: end; margin: 8px 0 12px; }
    input, button, select { height: 36px; border-radius: 8px; border: 1px solid #c8d5e7; padding: 0 10px; font: inherit; }
    button { background: #0f62fe; color: #fff; border: 0; cursor: pointer; }
    .ghost { background: #ecf3ff; color: #11438d; border: 1px solid #c8d5e7; }
    #status { margin: 8px 0 12px; color: #4f6480; }
    .legend { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; font-size: .85rem; color: #4f6480; }
    .chip { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 4px; vertical-align: middle; }
    .board { overflow: auto; border: 1px solid #d7e1ee; border-radius: 10px; background: #fff; }
    .lane { position: relative; border-bottom: 1px solid #e8eef7; min-width: 1300px; height: 130px; }
    .lane:last-child { border-bottom: 0; }
    .lane-label { position: absolute; left: 8px; top: 8px; font-size: .85rem; color: #4f6480; font-weight: 700; }
    .tick { position: absolute; top: 0; bottom: 0; border-left: 1px dashed #d7e1ee; }
    .tick-label { position: absolute; top: 2px; left: 2px; font-size: .72rem; color: #8aa0bc; }
    .segment { position: absolute; z-index: 2; border-radius: 6px; color: #fff; font-size: .76rem; line-height: 22px; height: 22px; padding: 0 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: grab; user-select: none; touch-action: none; }
    .segment:active { cursor: grabbing; }
    .inbound { background: #0f62fe; }
    .outbound { background: #025783; }
    .ground { position: absolute; z-index: 1; height: 14px; border-radius: 999px; background: #fef3c7; color: #92400e; font-size: .68rem; line-height: 14px; display: flex; align-items: center; justify-content: center; text-align: center; padding: 0 6px; overflow: hidden; white-space: nowrap; cursor: grab; user-select: none; touch-action: none; }
    .drop-target { outline: 2px solid #60a5fa; outline-offset: -2px; }
    .dragging { opacity: .85; }
  </style>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
<main>
  <nav class="tabs">
    <a class="tab" href="/dashboard">Dashboard</a>
    <a class="tab" href="/booking-edit">Add/Edit Booking</a>
    <a class="tab active" href="/ops-board">Ops Board</a>
    <a class="tab" href="/configuration">Configuration</a>
  </nav>
  <section class="panel">
    <h1>Operations Timeline Board</h1>
    <div class="row">
      <label for="viewMode">View</label>
      <select id="viewMode">
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
      </select>
      <button id="prevBtn" class="ghost">&lt;</button>
      <input id="anchorInput" type="date" />
      <button id="nextBtn" class="ghost">&gt;</button>
      <button id="todayBtn" class="ghost">Today</button>
      <button id="loadBtn">Load Board</button>
    </div>
    <div class="legend">
      <span><span class="chip" style="background:#0f62fe"></span>Inbound scenic leg</span>
      <span><span class="chip" style="background:#0369a1"></span>Outbound return leg</span>
      <span><span class="chip" style="background:#fef3c7"></span>Ground activity window</span>
      <span>Drag a blue leg to move booking across aircraft lanes and times</span>
    </div>
    <div id="status">Choose a view/day and load board.</div>
    <div class="board" id="board"></div>
  </section>
</main>
<script>
const viewModeEl = document.getElementById("viewMode");
const anchorInputEl = document.getElementById("anchorInput");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const todayBtn = document.getElementById("todayBtn");
const loadBtn = document.getElementById("loadBtn");
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");

const aircraft = ["C208 Alpha", "C208 Beta", "GA8", "BN2"];
const inboundMin = 45;
const groundMin = 135;
const outboundMin = 45;
const gapMin = 180;
const snapMinutes = 30;
const overlapPx = 14;
const maxRowSlots = 2;
const slotHeightPx = 40;
const firstSlotTopPx = 28;
const groundOffsetPx = 4;

let model = { startMs: 0, endMs: 0, totalMin: 1440, bookings: [] };
let currentDropLane = null;
let pointerDrag = null;
let suppressClickUntilMs = 0;

function pad(n) { return String(n).padStart(2, "0"); }
function dateToYmd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function minutesBetween(a, b) { return Math.floor((b - a) / 60000); }

function parseAnchorDate() {
  const value = anchorInputEl.value;
  return value ? new Date(value + "T00:00:00") : new Date();
}

function getRange(anchor, mode) {
  const start = new Date(anchor);
  if (mode === "day") {
    start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    return { start, end, totalMin: 1440 };
  }
  if (mode === "week") {
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    return { start, end, totalMin: 10080 };
  }
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setMonth(end.getMonth() + 1);
  return { start, end, totalMin: minutesBetween(start, end) };
}

function axisWidth() {
  return 1300;
}

function toPx(minute) {
  return clamp(minute, 0, model.totalMin) * (axisWidth() / model.totalMin);
}

function segmentWidthPx(durationMin, minWidthPx = 42) {
  return Math.max(minWidthPx, toPx(durationMin) - toPx(0));
}

function getBookingLayout(booking) {
  const startMin = minutesBetween(model.startMs, booking.startMs);
  const outMin = startMin + gapMin;
  const inLeftPx = toPx(startMin);
  const inWidthPx = segmentWidthPx(inboundMin);
  const outLeftPx = toPx(outMin);
  const groundLeftPx = inLeftPx + inWidthPx - overlapPx;
  const groundRightPx = outLeftPx + overlapPx;
  return {
    startMin,
    outMin,
    inLeftPx,
    inWidthPx,
    outLeftPx,
    groundLeftPx,
    groundWidthPx: groundRightPx - groundLeftPx
  };
}

function clampPx(px) {
  return clamp(px, 0, axisWidth());
}

function parseOffsetMinutes(isoWithOffset) {
  if (typeof isoWithOffset !== "string") return 0;
  if (isoWithOffset.endsWith("Z")) return 0;
  const m = isoWithOffset.match(/([+-])(\\d{2}):(\\d{2})$/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3]));
}

function toIsoWithOffset(ms, offsetMinutes) {
  const shifted = new Date(ms + offsetMinutes * 60000);
  const y = shifted.getUTCFullYear();
  const mo = pad(shifted.getUTCMonth() + 1);
  const d = pad(shifted.getUTCDate());
  const h = pad(shifted.getUTCHours());
  const mi = pad(shifted.getUTCMinutes());
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  const oh = pad(Math.floor(abs / 60));
  const om = pad(abs % 60);
  return y + "-" + mo + "-" + d + "T" + h + ":" + mi + ":00" + sign + oh + ":" + om;
}

function setDropLane(lane) {
  if (currentDropLane && currentDropLane !== lane) currentDropLane.classList.remove("drop-target");
  currentDropLane = lane || null;
  if (currentDropLane) currentDropLane.classList.add("drop-target");
}

function clearDropLane() {
  if (currentDropLane) currentDropLane.classList.remove("drop-target");
  currentDropLane = null;
}

function laneFromPoint(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  return el ? el.closest(".lane") : null;
}

async function applyDropMove(lane, clientX, dragPayload, fallbackBookingId) {
  const bookingId = dragPayload?.bookingId || fallbackBookingId;
  if (!bookingId) return;
  const booking = model.bookings.find((b) => b.id === bookingId);
  if (!booking) return;
  const rect = lane.getBoundingClientRect();
  const grabOffsetPx = Number(dragPayload?.grabOffsetPx ?? 0);
  const anchorToDraggedLeftPx = Number(dragPayload?.anchorToDraggedLeftPx ?? 0);
  const droppedDraggedLeftPx = clampPx(clientX - rect.left - grabOffsetPx);
  const droppedAnchorLeftPx = clampPx(droppedDraggedLeftPx - anchorToDraggedLeftPx);
  const rawMinuteOffset = (droppedAnchorLeftPx / axisWidth()) * model.totalMin;
  const snappedMinuteOffset = clamp(Math.round(rawMinuteOffset / snapMinutes) * snapMinutes, 0, model.totalMin);
  const newStartMs = model.startMs + snappedMinuteOffset * 60000;
  const newLaneIndex = Number(lane.dataset.laneIndex);

  const oldStartMs = booking.startMs;
  const oldLaneIndex = booking.laneIndex;
  booking.startMs = newStartMs;
  booking.laneIndex = newLaneIndex;
  renderBoard();

  try {
    statusEl.textContent = "Saving move for " + booking.id + "...";
    const existingRes = await fetch("/v1/bookings/" + encodeURIComponent(booking.id));
    const existingData = await existingRes.json();
    if (!existingRes.ok || existingData.requestStatus !== "SUCCESS" || !existingData.booking) {
      throw new Error("Failed to read booking for update.");
    }
    const fullBooking = existingData.booking;
    if (!Array.isArray(fullBooking.items) || fullBooking.items.length === 0) {
      throw new Error("Booking has no items to update.");
    }
    const oldStartLocal = String(fullBooking.items[0].startTimeLocal ?? "");
    const offsetMinutes = parseOffsetMinutes(oldStartLocal);
    fullBooking.items[0].startTimeLocal = toIsoWithOffset(newStartMs, offsetMinutes);

    const saveRes = await fetch("/admin/bookings/" + encodeURIComponent(booking.id), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fullBooking)
    });
    const saveData = await saveRes.json();
    if (!saveRes.ok || !saveData.ok) {
      throw new Error(saveData.error || "Failed to persist booking update.");
    }

    statusEl.textContent = "Moved " + booking.id + " to " + aircraft[booking.laneIndex] + " at " + new Date(booking.startMs).toLocaleString("en-NZ", { hour12: false }) + " (snapped to 30 min).";
  } catch (err) {
    booking.startMs = oldStartMs;
    booking.laneIndex = oldLaneIndex;
    renderBoard();
    statusEl.textContent = (err && err.message) ? err.message : "Failed to save move.";
  }
}

function attachDragBehavior(seg, booking, segmentType, draggedLeftPx, anchorLeftPx) {
  seg.draggable = true;
  seg.addEventListener("dragstart", (e) => {
    const rect = seg.getBoundingClientRect();
    const rawGrabOffset = e.clientX - rect.left;
    const payload = {
      bookingId: booking.id,
      segmentType,
      grabOffsetPx: clamp(rawGrabOffset, 0, rect.width),
      anchorToDraggedLeftPx: draggedLeftPx - anchorLeftPx
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.setData("text/plain", booking.id);
    e.dataTransfer.effectAllowed = "move";
  });

  seg.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    if (!e.isPrimary) return;
    const rect = seg.getBoundingClientRect();
    pointerDrag = {
      pointerId: e.pointerId,
      bookingId: booking.id,
      segmentType,
      grabOffsetPx: clamp(e.clientX - rect.left, 0, rect.width),
      anchorToDraggedLeftPx: draggedLeftPx - anchorLeftPx,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      seg
    };
    seg.setPointerCapture(e.pointerId);
  });

  seg.addEventListener("pointermove", (e) => {
    if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;
    const dx = e.clientX - pointerDrag.startX;
    const dy = e.clientY - pointerDrag.startY;
    if (!pointerDrag.moved && Math.hypot(dx, dy) < 6) return;
    if (!pointerDrag.moved) {
      pointerDrag.moved = true;
      pointerDrag.seg.classList.add("dragging");
    }
    e.preventDefault();
    setDropLane(laneFromPoint(e.clientX, e.clientY));
  });

  seg.addEventListener("pointerup", (e) => {
    if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;
    const endedDrag = pointerDrag;
    pointerDrag = null;
    if (seg.hasPointerCapture(e.pointerId)) seg.releasePointerCapture(e.pointerId);
    endedDrag.seg.classList.remove("dragging");
    const lane = laneFromPoint(e.clientX, e.clientY);
    clearDropLane();
    if (!endedDrag.moved) return;
    e.preventDefault();
    suppressClickUntilMs = Date.now() + 400;
    if (!lane) {
      statusEl.textContent = "Drop booking over an aircraft lane to move it.";
      return;
    }
    applyDropMove(lane, e.clientX, endedDrag, endedDrag.bookingId);
  });

  seg.addEventListener("pointercancel", (e) => {
    if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;
    if (seg.hasPointerCapture(e.pointerId)) seg.releasePointerCapture(e.pointerId);
    pointerDrag.seg.classList.remove("dragging");
    pointerDrag = null;
    clearDropLane();
  });

  seg.addEventListener("click", (e) => {
    if (Date.now() < suppressClickUntilMs) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
}

function addTick(lane, minute, label) {
  const t = document.createElement("div");
  t.className = "tick";
  t.style.left = toPx(minute) + "px";
  if (label) {
    const tl = document.createElement("div");
    tl.className = "tick-label";
    tl.textContent = label;
    t.appendChild(tl);
  }
  lane.appendChild(t);
}

function buildTicks(lane) {
  const mode = viewModeEl.value;
  if (mode === "day") {
    for (let h = 0; h <= 24; h++) addTick(lane, h * 60, h < 24 ? pad(h) + ":00" : "");
    return;
  }
  if (mode === "week") {
    const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let d = 0; d <= 7; d++) addTick(lane, d * 1440, d < 7 ? names[d] : "");
    return;
  }
  const days = Math.round(model.totalMin / 1440);
  for (let d = 0; d <= days; d++) {
    const label = d < days && (d % 2 === 0) ? String(d + 1) : "";
    addTick(lane, d * 1440, label);
  }
}

function laneElement(name, laneIndex) {
  const lane = document.createElement("div");
  lane.className = "lane";
  lane.dataset.laneIndex = String(laneIndex);
  const label = document.createElement("div");
  label.className = "lane-label";
  label.textContent = name;
  lane.appendChild(label);
  buildTicks(lane);

  lane.addEventListener("dragover", (e) => {
    e.preventDefault();
    setDropLane(lane);
  });

  lane.addEventListener("dragleave", () => {
    if (currentDropLane === lane) clearDropLane();
  });

  lane.addEventListener("drop", async (e) => {
    e.preventDefault();
    clearDropLane();
    const rawPayload = e.dataTransfer.getData("application/json");
    const fallbackBookingId = e.dataTransfer.getData("text/plain");
    let dragPayload = null;
    if (rawPayload) {
      try { dragPayload = JSON.parse(rawPayload); } catch (_) { dragPayload = null; }
    }
    await applyDropMove(lane, e.clientX, dragPayload, fallbackBookingId);
  });

  return lane;
}

function addSegment(lane, booking, type, startMin, durationMin, topPx, text) {
  const seg = document.createElement("a");
  seg.className = type === "ground" ? "ground" : ("segment " + type);
  const leftPx = toPx(startMin);
  seg.style.left = leftPx + "px";
  seg.style.width = segmentWidthPx(durationMin) + "px";
  if (type !== "ground") seg.style.top = topPx + "px";
  seg.textContent = text;
  seg.href = "/booking-edit?id=" + encodeURIComponent(booking.id);
  const layout = getBookingLayout(booking);
  const anchorLeftPx = type === "outbound" ? layout.outLeftPx : layout.inLeftPx;
  attachDragBehavior(seg, booking, type, leftPx, anchorLeftPx);
  lane.appendChild(seg);
}

function addGroundSegmentPx(lane, booking, leftPx, widthPx, topPx, text) {
  const seg = document.createElement("a");
  seg.className = "ground";
  seg.style.left = leftPx + "px";
  seg.style.top = topPx + "px";
  seg.style.width = Math.max(30, widthPx) + "px";
  seg.textContent = text;
  seg.href = "/booking-edit?id=" + encodeURIComponent(booking.id);
  const layout = getBookingLayout(booking);
  attachDragBehavior(seg, booking, "ground", leftPx, layout.inLeftPx);
  lane.appendChild(seg);
}

function bookingWindowEndMs(booking) {
  return booking.startMs + ((gapMin + outboundMin) * 60000);
}

function slotForBookings(bookingsInLane) {
  const sorted = [...bookingsInLane].sort((a, b) => a.startMs - b.startMs);
  const slotEnd = Array(maxRowSlots).fill(Number.NEGATIVE_INFINITY);
  const slotMap = new Map();
  sorted.forEach((booking) => {
    let slot = slotEnd.findIndex((endMs) => booking.startMs >= endMs);
    if (slot < 0) {
      slot = slotEnd[0] <= slotEnd[1] ? 0 : 1;
    }
    slotEnd[slot] = bookingWindowEndMs(booking);
    slotMap.set(booking.id, slot);
  });
  return slotMap;
}

function renderBoard() {
  clearDropLane();
  boardEl.innerHTML = "";
  const lanes = aircraft.map((name, idx) => {
    const lane = laneElement(name, idx);
    boardEl.appendChild(lane);
    return lane;
  });

  const bookingsByLane = lanes.map(() => []);
  model.bookings.forEach((b) => {
    bookingsByLane[b.laneIndex % lanes.length].push(b);
  });

  bookingsByLane.forEach((laneBookings, laneIndex) => {
    const lane = lanes[laneIndex];
    const slotMap = slotForBookings(laneBookings);
    laneBookings.forEach((b) => {
      const slot = slotMap.get(b.id) ?? 0;
      const segmentTop = firstSlotTopPx + (slot * slotHeightPx);
      const groundTop = segmentTop + groundOffsetPx;
      const layout = getBookingLayout(b);
      addSegment(lane, b, "inbound", layout.startMin, inboundMin, segmentTop, b.productCode + " · " + b.id + " · " + b.pax + " pax");
      addGroundSegmentPx(lane, b, layout.groundLeftPx, layout.groundWidthPx, groundTop, "Ground activity");
      addSegment(lane, b, "outbound", layout.outMin, outboundMin, segmentTop, b.productCode + " · " + b.id);
    });
  });
}

async function loadBoard() {
  const anchor = parseAnchorDate();
  const mode = viewModeEl.value;
  const range = getRange(anchor, mode);
  model.startMs = range.start.getTime();
  model.endMs = range.end.getTime();
  model.totalMin = range.totalMin;

  statusEl.textContent = "Loading bookings...";
  const url = "/sync/rezdy/bookings?fromIso=" + encodeURIComponent(new Date(model.startMs).toISOString()) + "&toIso=" + encodeURIComponent(new Date(model.endMs - 1000).toISOString());
  const res = await fetch(url);
  const data = await res.json();
  const bookings = data.bookings || [];
  model.bookings = bookings.map((b, i) => ({
    id: b.supplierBookingId,
    productCode: b.productCode,
    pax: b.passengers.length,
    startMs: new Date(b.startTimeIso).getTime(),
    laneIndex: i % aircraft.length
  }));
  renderBoard();
  statusEl.textContent = "Loaded " + model.bookings.length + " bookings in " + mode + " view. Drag blue legs to reschedule.";
}

function moveAnchor(delta) {
  const d = parseAnchorDate();
  const mode = viewModeEl.value;
  if (mode === "day") d.setDate(d.getDate() + delta);
  else if (mode === "week") d.setDate(d.getDate() + 7 * delta);
  else d.setMonth(d.getMonth() + delta);
  anchorInputEl.value = dateToYmd(d);
}

(function init() {
  const params = new URLSearchParams(window.location.search);
  const viewFromQuery = params.get("view");
  const dateFromQuery = params.get("date");
  if (viewFromQuery === "day" || viewFromQuery === "week" || viewFromQuery === "month") {
    viewModeEl.value = viewFromQuery;
  }
  const now = new Date();
  anchorInputEl.value = (dateFromQuery && /^\\d{4}-\\d{2}-\\d{2}$/.test(dateFromQuery)) ? dateFromQuery : dateToYmd(now);
  loadBtn.addEventListener("click", () => loadBoard().catch((e) => statusEl.textContent = e.message || "Error"));
  todayBtn.addEventListener("click", () => { anchorInputEl.value = dateToYmd(new Date()); loadBoard().catch((e) => statusEl.textContent = e.message || "Error"); });
  prevBtn.addEventListener("click", () => { moveAnchor(-1); loadBoard().catch((e) => statusEl.textContent = e.message || "Error"); });
  nextBtn.addEventListener("click", () => { moveAnchor(1); loadBoard().catch((e) => statusEl.textContent = e.message || "Error"); });
  viewModeEl.addEventListener("change", () => loadBoard().catch((e) => statusEl.textContent = e.message || "Error"));
  loadBoard().catch((e) => statusEl.textContent = e.message || "Error");
})();
</script>
</body>
</html>`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-flightops-worker-version": "dashboard-v9"
    }
  });
}

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-flightops-worker-version": "dashboard-v9"
    }
  });
}

function readRangeFromUrl(url: URL): BookingRange {
  const fallbackFrom = new Date("2000-01-01T00:00:00Z").toISOString();
  const fallbackTo = new Date("2100-01-01T00:00:00Z").toISOString();
  return {
    fromIso: url.searchParams.get("fromIso") ?? fallbackFrom,
    toIso: url.searchParams.get("toIso") ?? fallbackTo
  };
}

function normalizeStatus(status: string): CanonicalBooking["status"] {
  const normalized = status.toUpperCase();
  if (normalized === "CANCELLED") return "cancelled";
  if (normalized === "CONFIRMED") return "confirmed";
  return "pending";
}

function mapBooking(booking: SeedBooking): CanonicalBooking {
  const firstItem = booking.items[0];
  const passengers = firstItem.participants.map((participant: SeedParticipant, index: number) => {
    const firstName = participant.fields.find((x: { label: string; value: string }) => x.label === "First Name")?.value ?? "Unknown";
    const lastName = participant.fields.find((x: { label: string; value: string }) => x.label === "Last Name")?.value ?? "Unknown";
    const id = participant.fields.find((x: { label: string; value: string }) => x.label === "Barcode")?.value ?? `${booking.orderNumber}-${index}`;
    return { id, firstName, lastName, category: "adult" as const };
  });

  return {
    supplier: "rezdy",
    supplierBookingId: booking.orderNumber,
    productCode: firstItem.productCode,
    status: normalizeStatus(booking.status),
    startTimeIso: new Date(firstItem.startTimeLocal).toISOString(),
    passengers
  };
}

function parsePathname(pathname: string): { base: string; id: string | null } {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return { base: pathname, id: null };
  return { base: `/${segments[0]}/${segments[1]}`, id: segments[2] ?? null };
}

function readCookie(cookies: string | null, name: string): string | null {
  if (!cookies) return null;
  const parts = cookies.split(";").map((x) => x.trim());
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx < 0) continue;
    if (p.slice(0, idx) === name) return p.slice(idx + 1);
  }
  return null;
}

function isUiAuthed(request: Request): boolean {
  const token = readCookie(request.headers.get("cookie"), "fo_access");
  return token === "1";
}

function requiresUiAuth(pathname: string): boolean {
  return pathname === "/dashboard" || pathname === "/booking" || pathname === "/booking-edit" || pathname === "/ops-board" || pathname === "/configuration";
}

async function listRowsByStartWindow(db: D1Database, minIso: string | null, maxIso: string | null): Promise<BookingRow[]> {
  const result = await db
    .prepare(
      `SELECT order_number, status, supplier_id, product_code, start_time_local, payload_json
       FROM bookings
       WHERE (?1 IS NULL OR start_time_local >= ?1)
         AND (?2 IS NULL OR start_time_local <= ?2)
       ORDER BY start_time_local ASC`
    )
    .bind(minIso, maxIso)
    .all<BookingRow>();

  return result.results ?? [];
}

async function getRowByOrderNumber(db: D1Database, orderNumber: string): Promise<BookingRow | null> {
  const result = await db
    .prepare(
      `SELECT order_number, status, supplier_id, product_code, start_time_local, payload_json
       FROM bookings
       WHERE order_number = ?1`
    )
    .bind(orderNumber)
    .first<BookingRow>();
  return result ?? null;
}

async function upsertBooking(db: D1Database, booking: SeedBooking): Promise<void> {
  const firstItem = booking.items[0];
  await db
    .prepare(
      `INSERT INTO bookings (order_number, status, supplier_id, product_code, start_time_local, payload_json, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ON CONFLICT(order_number) DO UPDATE SET
         status = excluded.status,
         supplier_id = excluded.supplier_id,
         product_code = excluded.product_code,
         start_time_local = excluded.start_time_local,
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at`
    )
    .bind(
      booking.orderNumber,
      booking.status,
      booking.supplierId,
      firstItem.productCode,
      firstItem.startTimeLocal,
      JSON.stringify(booking)
    )
    .run();
}

async function seedIfEmpty(db: D1Database): Promise<number> {
  const countResult = await db.prepare("SELECT COUNT(*) as count FROM bookings").first<{ count: number }>();
  const count = Number(countResult?.count ?? 0);
  if (count > 0) return 0;

  for (const booking of seedBookings) {
    await upsertBooking(db, booking);
  }
  return seedBookings.length;
}

async function reseedAll(db: D1Database): Promise<{ deleted: number; inserted: number }> {
  const deleteResult = await db.prepare("DELETE FROM bookings").run();
  let inserted = 0;
  for (const booking of seedBookings) {
    await upsertBooking(db, booking);
    inserted += 1;
  }
  return { deleted: Number(deleteResult.meta?.changes ?? 0), inserted };
}

async function ensureAppEventsTable(db: D1Database): Promise<void> {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS app_events (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  ).run();
}

async function getPublishSignalMs(db: D1Database): Promise<number> {
  await ensureAppEventsTable(db);
  const row = await db
    .prepare("SELECT value FROM app_events WHERE key = ?1")
    .bind("last_publish_ms")
    .first<{ value: string }>();
  const value = Number(row?.value ?? 0);
  return Number.isFinite(value) ? value : 0;
}

async function setPublishSignalMs(db: D1Database, value: number): Promise<void> {
  await ensureAppEventsTable(db);
  await db
    .prepare(
      `INSERT INTO app_events (key, value, updated_at)
       VALUES (?1, ?2, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`
    )
    .bind("last_publish_ms", String(value))
    .run();
}

function parseBookingBody(body: unknown): SeedBooking | null {
  if (!body || typeof body !== "object") return null;
  const booking = body as Partial<SeedBooking>;
  if (!booking.orderNumber || !booking.status || !booking.supplierId || !Array.isArray(booking.items) || booking.items.length === 0) {
    return null;
  }
  return booking as SeedBooking;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { base, id } = parsePathname(url.pathname);

    if (request.method === "GET" && url.pathname === "/favicon.svg") {
      return new Response(faviconSvg, {
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "public, max-age=86400"
        }
      });
    }

    if (request.method === "GET" && url.pathname === "/healthz") {
      return json({ ok: true, service: "flightops-cloudflare-worker" });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return html(landingHtml);
    }

    if (request.method === "GET" && url.pathname === "/auth") {
      const next = url.searchParams.get("next") ?? "/dashboard";
      return html(authHtml(next, false));
    }

    if (request.method === "POST" && url.pathname === "/auth") {
      const next = url.searchParams.get("next") ?? "/dashboard";
      const form = await request.formData().catch(() => null);
      const password = String(form?.get("password") ?? "");
      if (password !== "pizza") {
        return html(authHtml(next, true), 401);
      }
      const secure = url.protocol === "https:";
      const cookie = `fo_access=1; Path=/; Max-Age=2592000; SameSite=Lax${secure ? "; Secure" : ""}`;
      return new Response(null, { status: 302, headers: { location: next, "set-cookie": cookie } });
    }

    if (request.method === "GET" && requiresUiAuth(url.pathname) && !isUiAuthed(request)) {
      const next = `${url.pathname}${url.search}`;
      return new Response(null, { status: 302, headers: { location: `/auth?next=${encodeURIComponent(next)}` } });
    }

    if (request.method === "GET" && url.pathname === "/dashboard") {
      return html(dashboardHtml);
    }

    if (request.method === "GET" && url.pathname === "/booking") {
      const targetId = url.searchParams.get("id");
      const location = targetId ? `/booking-edit?id=${encodeURIComponent(targetId)}` : "/booking-edit";
      return new Response(null, { status: 302, headers: { location } });
    }

    if (request.method === "GET" && url.pathname === "/booking-edit") {
      return html(bookingEditHtml);
    }

    if (request.method === "GET" && url.pathname === "/ops-board") {
      return html(opsBoardHtml);
    }

    if (request.method === "GET" && url.pathname === "/configuration") {
      return html(configurationHtml);
    }

    if (request.method === "POST" && url.pathname === "/admin/seed") {
      const inserted = await seedIfEmpty(env.BOOKINGS_DB);
      return json({ ok: true, inserted });
    }

    if (request.method === "POST" && url.pathname === "/admin/reset-seed") {
      const result = await reseedAll(env.BOOKINGS_DB);
      return json({ ok: true, deleted: result.deleted, inserted: result.inserted });
    }

    if (request.method === "GET" && url.pathname === "/admin/publish-signal") {
      if (!isUiAuthed(request)) return json({ ok: false, error: "Unauthorized" }, 401);
      const lastPublishedMs = await getPublishSignalMs(env.BOOKINGS_DB);
      return json({ ok: true, lastPublishedMs });
    }

    if (request.method === "POST" && url.pathname === "/admin/publish-signal") {
      if (!isUiAuthed(request)) return json({ ok: false, error: "Unauthorized" }, 401);
      const lastPublishedMs = Date.now();
      await setPublishSignalMs(env.BOOKINGS_DB, lastPublishedMs);
      return json({ ok: true, lastPublishedMs });
    }

    if (request.method === "GET" && url.pathname === "/sync/rezdy/bookings") {
      const range = readRangeFromUrl(url);
      const rows = await listRowsByStartWindow(env.BOOKINGS_DB, range.fromIso, range.toIso);
      const bookings = rows.map((row) => mapBooking(JSON.parse(row.payload_json) as SeedBooking));
      return json({
        ok: true,
        source: "cloudflare-worker",
        count: bookings.length,
        bookings
      });
    }

    if (request.method === "GET" && base === "/v1/bookings" && !id) {
      const minIso = url.searchParams.get("minTourStartTime");
      const maxIso = url.searchParams.get("maxTourStartTime");
      const rows = await listRowsByStartWindow(env.BOOKINGS_DB, minIso, maxIso);
      const bookings = rows.map((row) => JSON.parse(row.payload_json) as SeedBooking);
      return json({ requestStatus: "SUCCESS", bookings });
    }

    if (request.method === "GET" && base === "/v1/bookings" && id) {
      const row = await getRowByOrderNumber(env.BOOKINGS_DB, id);
      if (!row) return json({ requestStatus: "ERROR", error: "Not found" }, 404);
      return json({ requestStatus: "SUCCESS", booking: JSON.parse(row.payload_json) as SeedBooking });
    }

    if (request.method === "POST" && url.pathname === "/admin/bookings") {
      const body = await request.json().catch(() => null);
      const booking = parseBookingBody(body);
      if (!booking) return json({ ok: false, error: "Invalid booking payload" }, 400);
      await upsertBooking(env.BOOKINGS_DB, booking);
      return json({ ok: true, orderNumber: booking.orderNumber }, 201);
    }

    if (request.method === "PUT" && base === "/admin/bookings" && id) {
      const body = await request.json().catch(() => null);
      const booking = parseBookingBody(body);
      if (!booking) return json({ ok: false, error: "Invalid booking payload" }, 400);
      booking.orderNumber = id;
      await upsertBooking(env.BOOKINGS_DB, booking);
      return json({ ok: true, orderNumber: booking.orderNumber });
    }

    if (request.method === "DELETE" && base === "/admin/bookings" && id) {
      await env.BOOKINGS_DB.prepare("DELETE FROM bookings WHERE order_number = ?1").bind(id).run();
      return json({ ok: true, orderNumber: id });
    }

    return json({ ok: false, error: "Route not found" }, 404);
  }
};









