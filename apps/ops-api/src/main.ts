import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { RezdyAdapter } from "@flightops/adapters";

interface HealthResponse {
  ok: boolean;
  service: string;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function sendHtml(res: ServerResponse, status: number, html: string): void {
  res.statusCode = status;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(html);
}

function getRangeFromQuery(req: IncomingMessage): { fromIso: string; toIso: string } {
  const fallbackFrom = new Date("2000-01-01T00:00:00Z").toISOString();
  const fallbackTo = new Date("2100-01-01T00:00:00Z").toISOString();
  if (!req.url) {
    return { fromIso: fallbackFrom, toIso: fallbackTo };
  }

  const url = new URL(req.url, "http://localhost");
  const fromIso = url.searchParams.get("fromIso") || fallbackFrom;
  const toIso = url.searchParams.get("toIso") || fallbackTo;
  return { fromIso, toIso };
}

function bootstrap(): HealthResponse {
  return { ok: true, service: "ops-api" };
}

const dashboardHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>FlightOps Mock Dashboard</title>
    <style>
      :root {
        --bg: linear-gradient(130deg, #f6f7f9 0%, #e8edf5 55%, #dce6f4 100%);
        --card: rgba(255, 255, 255, 0.8);
        --ink: #10223f;
        --muted: #4f6688;
        --accent: #d74f2a;
        --accent-2: #2563eb;
        --border: rgba(16, 34, 63, 0.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", "Trebuchet MS", sans-serif;
        color: var(--ink);
        background: var(--bg);
        min-height: 100vh;
      }
      main {
        max-width: 1100px;
        margin: 0 auto;
        padding: 24px 16px 40px;
      }
      .hero {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 18px;
        box-shadow: 0 16px 30px rgba(16, 34, 63, 0.08);
      }
      h1 {
        margin: 0;
        font-size: clamp(1.35rem, 2.5vw, 2rem);
      }
      .sub {
        margin: 6px 0 0;
        color: var(--muted);
      }
      form {
        margin-top: 14px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      label {
        display: grid;
        gap: 4px;
        font-size: 0.88rem;
        color: var(--muted);
      }
      input, button {
        height: 38px;
        padding: 0 10px;
        border-radius: 10px;
        border: 1px solid var(--border);
        font: inherit;
      }
      button {
        border: 0;
        background: linear-gradient(135deg, var(--accent), #f2713a);
        color: #fff;
        font-weight: 600;
        padding: 0 16px;
        cursor: pointer;
      }
      button.secondary {
        background: linear-gradient(135deg, var(--accent-2), #3b82f6);
      }
      .status {
        margin-top: 12px;
        color: var(--muted);
        font-size: 0.94rem;
      }
      .kpis {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 10px;
      }
      .kpi {
        background: #ffffffcc;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 10px;
      }
      .kpi .label {
        font-size: 0.78rem;
        color: var(--muted);
      }
      .kpi .value {
        margin-top: 4px;
        font-size: 1.25rem;
        font-weight: 700;
      }
      .table-wrap {
        margin-top: 16px;
        background: #ffffffcf;
        border: 1px solid var(--border);
        border-radius: 14px;
        overflow: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 780px;
      }
      th, td {
        padding: 10px;
        border-bottom: 1px solid rgba(16, 34, 63, 0.08);
        text-align: left;
        font-size: 0.92rem;
      }
      th {
        position: sticky;
        top: 0;
        background: #f8fafddd;
      }
      .pill {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 700;
      }
      .confirmed { background: #dcfce7; color: #166534; }
      .pending { background: #fef3c7; color: #92400e; }
      .cancelled { background: #fee2e2; color: #991b1b; }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>FlightOps Mock Bookings</h1>
        <p class="sub">Live view from <code>/sync/rezdy/bookings</code> (mock supplier data).</p>
        <form id="rangeForm">
          <label>From ISO
            <input id="fromIso" name="fromIso" />
          </label>
          <label>To ISO
            <input id="toIso" name="toIso" />
          </label>
          <button type="submit">Load</button>
          <button class="secondary" id="todayBtn" type="button">Today Window</button>
        </form>
        <div class="status" id="status">Ready.</div>
        <div class="kpis" id="kpis"></div>
      </section>
      <section class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Status</th>
              <th>Product</th>
              <th>Start (ISO)</th>
              <th>Passengers</th>
              <th>Names</th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </section>
    </main>
    <script>
      const rowsEl = document.getElementById("rows");
      const statusEl = document.getElementById("status");
      const kpisEl = document.getElementById("kpis");
      const fromEl = document.getElementById("fromIso");
      const toEl = document.getElementById("toIso");
      const formEl = document.getElementById("rangeForm");
      const todayBtn = document.getElementById("todayBtn");

      function iso(d) {
        return new Date(d).toISOString();
      }

      function setTodayWindow() {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        fromEl.value = iso(start);
        toEl.value = iso(end);
      }

      function statusClass(status) {
        if (status === "confirmed") return "confirmed";
        if (status === "cancelled") return "cancelled";
        return "pending";
      }

      function renderKpis(bookings) {
        const totals = { confirmed: 0, pending: 0, cancelled: 0, pax: 0 };
        for (const booking of bookings) {
          totals[booking.status] = (totals[booking.status] || 0) + 1;
          totals.pax += booking.passengers.length;
        }
        const cards = [
          ["Bookings", String(bookings.length)],
          ["Passengers", String(totals.pax)],
          ["Confirmed", String(totals.confirmed)],
          ["Pending", String(totals.pending)],
          ["Cancelled", String(totals.cancelled)]
        ];
        kpisEl.innerHTML = cards
          .map(([label, value]) => '<article class="kpi"><div class="label">' + label + '</div><div class="value">' + value + "</div></article>")
          .join("");
      }

      function renderRows(bookings) {
        rowsEl.innerHTML = bookings
          .map((booking) => {
            const names = booking.passengers.map((p) => p.firstName + " " + p.lastName).join(", ");
            const cls = statusClass(booking.status);
            return (
              "<tr>" +
              "<td>" + booking.supplierBookingId + "</td>" +
              '<td><span class="pill ' + cls + '">' + booking.status + "</span></td>" +
              "<td>" + booking.productCode + "</td>" +
              "<td>" + booking.startTimeIso + "</td>" +
              "<td>" + booking.passengers.length + "</td>" +
              "<td>" + (names || "-") + "</td>" +
              "</tr>"
            );
          })
          .join("");
      }

      async function loadData() {
        const fromIso = fromEl.value.trim();
        const toIso = toEl.value.trim();
        statusEl.textContent = "Loading...";
        const url = "/sync/rezdy/bookings?fromIso=" + encodeURIComponent(fromIso) + "&toIso=" + encodeURIComponent(toIso);
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Request failed: " + res.status);
        }
        const data = await res.json();
        renderKpis(data.bookings || []);
        renderRows(data.bookings || []);
        statusEl.textContent = "Loaded " + (data.count || 0) + " booking(s).";
      }

      formEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          await loadData();
        } catch (err) {
          statusEl.textContent = err instanceof Error ? err.message : "Unknown error";
        }
      });

      todayBtn.addEventListener("click", () => {
        setTodayWindow();
      });

      setTodayWindow();
      loadData().catch((err) => {
        statusEl.textContent = err instanceof Error ? err.message : "Unknown error";
      });
    </script>
  </body>
</html>`;

const rezdy = new RezdyAdapter();

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { ok: false, error: "Invalid request" });
    return;
  }

  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname === "/healthz") {
    sendJson(res, 200, bootstrap());
    return;
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/dashboard")) {
    sendHtml(res, 200, dashboardHtml);
    return;
  }

  if (req.method === "GET" && url.pathname === "/sync/rezdy/bookings") {
    try {
      const range = getRangeFromQuery(req);
      const bookings = await rezdy.pullBookings(range);
      sendJson(res, 200, {
        ok: true,
        source: "rezdy-adapter",
        baseUrl: process.env.REZDY_API_BASE_URL || "http://localhost:4010",
        count: bookings.length,
        bookings,
      });
    } catch (err) {
      sendJson(res, 502, {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown sync error",
      });
    }
    return;
  }

  sendJson(res, 404, { ok: false, error: "Route not found" });
});

const port = Number.parseInt(process.env.OPS_API_PORT || "4020", 10);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`ops-api listening on http://localhost:${port}`);
});
