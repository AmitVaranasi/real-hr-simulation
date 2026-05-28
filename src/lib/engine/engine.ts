import { computeBudgetBreakdown } from "./budget";
import { computeFinancials } from "./financials";
import { generateFeedback } from "./feedback";
import { computeAllMetrics } from "./metrics";
import { computeBSCScores } from "./scoring";
import type {
  Decision,
  EconomyCondition,
  IndustryConfig,
  Outcome,
  PriorState,
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
  const budget = computeBudgetBreakdown(
    decision,
    prior.headcount,
    industryConfig.base_market_salary,
    budgetCarryover
  );

  let hrMetrics = computeAllMetrics(decision, prior, industryConfig);
  hrMetrics = { ...hrMetrics, budget_adherence: budget.adherence_pct };

  const financials = computeFinancials(
    decision,
    hrMetrics,
    prior,
    industryConfig,
    economy,
    budget,
    budgetCarryover
  );

  hrMetrics = {
    ...hrMetrics,
    compensation_ratio:
      financials.revenue > 0
        ? (financials.total_compensation / financials.revenue) * 100
        : 0,
  };

  const bscScores = computeBSCScores(
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
    bscScores,
    industryConfig,
    strategyConfig
  );

  return {
    hr_metrics: hrMetrics,
    financial_metrics: financials,
    bsc_scores: bscScores,
    feedback,
  };
}
