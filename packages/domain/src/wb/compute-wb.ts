import type { WeightBalanceInput, WeightBalanceResult } from "../models/wb.js";

export function computeWeightBalance(input: WeightBalanceInput): WeightBalanceResult {
  const totalWeightKg = input.items.reduce((acc, item) => acc + item.weightKg, 0);
  const totalMoment = input.items.reduce((acc, item) => acc + item.weightKg * item.armMm, 0);
  const cgMm = totalWeightKg > 0 ? totalMoment / totalWeightKg : 0;

  return {
    totalWeightKg,
    totalMoment,
    cgMm,
    withinEnvelope: true,
    violations: [],
  };
}
