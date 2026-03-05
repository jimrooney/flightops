export type PassengerCategory = "adult" | "child" | "infant" | "crew";

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  category: PassengerCategory;
  weightKg?: number;
  baggageKg?: number;
}

export interface Booking {
  supplier: "rezdy" | "fareharbor";
  supplierBookingId: string;
  productCode: string;
  status: "confirmed" | "pending" | "cancelled";
  startTimeIso: string;
  passengers: Passenger[];
  notes?: string;
}
