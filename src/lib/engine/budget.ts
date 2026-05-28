import { BASELINE_BENEFITS, DISCRETIONARY_BUDGET } from "./defaults";
import type { BudgetBreakdown, Decision } from "./types";
import { clamp } from "../utils";

export function computeRecruitmentSpend(d: Decision): number {
  return (
    d.recruitment_budget_per_hire * d.positions_to_fill +
    d.onboarding_investment * d.positions_to_fill +
    (d.screening_rigor - 1) * 2000 * d.positions_to_fill +
    d.diversity_goal_pct * 500 * d.positions_to_fill
  );
}

export function computePerformanceSpend(d: Decision): number {
  return (
    d.kpi_investment +
    d.pip_investment +
    (d.review_frequency - 1) * 3000 +
    (d.feedback_360 ? 8000 : 0)
  );
}

export function computeTrainingSpend(d: Decision, headcount: number): number {
  return (
    d.training_budget_per_ee *
      headcount *
      (d.pct_employees_trained / 100) +
    d.succession_investment
  );
}

export function computeRelationsSpend(d: Decision): number {
  return (
    d.engagement_investment +
    d.conflict_budget +
    d.flexibility_level * 5000 +
    d.voice_mechanisms * 4000
  );
}

export function computeCompensationBudgetSpend(
  d: Decision,
  headcount: number,
  marketSalary: number
): number {
  return (
    (headcount *
      ((d.salary_vs_market_pct - 100) / 100) *
      marketSalary *
      0.01) +
    headcount * (d.benefits_per_ee - BASELINE_BENEFITS) +
    headcount * marketSalary * (d.bonus_pool_pct / 100) +
    d.equity_level * 10000
  );
}

export function computeOrgDesignSpend(d: Decision): number {
  return (
    d.restructuring_investment +
    d.change_comm_effort * 3000 +
    d.hr_tech_level * 15000
  );
}

export function computeDEISpend(d: Decision, headcount: number): number {
  return (
    d.dei_training_per_ee *
      headcount *
      (d.pct_employees_trained / 100) +
    d.inclusive_hiring_investment +
    d.erg_budget +
    d.public_commitment_level * 3000
  );
}

export function computeBudgetBreakdown(
  d: Decision,
  headcount: number,
  marketSalary: number,
  budgetCarryover = 0
): BudgetBreakdown {
  const recruitment_spend = computeRecruitmentSpend(d);
  const performance_spend = computePerformanceSpend(d);
  const training_spend = computeTrainingSpend(d, headcount);
  const relations_spend = computeRelationsSpend(d);
  const compensation_spend = computeCompensationBudgetSpend(
    d,
    headcount,
    marketSalary
  );
  const org_design_spend = computeOrgDesignSpend(d);
  const dei_spend = computeDEISpend(d, headcount);

  const total_spend =
    recruitment_spend +
    performance_spend +
    training_spend +
    relations_spend +
    compensation_spend +
    org_design_spend +
    dei_spend;

  const available_budget = DISCRETIONARY_BUDGET + budgetCarryover;
  const remaining = available_budget - total_spend;
  const adherence_pct = clamp(
    100 -
      (Math.abs(total_spend - available_budget) / available_budget) * 100,
    0,
    100
  );

  return {
    recruitment_spend,
    performance_spend,
    training_spend,
    relations_spend,
    compensation_spend,
    org_design_spend,
    dei_spend,
    total_spend,
    available_budget,
    remaining,
    adherence_pct,
  };
}
