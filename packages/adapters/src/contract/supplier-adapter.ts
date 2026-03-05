import type { BookingRange, CanonicalBooking } from "./types.js";

export interface SupplierAdapter {
  readonly supplier: "rezdy" | "fareharbor";
  pullBookings(range: BookingRange): Promise<CanonicalBooking[]>;
  getBooking(supplierBookingId: string): Promise<CanonicalBooking | null>;
  pushAssignment(input: {
    supplierBookingId: string;
    flightLegId: string;
    note?: string;
  }): Promise<void>;
  healthcheck(): Promise<{ ok: boolean; detail?: string }>;
}
