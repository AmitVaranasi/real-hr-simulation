import { computeBudgetBreakdown } from "@/lib/engine/budget";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "@/lib/engine/config";
import { DISCRETIONARY_BUDGET } from "@/lib/engine/defaults";
import { runSimulation } from "@/lib/engine/engine";
import { rowToDecision } from "@/lib/db/decisions";
import type {
  EconomyCondition,
  Industry,
  PriorState,
  Strategy,
  Team,
} from "@/lib/engine/types";

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
  economy: EconomyCondition
) {
  const industry = (team.industry ?? "Manufacturing") as Industry;
  const strategy = (team.strategy ?? "Focus") as Strategy;
  const decision = rowToDecision(decisionRow);
  const prior = teamToPriorState(team);
  const industryConfig = getIndustryConfig(industry);
  const strategyConfig = getStrategyConfig(strategy);
  const carryover = Number(team.budget_carryover ?? 0);

  const outcome = runSimulation(
    decision,
    prior,
    industryConfig,
    strategyConfig,
    economy,
    carryover
  );

  const budget = computeBudgetBreakdown(
    decision,
    prior.headcount,
    industryConfig.base_market_salary,
    carryover
  );
  const newCarryover = Math.max(
    0,
    (budget.available_budget - budget.total_spend) * 0.2
  );

  return { outcome, newCarryover, industry, strategy };
}

export function outcomeToDbRow(
  teamId: string,
  roundId: string,
  outcome: ReturnType<typeof runSimulation>
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
  };
}

export function teamStateUpdateFromOutcome(
  outcome: ReturnType<typeof runSimulation>,
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
