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
    .toggle { display: flex; gap: 8px; align-items: center; font-weight: 600; }
    .mode-note { color: #4f6480; font-size: .88rem; }
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
  </style>
</head>
<body>
<main>
  <nav class="tabs">
    <a class="tab active" href="/dashboard">Dashboard</a>
    <a class="tab" href="/booking">Booking Detail</a>
    <a class="tab" href="/booking-edit">Add/Edit Booking</a>
  </nav>
  <section class="panel">
    <h1>FlightOps Bookings Dashboard</h1>
    <div class="row">
      <label class="toggle"><input id="zuluToggle" type="checkbox" /> Use Zulu / UTC</label>
      <span class="mode-note" id="modeNote">Mode: Local time (QT/browser timezone)</span>
    </div>
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
      <button id="prevBtn" class="ghost" title="Previous day">&lt;</button>
      <button id="todayBtn" class="ghost">Today</button>
      <button id="nextBtn" class="ghost" title="Next day">&gt;</button>
      <button id="resetSeedBtn" class="danger" title="Delete current bookings and reinsert default seed">Reset Seed</button>
      <button id="loadBtn">Load</button>
    </div>
    <div id="status">Ready.</div>
    <div class="kpis" id="kpis"></div>
  </section>
  <section class="table">
    <table>
      <thead><tr><th>Booking</th><th>Status</th><th>Product</th><th>Start</th><th>Pax</th><th>Names</th></tr></thead>
      <tbody id="rows"></tbody>
    </table>
  </section>
</main>
<script>
const fromDateEl = document.getElementById("fromDate");
const fromTimeEl = document.getElementById("fromTime");
const toDateEl = document.getElementById("toDate");
const toTimeEl = document.getElementById("toTime");
const zuluToggleEl = document.getElementById("zuluToggle");
const modeNoteEl = document.getElementById("modeNote");
const loadBtn = document.getElementById("loadBtn");
const resetSeedBtn = document.getElementById("resetSeedBtn");
const todayBtn = document.getElementById("todayBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const rowsEl = document.getElementById("rows");
const statusEl = document.getElementById("status");
const kpisEl = document.getElementById("kpis");

function pad(n) { return String(n).padStart(2, "0"); }
function statusClass(s) { return s === "confirmed" ? "confirmed" : (s === "cancelled" ? "cancelled" : "pending"); }

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
  const isZulu = zuluToggleEl.checked;
  const a = partsFromDate(start, isZulu);
  const b = partsFromDate(end, isZulu);
  fromDateEl.value = a.date;
  fromTimeEl.value = a.time;
  toDateEl.value = b.date;
  toTimeEl.value = b.time;
}

function readRangeFromControls() {
  const isZulu = zuluToggleEl.checked;
  const start = fromControlsToDate(fromDateEl.value, fromTimeEl.value, isZulu);
  const end = fromControlsToDate(toDateEl.value, toTimeEl.value, isZulu);
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

function setTodayRange() {
  const now = new Date();
  if (zuluToggleEl.checked) {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
    setControlsFromRange(start, end);
  } else {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    setControlsFromRange(start, end);
  }
}

function shiftDay(delta) {
  const range = readRangeFromControls();
  if (!range) return;
  range.start.setDate(range.start.getDate() + delta);
  range.end.setDate(range.end.getDate() + delta);
  setControlsFromRange(range.start, range.end);
}

function formatDisplayTime(iso) {
  const d = new Date(iso);
  if (zuluToggleEl.checked) return d.toISOString();
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
    const bookingLink = "/booking?id=" + encodeURIComponent(b.supplierBookingId);
    return "<tr><td><a class='link-btn' href='" + bookingLink + "'>" + b.supplierBookingId + "</a></td><td><span class='status " + statusClass(b.status) + "'>" + b.status + "</span></td><td>" + b.productCode + "</td><td>" + formatDisplayTime(b.startTimeIso) + "</td><td>" + b.passengers.length + "</td><td>" + names + "</td></tr>";
  }).join("");
  kpisEl.innerHTML = [
    ["Bookings", bookings.length], ["Passengers", pax], ["Confirmed", confirmed], ["Pending", pending], ["Cancelled", cancelled]
  ].map((x) => "<div class='kpi'><div class='label'>" + x[0] + "</div><div class='value'>" + x[1] + "</div></div>").join("");
}

