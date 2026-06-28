import type { BudgetBreakdown } from "./types";
import type { BudgetModuleKey } from "./industry-norms";

export function budgetModuleShares(
  budget: BudgetBreakdown
): Record<BudgetModuleKey, number> {
  const total = budget.total_spend > 0 ? budget.total_spend : 1;
  return {
    recruitment: (budget.recruitment_spend / total) * 100,
    performance: (budget.performance_spend / total) * 100,
    training: (budget.training_spend / total) * 100,
    relations: (budget.relations_spend / total) * 100,
    compensation: (budget.compensation_spend / total) * 100,
    org_design: (budget.org_design_spend / total) * 100,
  };
}

export function budgetUtilizationPct(budget: BudgetBreakdown): number {
  if (budget.available_budget <= 0) return 0;
  return (budget.total_spend / budget.available_budget) * 100;
}
