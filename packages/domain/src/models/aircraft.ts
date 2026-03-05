export interface Aircraft {
  id: string;
  registration: string;
  type: string;
  basicEmptyWeightKg: number;
  basicEmptyArmMm: number;
  maxTakeoffWeightKg: number;
}

export interface AircraftEnvelopePoint {
  armMm: number;
  minWeightKg: number;
  maxWeightKg: number;
}

export interface AircraftEnvelope {
  id: string;
  aircraftId: string;
  points: AircraftEnvelopePoint[];
}
