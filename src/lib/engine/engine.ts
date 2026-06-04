import { computeBudgetBreakdown } from "./budget";
import { computeFinancials, applyBudgetAdherenceToMetrics } from "./financials";
import { generateFeedback } from "./feedback";
import { computeAllMetrics } from "./metrics";
import { normalizeMetric } from "./normalize";
import { computeBSCScores } from "./scoring";
import type {
  Decision,
  EconomyCondition,
  HRMetrics,
  IndustryConfig,
  Outcome,
  PriorState,
  SimulationTrace,
  StrategyConfig,
} from "./types";

export function runSimulation(
  decision: Decision,
  prior: PriorState,
  industryConfig: IndustryConfig,
  strategyConfig: StrategyConfig,
  economy: EconomyCondition,
  budgetCarryover = 0
): Outcome {
  return runSimulationWithTrace(
    decision,
    prior,
    industryConfig,
    strategyConfig,
    economy,
    budgetCarryover
  ).outcome;
}

export function runSimulationWithTrace(
  decision: Decision,
  prior: PriorState,
  industryConfig: IndustryConfig,
  strategyConfig: StrategyConfig,
  economy: EconomyCondition,
  budgetCarryover = 0,
  options?: { priorMetrics?: HRMetrics | null }
): { outcome: Outcome; trace: SimulationTrace } {
  const budget = computeBudgetBreakdown(
    decision,
    prior.headcount,
    industryConfig.base_market_salary,
    industryConfig,
    budgetCarryover
  );

  const raw_metrics = computeAllMetrics(decision, prior, industryConfig);
  let hrMetrics: HRMetrics = {
    ...raw_metrics,
    budget_adherence: budget.adherence_pct,
  };

  const financials = computeFinancials(
    decision,
    hrMetrics,
    prior,
    industryConfig,
    economy,
    budget
  );

  hrMetrics = applyBudgetAdherenceToMetrics(hrMetrics, budget, financials);

  const bsc_scores = computeBSCScores(
    hrMetrics,
    financials,
    budget,
    industryConfig,
    strategyConfig,
    decision
  );

  const feedback = generateFeedback(
    hrMetrics,
    financials,
    bsc_scores,
    industryConfig,
    strategyConfig,
    options?.priorMetrics ?? null
  );

  const normalized_metrics: Record<string, number> = {};
  for (const key of Object.keys(hrMetrics) as (keyof HRMetrics)[]) {
    const val = hrMetrics[key];
    if (typeof val === "number") {
      normalized_metrics[key] = normalizeMetric(val, key);
    }
  }

  const retention = 100 - hrMetrics.turnover_rate;
  const trace: SimulationTrace = {
    budget_breakdown: budget,
    raw_metrics,
    normalized_metrics,
    industry_adjusted_metrics: hrMetrics,
    productivity_components: {
      training: hrMetrics.training_effectiveness / 30,
      engagement: hrMetrics.engagement_level / 100,
      retention: retention / 100,
      leadership:
        decision.role_performance.reduce((s, r) => s + r.leadership, 0) /
        Math.max(decision.role_performance.length, 1) /
        10,
      technology: decision.hr_tech_level / 2,
      total: hrMetrics.productivity,
    },
    financial_cascade: {
      revenue: financials.revenue,
      total_compensation: financials.total_compensation,
      turnover_cost: financials.turnover_cost,
      other_hr_costs: budget.relations_spend + budget.org_design_spend,
      non_hr_expenses:
        financials.revenue * (1 - industryConfig.base_profit_margin / 100),
      profit: financials.profit,
    },
    bsc_component_scores: {
      financial_components: [bsc_scores.score_financial],
      employee_components: [bsc_scores.score_employee],
      process_components: [bsc_scores.score_process],
      learning_components: [bsc_scores.score_learning],
    },
    bsc_scores,
    feedback,
  };

  return {
    outcome: {
      hr_metrics: hrMetrics,
      financial_metrics: financials,
      bsc_scores,
      feedback,
    },
    trace,
  };
}
