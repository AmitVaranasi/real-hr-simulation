import type { Decision, Warning } from "./types";
import { computeBudgetBreakdown } from "./budget";
import { totalHires, weightedAvgSalaryBand } from "./roles";
import type { IndustryConfig } from "./types";

export function validateDecision(d: Decision): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const hires = totalHires(d.positions_to_fill);

  if (hires < 0 || hires > 50) {
    errors.push("Total positions to fill must be between 0 and 50");
  }
  if (d.diversity_goal_pct < 0 || d.diversity_goal_pct > 50) {
    errors.push("Diversity goal must be between 0% and 50%");
  }
  if (d.pct_employees_trained < 20 || d.pct_employees_trained > 100) {
    errors.push("% employees trained must be between 20% and 100%");
  }
  if (d.benefits_pct < 6 || d.benefits_pct > 20) {
    errors.push("Benefits percentage must be between 6% and 20%");
  }
  if (![5, 10, 15].includes(d.bonus_tier)) {
    errors.push("Bonus tier must be 5%, 10%, or 15%");
  }

  return { valid: errors.length === 0, errors };
}

export function generateWarnings(
  d: Decision,
  headcount: number,
  marketSalary: number,
  industryConfig: IndustryConfig
): Warning[] {
  const warnings: Warning[] = [];
  const budget = computeBudgetBreakdown(
    d,
    headcount,
    marketSalary,
    industryConfig
  );
  const avgBand = weightedAvgSalaryBand(d.role_compensation);

  if (avgBand < -10) {
    warnings.push({
      severity: "warning",
      module: "Compensation",
      message:
        "Below-market salary bands may increase turnover, especially in High-Tech.",
    });
  }
  if (d.training_budget_per_ee < 200) {
    warnings.push({
      severity: "warning",
      module: "Training",
      message: "Very low training spend may reduce productivity and ROI.",
    });
  }
  if (budget.remaining < 0) {
    warnings.push({
      severity: "critical",
      module: "Budget",
      message: `Overspent discretionary budget by ${Math.abs(budget.remaining).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}.`,
    });
  }

  return warnings;
}
