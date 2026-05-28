import type { Decision, Warning } from "./types";
import { computeBudgetBreakdown } from "./budget";

export function validateDecision(d: Decision): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (d.recruitment_budget_per_hire < 3000 || d.recruitment_budget_per_hire > 25000) {
    errors.push("Recruitment budget per hire must be between $3,000 and $25,000");
  }
  if (d.positions_to_fill < 0 || d.positions_to_fill > 50) {
    errors.push("Positions to fill must be between 0 and 50");
  }
  if (d.salary_vs_market_pct < 80 || d.salary_vs_market_pct > 120) {
    errors.push("Salary vs market must be between 80% and 120%");
  }
  if (d.pct_employees_trained < 20 || d.pct_employees_trained > 100) {
    errors.push("% employees trained must be between 20% and 100%");
  }

  return { valid: errors.length === 0, errors };
}

export function generateWarnings(
  d: Decision,
  headcount: number,
  marketSalary: number
): Warning[] {
  const warnings: Warning[] = [];
  const budget = computeBudgetBreakdown(d, headcount, marketSalary);

  if (d.salary_vs_market_pct < 90) {
    warnings.push({
      severity: "warning",
      module: "Compensation",
      message:
        "Salary below 90% of market may increase turnover, especially in High-Tech.",
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
  if (budget.compensation_spend < 100000) {
    warnings.push({
      severity: "warning",
      module: "Compensation",
      message:
        "Compensation spend below $100K minimum may trigger satisfaction and turnover penalties.",
    });
  }

  return warnings;
}