function setModeNote() {
  modeNoteEl.textContent = zuluToggleEl.checked ? "Mode: Zulu / UTC" : "Mode: Local time (QT/browser timezone)";
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

zuluToggleEl.addEventListener("change", () => {
  const oldRange = readRangeFromControls();
  setModeNote();
  if (oldRange) setControlsFromRange(oldRange.start, oldRange.end);
});
todayBtn.addEventListener("click", () => { setTodayRange(); load().catch((e) => statusEl.textContent = e.message || "Error"); });
prevBtn.addEventListener("click", () => { shiftDay(-1); load().catch((e) => statusEl.textContent = e.message || "Error"); });
nextBtn.addEventListener("click", () => { shiftDay(1); load().catch((e) => statusEl.textContent = e.message || "Error"); });
resetSeedBtn.addEventListener("click", () => { resetSeed().then(() => load()).catch((e) => statusEl.textContent = e.message || "Error"); });
loadBtn.addEventListener("click", () => { load().catch((e) => statusEl.textContent = e.message || "Error"); });

setModeNote();
setTodayRange();
load().catch((e) => statusEl.textContent = e.message || "Error");
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
</head>
<body>
<main>
  <nav class="tabs">
    <a class="tab" href="/dashboard">Dashboard</a>
    <a class="tab active" href="/booking">Booking Detail</a>
    <a class="tab" href="/booking-edit">Add/Edit Booking</a>
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
    main { max-width: 1150px; margin: 0 auto; padding: 16px 14px 34px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .tab { text-decoration: none; border: 1px solid #c8d5e7; border-radius: 8px; padding: 8px 12px; color: #11438d; background: #ecf3ff; font-weight: 600; }
    .tab.active { background: #0f62fe; color: #fff; border-color: #0f62fe; }
    .panel { background: #fff; border: 1px solid #d7e1ee; border-radius: 12px; padding: 14px; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: end; margin: 8px 0 12px; }
    input, button, textarea { border-radius: 8px; border: 1px solid #c8d5e7; font: inherit; }
    input, button { height: 36px; padding: 0 10px; }
    textarea { width: 100%; min-height: 380px; padding: 10px; font-family: Consolas, "Courier New", monospace; }
    button { background: #0f62fe; color: #fff; border: 0; cursor: pointer; }
    .ghost { background: #ecf3ff; color: #11438d; border: 1px solid #c8d5e7; }
    .danger { background: #fee2e2; color: #991b1b; border: 1px solid #f5b7b7; }
    #status { margin: 6px 0 10px; color: #4f6480; }
  </style>
</head>
<body>
<main>
  <nav class="tabs">
    <a class="tab" href="/dashboard">Dashboard</a>
    <a class="tab" href="/booking">Booking Detail</a>
    <a class="tab active" href="/booking-edit">Add/Edit Booking</a>
  </nav>
  <section class="panel">
    <h1>Add / Edit / Delete Booking</h1>
    <div class="row">
      <label for="bookingId">Booking ID</label>
      <input id="bookingId" type="text" placeholder="e.g. RZ-NEW-100" />
      <button id="newBtn" class="ghost">New Template</button>
      <button id="loadBtn" class="ghost">Load Existing</button>
      <button id="saveBtn">Save (Create/Update)</button>
      <button id="deleteBtn" class="danger">Delete</button>
    </div>
    <div id="status">Use New Template for a new booking, or Load Existing to edit one.</div>
    <textarea id="payload" spellcheck="false"></textarea>
  </section>
</main>
<script>
const bookingIdEl = document.getElementById("bookingId");
const payloadEl = document.getElementById("payload");
const statusEl = document.getElementById("status");
const newBtn = document.getElementById("newBtn");
const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");

function currentId() { return bookingIdEl.value.trim(); }

function buildTemplate(id) {
  const orderId = id || "RZ-NEW-100";
  return {
    orderNumber: orderId,
    status: "CONFIRMED",
    supplierId: "flightops-mock",
    items: [
      {
        productCode: "FLIGHT-001",
        startTimeLocal: new Date().toISOString(),
        participants: [
          {
            fields: [
              { label: "First Name", value: "Jane" },
              { label: "Last Name", value: "Doe" },
              { label: "Barcode", value: orderId + "-1" }
            ]
          }
        ]
      }
    ]
  };
}

function setFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) bookingIdEl.value = id;
}

function setPayload(obj) {
  payloadEl.value = JSON.stringify(obj, null, 2);
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
  setPayload(data.booking);
  statusEl.textContent = "Loaded booking " + id + ".";
}

async function saveBooking() {
  const id = currentId();
  if (!id) {
    statusEl.textContent = "Enter a booking ID before saving.";
    return;
  }
  let payload;
  try {
    payload = JSON.parse(payloadEl.value);
  } catch {
    statusEl.textContent = "Payload is not valid JSON.";
    return;
  }
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
  setPayload(payload);
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
  payloadEl.value = "";
  statusEl.textContent = "Deleted booking " + id + ".";
}

newBtn.addEventListener("click", () => {
  const id = currentId() || "RZ-NEW-100";
  if (!currentId()) bookingIdEl.value = id;
  setPayload(buildTemplate(id));
  statusEl.textContent = "Template loaded. Update fields and click Save.";
});
loadBtn.addEventListener("click", () => loadExisting().catch((e) => statusEl.textContent = e.message || "Error"));
saveBtn.addEventListener("click", () => saveBooking().catch((e) => statusEl.textContent = e.message || "Error"));
deleteBtn.addEventListener("click", () => deleteBooking().catch((e) => statusEl.textContent = e.message || "Error"));

setFromQuery();
if (currentId()) {
  loadExisting().catch(() => {
    setPayload(buildTemplate(currentId()));
    statusEl.textContent = "Booking not found. Template loaded for new booking with this ID.";
  });
} else {
  setPayload(buildTemplate("RZ-NEW-100"));
}
</script>
</body>
</html>`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-flightops-worker-version": "dashboard-v5"
    }
  });
}

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-flightops-worker-version": "dashboard-v5"
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

    if (request.method === "GET" && url.pathname === "/healthz") {
      return json({ ok: true, service: "flightops-cloudflare-worker" });
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/dashboard")) {
      return html(dashboardHtml);
    }

    if (request.method === "GET" && url.pathname === "/booking") {
      return html(bookingHtml);
    }

    if (request.method === "GET" && url.pathname === "/booking-edit") {
      return html(bookingEditHtml);
    }

    if (request.method === "POST" && url.pathname === "/admin/seed") {
      const inserted = await seedIfEmpty(env.BOOKINGS_DB);
      return json({ ok: true, inserted });
    }

    if (request.method === "POST" && url.pathname === "/admin/reset-seed") {
      const result = await reseedAll(env.BOOKINGS_DB);
      return json({ ok: true, deleted: result.deleted, inserted: result.inserted });
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





