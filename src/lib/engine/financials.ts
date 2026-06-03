import { ECONOMY_MULTIPLIERS } from "./config";
import { computeRecruitmentCost, computeTrainingSpend } from "./budget";
import { CONFLICT_CONFIG, HR_TECH_ANNUAL_COST } from "./programs";
import { getRoleById, roleHeadcount, totalHires } from "./roles";
import type {
  BudgetBreakdown,
  Decision,
  EconomyCondition,
  FinancialMetrics,
  HRMetrics,
  IndustryConfig,
  PriorState,
} from "./types";
import { clamp } from "../utils";

export function computeTotalCompensation(
  d: Decision,
  headcount: number,
  marketSalary: number
): number {
  let totalBasePay = 0;
  for (const rc of d.role_compensation) {
    const role = getRoleById(rc.role_id);
    if (!role) continue;
    const hc = roleHeadcount(headcount, rc.role_id);
    const roleSalary =
      marketSalary * role.defaultMarketSalaryMult * (1 + rc.salary_band / 100);
    totalBasePay += hc * roleSalary;
  }
  const benefitsTotal = totalBasePay * (d.benefits_pct / 100);
  const bonusPay = totalBasePay * (d.bonus_tier / 100);
  return totalBasePay + benefitsTotal + bonusPay;
}

export function computeRevenue(
  prior: PriorState,
  productivity: number,
  retention: number,
  economy: EconomyCondition
): number {
  const retentionFactor = clamp(retention / 100, 0.5, 1);
  const econ = ECONOMY_MULTIPLIERS[economy];
  return prior.revenue * (0.5 + productivity) * retentionFactor * econ.revenue;
}

export function computeFinancials(
  d: Decision,
  metrics: HRMetrics,
  prior: PriorState,
  industryConfig: IndustryConfig,
  economy: EconomyCondition,
  budget: BudgetBreakdown
): FinancialMetrics {
  const hires = totalHires(d.positions_to_fill);
  const separations = Math.floor(
    prior.headcount * (metrics.turnover_rate / 100)
  );
  const headcount = clamp(prior.headcount + hires - separations, 50, 1000);
  const marketSalary = industryConfig.base_market_salary;

  const total_compensation = computeTotalCompensation(
    d,
    headcount,
    marketSalary
  );
  const retention = 100 - metrics.turnover_rate;
  let revenue = computeRevenue(
    prior,
    metrics.productivity,
    retention,
    economy
  );

  if (
    industryConfig.industry === "Service" &&
    metrics.employee_satisfaction < 60
  ) {
    revenue *= 0.95;
  }

  revenue = clamp(revenue, prior.revenue * 0.7, prior.revenue * 1.5);

  const trainingCost = computeTrainingSpend(d, headcount);
  const recruitmentCost = computeRecruitmentCost(d, industryConfig);
  const turnover_cost = metrics.turnover_cost;
  const otherHRCosts =
    d.engagement_investment +
    CONFLICT_CONFIG[d.conflict_approach].cost +
    HR_TECH_ANNUAL_COST[d.hr_tech_level];

  const non_hr_expenses =
    revenue * (1 - industryConfig.base_profit_margin / 100);
  const econ = ECONOMY_MULTIPLIERS[economy];
  const profit =
    revenue -
    total_compensation -
    trainingCost -
    recruitmentCost -
    turnover_cost -
    otherHRCosts -
    non_hr_expenses * econ.expense;

  const profit_margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const depreciationEstimate = revenue * 0.02;
  const operatingCashflow = profit + depreciationEstimate;
  const investingCashflow = -HR_TECH_ANNUAL_COST[d.hr_tech_level];
  const cashflow = operatingCashflow + investingCashflow;

  const revenueGrowth = (revenue - prior.revenue) / prior.revenue;
  const profitMarginDelta = profit_margin - prior.profit_margin;
  let stock_price =
    prior.stock_price *
    (1 + revenueGrowth * 0.4) *
    (1 + (profitMarginDelta / 100) * 0.3) *
    (1 + (metrics.employee_satisfaction - 65) / 1000) *
    (1 + (metrics.dei_score - 50) / 2000);
  stock_price = clamp(stock_price, 1, 500);

  let market_share =
    prior.market_share *
    (1 + revenueGrowth * 0.3) *
    (1 + (metrics.employee_satisfaction - 65) / 500) *
    (1 + metrics.dei_score / 2000);
  market_share = clamp(market_share, 1, 40);

  return {
    headcount,
    revenue,
    profit,
    cashflow,
    stock_price,
    market_share,
    profit_margin,
    total_compensation,
    total_budget_spent: budget.total_spend,
    turnover_cost,
  };
}

export function applyBudgetAdherenceToMetrics(
  metrics: HRMetrics,
  budget: BudgetBreakdown,
  financials: FinancialMetrics
): HRMetrics {
  return {
    ...metrics,
    budget_adherence: budget.adherence_pct,
    compensation_ratio:
      financials.revenue > 0
        ? (financials.total_compensation / financials.revenue) * 100
        : 0,
  };
}
