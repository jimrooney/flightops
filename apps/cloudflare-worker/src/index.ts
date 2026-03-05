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

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
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

    if (request.method === "POST" && url.pathname === "/admin/seed") {
      const inserted = await seedIfEmpty(env.BOOKINGS_DB);
      return json({ ok: true, inserted });
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
