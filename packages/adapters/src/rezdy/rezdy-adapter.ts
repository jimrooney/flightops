import type { SupplierAdapter } from "../contract/supplier-adapter.js";
import type { BookingRange, CanonicalBooking } from "../contract/types.js";

interface RezdyAdapterOptions {
  baseUrl?: string;
  apiKey?: string;
  fetchFn?: typeof fetch;
}

type RezdyField = { label: string; value: unknown };
type RezdyParticipant = { fields?: RezdyField[] };
type RezdyItem = {
  productCode?: string;
  startTimeLocal?: string;
  participants?: RezdyParticipant[];
};
type RezdyBooking = {
  orderNumber?: string;
  status?: string;
  items?: RezdyItem[];
};

export class RezdyAdapter implements SupplierAdapter {
  readonly supplier = "rezdy" as const;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: RezdyAdapterOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.REZDY_API_BASE_URL ?? "http://localhost:4010";
    this.apiKey = options.apiKey ?? process.env.REZDY_API_KEY ?? "mock-api-key";
    this.fetchFn = options.fetchFn ?? fetch;
  }

  private async fetchJson(path: string, params: Record<string, string>): Promise<unknown> {
    const url = new URL(path, this.baseUrl);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await this.fetchFn(url);
    if (!res.ok) {
      throw new Error(`RezdyAdapter request failed (${res.status}) ${url.toString()}`);
    }
    return res.json();
  }

  private mapStatus(status?: string): "confirmed" | "pending" | "cancelled" {
    const normalized = (status ?? "").toUpperCase();
    if (normalized === "CANCELLED") return "cancelled";
    if (normalized === "CONFIRMED") return "confirmed";
    return "pending";
  }

  private getFieldValue(fields: RezdyField[] | undefined, label: string): string {
    if (!fields) return "";
    const value = fields.find((f) => f.label === label)?.value;
    return typeof value === "string" ? value : "";
  }

  private mapBooking(booking: RezdyBooking): CanonicalBooking | null {
    const firstItem = booking.items?.[0];
    if (!booking.orderNumber || !firstItem?.startTimeLocal) {
      return null;
    }

    const passengers =
      firstItem.participants?.map((participant, index) => ({
        id: this.getFieldValue(participant.fields, "Barcode") || `${booking.orderNumber}-${index}`,
        firstName: this.getFieldValue(participant.fields, "First Name") || "Unknown",
        lastName: this.getFieldValue(participant.fields, "Last Name") || "Unknown",
        category: "adult" as const,
      })) ?? [];

    return {
      supplier: "rezdy",
      supplierBookingId: booking.orderNumber,
      productCode: firstItem.productCode ?? "UNKNOWN",
      status: this.mapStatus(booking.status),
      startTimeIso: new Date(firstItem.startTimeLocal).toISOString(),
      passengers,
    };
  }

  async pullBookings(range: BookingRange): Promise<CanonicalBooking[]> {
    const data = (await this.fetchJson("/v1/bookings", {
      apiKey: this.apiKey,
      minTourStartTime: range.fromIso,
      maxTourStartTime: range.toIso,
    })) as { bookings?: RezdyBooking[] };

    return (data.bookings ?? [])
      .map((booking) => this.mapBooking(booking))
      .filter((booking): booking is CanonicalBooking => booking !== null);
  }

  async getBooking(supplierBookingId: string): Promise<CanonicalBooking | null> {
    const data = (await this.fetchJson(`/v1/bookings/${supplierBookingId}`, {
      apiKey: this.apiKey,
    })) as { booking?: RezdyBooking };
    if (!data.booking) {
      return null;
    }
    return this.mapBooking(data.booking);
  }

  async pushAssignment(_input: {
    supplierBookingId: string;
    flightLegId: string;
    note?: string;
  }): Promise<void> {
    // Intentionally a no-op for initial sandboxed integration.
  }

  async healthcheck(): Promise<{ ok: boolean; detail?: string }> {
    try {
      const url = new URL("/healthz", this.baseUrl);
      const res = await this.fetchFn(url);
      return res.ok ? { ok: true } : { ok: false, detail: `status=${res.status}` };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : "unknown error" };
    }
  }
}
