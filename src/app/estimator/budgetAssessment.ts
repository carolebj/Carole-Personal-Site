import type { XofRange } from "./pricingTypes.ts";

export type BudgetAssessment = {
  status: "compatible" | "partial" | "insufficient" | "not-provided";
  budgetRangeXof: { lower: number; upper: number | null } | null;
};

const BUDGET_RANGES: Record<string, { lower: number; upper: number | null }> = {
  "under-250k": { lower: 0, upper: 250_000 },
  "250k-500k": { lower: 250_000, upper: 500_000 },
  "500k-1m": { lower: 500_000, upper: 1_000_000 },
  "1m-3m": { lower: 1_000_000, upper: 3_000_000 },
  "3m-plus": { lower: 3_000_000, upper: null },
};

/**
 * The declared budget never changes the estimate. It only reports whether the
 * independently calculated scope can fit the range the visitor had in mind.
 */
export function assessBudgetFit(estimate: XofRange, investmentRange?: string): BudgetAssessment {
  const budget = investmentRange ? BUDGET_RANGES[investmentRange] : undefined;
  if (!budget) return { status: "not-provided", budgetRangeXof: null };

  if (budget.upper !== null && budget.upper < estimate.lower) {
    return { status: "insufficient", budgetRangeXof: budget };
  }
  if (budget.lower <= estimate.lower && (budget.upper === null || budget.upper >= estimate.upper)) {
    return { status: "compatible", budgetRangeXof: budget };
  }
  if (budget.lower > estimate.upper) {
    return { status: "compatible", budgetRangeXof: budget };
  }
  return { status: "partial", budgetRangeXof: budget };
}
