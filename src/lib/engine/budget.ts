import { getDiscretionaryBudget } from "./simulation-config";
import {
  CONFLICT_CONFIG,
  HR_TECH_ANNUAL_COST,
  PROGRAM_COSTS,
} from "./programs";
import {
  getRoleById,
  roleHeadcount,
  totalHires,
} from "./roles";
import type { BudgetBreakdown, Decision, IndustryConfig } from "./types";
import { clamp } from "../utils";

const SCREENING_COST: Record<1 | 2 | 3, number> = { 1: 0, 2: 2000, 3: 5000 };
const REVIEW_FREQ_COST: Record<1 | 2 | 4, number> = { 1: 0, 2: 3000, 4: 6000 };

export function computeRecruitmentCost(
  d: Decision,
  industryConfig: IndustryConfig
): number {
  let total = 0;
  for (const pos of d.positions_to_fill) {
    const role = getRoleById(pos.role_id);
    if (!role || pos.count <= 0) continue;
    const baseCost =
      industryConfig.base_market_salary * role.recruitCostMult * 0.1;
    const perHire =
      baseCost +
      d.onboarding_investment +
      SCREENING_COST[d.screening_rigor];
    const diversityAdder = perHire * (d.diversity_goal_pct / 100) * 0.15;
    total += (perHire + diversityAdder) * pos.count;
  }
  return total;
}

export function computeKPICost(
  d: Decision,
  headcount: number,
  marketSalary: number
): number {
  let totalCost = 0;
  for (const rp of d.role_performance) {
    const role = getRoleById(rp.role_id);
    if (!role) continue;
    const roleHc = roleHeadcount(headcount, rp.role_id);
    const avgCriteria =
      (rp.productivity + rp.teamwork + rp.leadership + rp.communication) / 4;
    const delta = Math.max(0, avgCriteria - 5);
    const costPerPoint = marketSalary * role.defaultMarketSalaryMult * 0.005;
    totalCost += delta * costPerPoint * roleHc;
  }
  return totalCost;
}

export function computeTrainingSpend(d: Decision, headcount: number): number {
  const participants = headcount * (d.pct_employees_trained / 100);
  const programCost = d.developmental_programs.reduce(
    (sum, p) => sum + PROGRAM_COSTS[p],
    0
  );
  return (
    programCost * participants +
    d.training_budget_per_ee * participants +
    d.succession_investment
  );
}

export function computeCompensationBudgetSpend(
  d: Decision,
  headcount: number,
  marketSalary: number
): number {
  let incremental = 0;
  for (const rc of d.role_compensation) {
    const role = getRoleById(rc.role_id);
    if (!role) continue;
    const hc = roleHeadcount(headcount, rc.role_id);
    const roleSalary = marketSalary * role.defaultMarketSalaryMult;
    incremental += hc * roleSalary * (Math.abs(rc.salary_band) / 100) * 0.5;
  }
  const benefitsDelta =
    headcount * marketSalary * ((d.benefits_pct - 10) / 100) * 0.01;
  const bonusDelta =
    headcount * marketSalary * ((d.bonus_tier - 5) / 100);
  const equityCost = d.equity_level * 10_000;
  return Math.max(0, incremental + benefitsDelta + bonusDelta + equityCost);
}

export function computeBudgetBreakdown(
  d: Decision,
  headcount: number,
  marketSalary: number,
  industryConfig: IndustryConfig,
  budgetCarryover = 0
): BudgetBreakdown {
  const recruitment_spend = computeRecruitmentCost(d, industryConfig);
  const performance_spend =
    computeKPICost(d, headcount, marketSalary) +
    REVIEW_FREQ_COST[d.review_frequency] +
    (d.feedback_360 ? 8000 : 0);
  const training_spend = computeTrainingSpend(d, headcount);
  const relations_spend =
    d.engagement_investment +
    CONFLICT_CONFIG[d.conflict_approach].cost +
    d.flexibility_level * 5000 +
    d.voice_mechanisms * 4000;
  const compensation_spend = computeCompensationBudgetSpend(
    d,
    headcount,
    marketSalary
  );
  const org_design_spend = HR_TECH_ANNUAL_COST[d.hr_tech_level];
  const dei_spend = 0;

  const total_spend =
    recruitment_spend +
    performance_spend +
    training_spend +
    relations_spend +
    compensation_spend +
    org_design_spend +
    dei_spend;

  const available_budget = getDiscretionaryBudget() + budgetCarryover;
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

export { totalHires };
