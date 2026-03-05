export interface ArmItem {
  name: string;
  weightKg: number;
  armMm: number;
}

export interface WeightBalanceInput {
  aircraftId: string;
  envelopeId: string;
  items: ArmItem[];
}

export interface WeightBalanceResult {
  totalWeightKg: number;
  totalMoment: number;
  cgMm: number;
  withinEnvelope: boolean;
  violations: string[];
}
