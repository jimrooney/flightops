import { createServer, IncomingMessage, ServerResponse } from "node:http";
import fixtures from "./fixtures/rezdy-bookings.json" with { type: "json" };

type MockBooking = (typeof fixtures.bookings)[number];

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function getParam(url: URL, key: string): string | null {
  const value = url.searchParams.get(key);
  return value && value.trim() ? value : null;
}

function listBookings(reqUrl: URL): MockBooking[] {
  const minIso = getParam(reqUrl, "minTourStartTime");
  const maxIso = getParam(reqUrl, "maxTourStartTime");
  if (!minIso || !maxIso) {
    return fixtures.bookings;
  }

  const min = new Date(minIso).getTime();
  const max = new Date(maxIso).getTime();
  if (Number.isNaN(min) || Number.isNaN(max)) {
    return fixtures.bookings;
  }

  return fixtures.bookings.filter((booking) =>
    booking.items.some((item) => {
      const t = new Date(item.startTimeLocal).getTime();
      return !Number.isNaN(t) && t >= min && t <= max;
    })
  );
}

function normalizeOrderNumber(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  return parts[2] || "";
}

function handler(req: IncomingMessage, res: ServerResponse): void {
  if (!req.url || !req.method) {
    sendJson(res, 400, { requestStatus: "ERROR", error: "Invalid request" });
    return;
  }

  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/healthz") {
    sendJson(res, 200, { ok: true, service: "supplier-mock" });
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { requestStatus: "ERROR", error: "Method not allowed" });
    return;
  }

  if (url.pathname === "/v1/bookings") {
    const bookings = listBookings(url);
    sendJson(res, 200, { requestStatus: "SUCCESS", bookings });
    return;
  }

  if (url.pathname.startsWith("/v1/bookings/")) {
    const orderNumber = normalizeOrderNumber(url.pathname);
    const booking = fixtures.bookings.find((x) => x.orderNumber === orderNumber);
    if (!booking) {
      sendJson(res, 404, { requestStatus: "ERROR", error: "Not found" });
      return;
    }
    sendJson(res, 200, { requestStatus: "SUCCESS", booking });
    return;
  }

  sendJson(res, 404, { requestStatus: "ERROR", error: "Unknown route" });
}

const port = Number.parseInt(process.env.MOCK_SUPPLIER_PORT || "4010", 10);
const server = createServer(handler);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`supplier-mock listening on http://localhost:${port}`);
});
