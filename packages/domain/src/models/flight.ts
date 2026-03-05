export interface FlightLeg {
  id: string;
  dateIso: string;
  departureStation: string;
  arrivalStation: string;
  departureTimeIso: string;
  aircraftId: string;
}

export interface Assignment {
  flightLegId: string;
  passengerId: string;
  seatId?: string;
}
