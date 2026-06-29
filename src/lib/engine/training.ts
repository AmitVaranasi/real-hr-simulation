import { PROGRAM_COSTS } from "./programs";
import type { Decision } from "./types";

/** V3: per-employee training budget derived from coverage and programs (not a student slider). */
export function deriveTrainingBudgetPerEe(d: Decision): number {
  const programFactor = d.developmental_programs.reduce(
    (sum, p) => sum + (PROGRAM_COSTS[p] ?? 0) / 200,
    0
  );
  return Math.round(100 + d.pct_employees_trained * 8 + programFactor);
}

export function withDerivedTrainingBudget(d: Decision): Decision {
  return {
    ...d,
    training_budget_per_ee: deriveTrainingBudgetPerEe(d),
  };
}
