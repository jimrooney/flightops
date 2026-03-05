export type SupplierName = "rezdy" | "fareharbor";

export interface BookingRange {
  fromIso: string;
  toIso: string;
}

export interface CanonicalPassenger {
  id: string;
  firstName: string;
  lastName: string;
  weightKg?: number;
  category: "adult" | "child" | "infant" | "crew";
  baggageKg?: number;
}

export interface CanonicalBooking {
  supplier: SupplierName;
  supplierBookingId: string;
  productCode: string;
  status: "confirmed" | "pending" | "cancelled";
  startTimeIso: string;
  passengers: CanonicalPassenger[];
  notes?: string;
}
