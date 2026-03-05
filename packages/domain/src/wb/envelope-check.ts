import type { WeightBalanceResult } from "../models/wb.js";
import type { AircraftEnvelope } from "../models/aircraft.js";

export function checkEnvelope(result: WeightBalanceResult, envelope: AircraftEnvelope): WeightBalanceResult {
  if (envelope.points.length === 0) {
    return {
      ...result,
      withinEnvelope: false,
      violations: [...result.violations, "Envelope has no points"],
    };
  }

  const minArm = Math.min(...envelope.points.map((p) => p.armMm));
  const maxArm = Math.max(...envelope.points.map((p) => p.armMm));

  if (result.cgMm < minArm || result.cgMm > maxArm) {
    return {
      ...result,
      withinEnvelope: false,
      violations: [...result.violations, "CG outside envelope arm bounds"],
    };
  }

  return result;
}
