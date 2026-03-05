import type { SupplierAdapter } from "../contract/supplier-adapter.js";
import type { BookingRange, CanonicalBooking } from "../contract/types.js";

export class FareHarborAdapter implements SupplierAdapter {
  readonly supplier = "fareharbor" as const;

  async pullBookings(_range: BookingRange): Promise<CanonicalBooking[]> {
    return [];
  }

  async getBooking(_supplierBookingId: string): Promise<CanonicalBooking | null> {
    return null;
  }

  async pushAssignment(_input: { supplierBookingId: string; flightLegId: string; note?: string }): Promise<void> {
    return;
  }

  async healthcheck(): Promise<{ ok: boolean; detail?: string }> {
    return { ok: true };
  }
}
