import { ECONOMY_MULTIPLIERS } from "./config";
import {
  computeBudgetBreakdown,
  computeDEISpend,
  computeRecruitmentSpend,
  computeTrainingSpend,
} from "./budget";
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

export function computeFinancials(
  d: Decision,
  metrics: HRMetrics,
  prior: PriorState,
  industryConfig: IndustryConfig,
  economy: EconomyCondition,
  budget: BudgetBreakdown,
  budgetCarryover = 0
): FinancialMetrics {
  const hires = d.positions_to_fill;
  const separations = Math.floor(
    prior.headcount * (metrics.turnover_rate / 100)
  );
  const headcount = clamp(prior.headcount + hires - separations, 50, 1000);

  const marketSalary = industryConfig.base_market_salary;
  const avgSalary = marketSalary * (d.salary_vs_market_pct / 100);
  const totalBasePay = headcount * avgSalary;
  const bonusPay = totalBasePay * (d.bonus_pool_pct / 100);
  const benefitsTotal = headcount * d.benefits_per_ee;
  const total_compensation = totalBasePay + bonusPay + benefitsTotal;

  let trainingEffectiveness = metrics.training_effectiveness;
  if (
    industryConfig.industry === "Manufacturing" &&
    trainingEffectiveness < 5
  ) {
    trainingEffectiveness = 0;
  }

  const training_boost = (trainingEffectiveness / 100) * 0.5;
  const satisfaction_boost =
    ((metrics.employee_satisfaction - 65) / 100) * 0.3;
  const engagement_boost =
    ((metrics.engagement_level - 60) / 100) * 0.2;
  const turnover_drag = (metrics.turnover_rate / 100) * -0.4;
  const tech_boost = ({ 0: 0, 1: 0.03, 2: 0.07 } as const)[d.hr_tech_level];
  const restructuring_boost =
    d.restructuring_investment > 0
      ? Math.min(d.restructuring_investment / 50000, 0.05) *
        (d.change_comm_effort / 5)
      : 0;

  let productivity =
    1 +
    training_boost +
    satisfaction_boost +
    engagement_boost +
    turnover_drag +
    tech_boost +
    restructuring_boost;
  productivity = clamp(productivity, 0.5, 1.8);

  const econ = ECONOMY_MULTIPLIERS[economy];
  const productivityGrowth = productivity - 1;
  let revenue =
    prior.revenue * (1 + productivityGrowth * 0.3) * econ.revenue;

  if (
    industryConfig.industry === "Service" &&
    metrics.employee_satisfaction < 60
  ) {
    revenue *= 0.95;
  }

  revenue = clamp(
    revenue,
    prior.revenue * 0.7,
    prior.revenue * 1.5
  );

  const trainingCost = computeTrainingSpend(d, headcount);
  const recruitmentCost = computeRecruitmentSpend(d);
  const deiTotal = computeDEISpend(d, headcount);
  const hrTechCost = d.hr_tech_level * 15000;

  const hr_expenses =
    total_compensation +
    trainingCost +
    recruitmentCost +
    d.engagement_investment +
    d.conflict_budget +
    d.kpi_investment +
    d.pip_investment +
    d.restructuring_investment +
    deiTotal +
    hrTechCost;

  const non_hr_expenses =
    revenue * (1 - industryConfig.base_profit_margin / 100);
  const total_expenses = (hr_expenses + non_hr_expenses) * econ.expense;
  const profit = revenue - total_expenses;
  const profit_margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const depreciationEstimate = revenue * 0.02;
  const operatingCashflow = profit + depreciationEstimate;
  const investingCashflow = -(
    d.hr_tech_level * 15000 + d.restructuring_investment
  );
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

  const compensation_ratio =
    revenue > 0 ? (total_compensation / revenue) * 100 : 0;

  const budgetBreakdown = computeBudgetBreakdown(
    d,
    headcount,
    marketSalary,
    budgetCarryover
  );

  return {
    headcount,
    revenue,
    profit,
    cashflow,
    stock_price,
    market_share,
    profit_margin,
    total_compensation,
    total_budget_spent: budgetBreakdown.total_spend,
  };
}

export function applyBudgetAdherenceToMetrics(
  metrics: HRMetrics,
  budget: BudgetBreakdown
): HRMetrics {
  return {
    ...metrics,
    budget_adherence: budget.adherence_pct,
    compensation_ratio: metrics.compensation_ratio,
  };
}
