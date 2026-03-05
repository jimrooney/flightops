import type { WeightBalanceResult } from "../models/wb.js";

export type RuleSeverity = "hard" | "soft";

export interface RuleViolation {
  code: string;
  message: string;
  severity: RuleSeverity;
}

export interface RuleContext {
  wb: WeightBalanceResult;
}

export interface Rule {
  id: string;
  severity: RuleSeverity;
  evaluate(ctx: RuleContext): RuleViolation[];
}
