import type { Rule, RuleContext, RuleViolation } from "./rule-types.js";

export function evaluateRules(ctx: RuleContext, rules: Rule[]): RuleViolation[] {
  return rules.flatMap((rule) => rule.evaluate(ctx));
}
