import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "@/lib/engine/config";
import { DISCRETIONARY_BUDGET } from "@/lib/engine/defaults";
import { runSimulationWithTrace } from "@/lib/engine/engine";
import { rowToDecision } from "@/lib/db/decisions";
import type {
  EconomyCondition,
  HRMetrics,
  Industry,
  Outcome,
  PriorState,
  Strategy,
  Team,
} from "@/lib/engine/types";

export function priorMetricsFromOutcome(
  row: Record<string, unknown> | null | undefined
): HRMetrics | null {
  if (!row) return null;
  return {
    cost_per_hire: Number(row.cost_per_hire),
    time_to_fill: Number(row.time_to_fill),
    turnover_rate: Number(row.turnover_rate),
    employee_satisfaction: Number(row.employee_satisfaction),
    training_roi: Number(row.training_roi),
    engagement_level: Number(row.engagement_level),
    dei_score: Number(row.dei_score),
    absenteeism_rate: Number(row.absenteeism_rate),
    review_coverage: Number(row.review_coverage),
    training_effectiveness: Number(row.training_effectiveness),
    succession_pipeline: Number(row.succession_pipeline),
    hr_tech_score: Number(row.hr_tech_score),
    compensation_ratio: Number(row.compensation_ratio),
    budget_adherence: Number(row.budget_adherence),
    productivity: Number(row.productivity ?? 0),
    hiring_quality: Number(row.hiring_quality ?? 0),
    turnover_cost: Number(row.turnover_cost ?? 0),
  };
}

export function teamToPriorState(team: Team): PriorState {
  const industry = team.industry ?? "Manufacturing";
  const base = priorStateFromIndustry(industry);
  return {
    headcount: team.headcount ?? base.headcount,
    revenue: team.revenue ?? base.revenue,
    stock_price: team.stock_price ?? base.stock_price,
    market_share: team.market_share ?? base.market_share,
    profit_margin: team.profit_margin ?? base.profit_margin,
    satisfaction: team.satisfaction ?? base.satisfaction,
    engagement: team.engagement ?? base.engagement,
    turnover_rate: team.turnover_rate ?? base.turnover_rate,
  };
}

export function computeTeamOutcome(
  decisionRow: Record<string, unknown>,
  team: Team,
  economy: EconomyCondition,
  priorMetrics: HRMetrics | null = null
) {
  const industry = (team.industry ?? "Manufacturing") as Industry;
  const strategy = (team.strategy ?? "Focus") as Strategy;
  const decision = rowToDecision(decisionRow);
  const prior = teamToPriorState(team);
  const industryConfig = getIndustryConfig(industry);
  const strategyConfig = getStrategyConfig(strategy);
  const carryover = Number(team.budget_carryover ?? 0);

  const { outcome, trace } = runSimulationWithTrace(
    decision,
    prior,
    industryConfig,
    strategyConfig,
    economy,
    carryover,
    { priorMetrics }
  );

  const budget = trace.budget_breakdown;
  const newCarryover = Math.max(
    0,
    (budget.available_budget - budget.total_spend) * 0.2
  );

  return { outcome, trace, newCarryover, industry, strategy };
}

export function outcomeToDbRow(
  teamId: string,
  roundId: string,
  outcome: Outcome
) {
  const { hr_metrics: m, financial_metrics: f, bsc_scores: b, feedback } =
    outcome;
  return {
    team_id: teamId,
    round_id: roundId,
    cost_per_hire: m.cost_per_hire,
    time_to_fill: m.time_to_fill,
    turnover_rate: m.turnover_rate,
    employee_satisfaction: m.employee_satisfaction,
    training_roi: m.training_roi,
    engagement_level: m.engagement_level,
    dei_score: m.dei_score,
    absenteeism_rate: m.absenteeism_rate,
    review_coverage: m.review_coverage,
    training_effectiveness: m.training_effectiveness,
    succession_pipeline: m.succession_pipeline,
    hr_tech_score: m.hr_tech_score,
    compensation_ratio: m.compensation_ratio,
    budget_adherence: m.budget_adherence,
    headcount: f.headcount,
    revenue: f.revenue,
    profit: f.profit,
    cashflow: f.cashflow,
    stock_price: f.stock_price,
    market_share: f.market_share,
    profit_margin: f.profit_margin,
    total_compensation: f.total_compensation,
    total_budget_spent: f.total_budget_spent,
    score_financial: b.score_financial,
    score_employee: b.score_employee,
    score_process: b.score_process,
    score_learning: b.score_learning,
    total_score: b.total_score,
    strategy_bonus: b.strategy_bonus,
    industry_penalty: b.industry_penalty,
    feedback_json: feedback,
    productivity: m.productivity,
    hiring_quality: m.hiring_quality,
    turnover_cost: m.turnover_cost,
  };
}

export function traceToDbJson(trace: import("@/lib/engine/types").SimulationTrace) {
  return trace;
}

export function teamStateUpdateFromOutcome(
  outcome: Outcome,
  budgetCarryover: number
) {
  const f = outcome.financial_metrics;
  const m = outcome.hr_metrics;
  return {
    headcount: f.headcount,
    revenue: f.revenue,
    stock_price: f.stock_price,
    market_share: f.market_share,
    profit_margin: f.profit_margin,
    satisfaction: m.employee_satisfaction,
    engagement: m.engagement_level,
    turnover_rate: m.turnover_rate,
    budget_carryover: budgetCarryover,
  };
}

export { DISCRETIONARY_BUDGET };
