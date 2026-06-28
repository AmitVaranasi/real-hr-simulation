import type {
  BSCScores,
  BudgetBreakdown,
  Decision,
  FinancialMetrics,
  HRMetrics,
  IndustryConfig,
  StrategyConfig,
} from "./types";
import { benchmarksForPerspective } from "./benchmarks";
import { getBenchmarkOverrides } from "./simulation-config";
import { clamp } from "@/lib/utils";

function metricToScoreHigher(
  value: number,
  excellent: number,
  moderate: number,
  poor: number
): number {
  if (value >= excellent) return 25;
  if (value >= moderate) {
    return 15 + ((value - moderate) / (excellent - moderate)) * 10;
  }
  if (value >= poor) {
    return 5 + ((value - poor) / (moderate - poor)) * 10;
  }
  return Math.max(0, poor > 0 ? (value / poor) * 5 : 0);
}

function metricToScoreLower(
  value: number,
  excellent: number,
  moderate: number,
  poor: number
): number {
  if (value <= excellent) return 25;
  if (value <= moderate) {
    return 15 + ((moderate - value) / (moderate - excellent)) * 10;
  }
  if (value <= poor) {
    return 5 + ((poor - value) / (poor - moderate)) * 10;
  }
  return Math.max(0, 5 * (1 - (value - poor) / Math.max(poor, 1)));
}

function scoreMetric(
  value: number,
  b: {
    excellent: number;
    moderate: number;
    poor: number;
    weight: number;
    direction: "higher" | "lower";
  }
): number {
  const raw =
    b.direction === "higher"
      ? metricToScoreHigher(value, b.excellent, b.moderate, b.poor)
      : metricToScoreLower(value, b.excellent, b.moderate, b.poor);
  return raw * b.weight;
}

function perspectiveScore(
  values: number[],
  benchmarks: ReturnType<typeof benchmarksForPerspective>
): number {
  return benchmarks.reduce(
    (sum, b, i) => sum + scoreMetric(values[i] ?? 0, b),
    0
  );
}

function evaluateStrategyBonus(
  metrics: HRMetrics,
  financials: FinancialMetrics,
  strategy: StrategyConfig,
  decision: Decision
): number {
  let bonus = 0;
  const retention = 100 - metrics.turnover_rate;

  for (const cond of strategy.bonus_conditions) {
    const c = cond.condition;
    let met = false;

    if (c.includes("budget_adherence > 95") && c.includes("compensation_ratio < 30")) {
      met =
        metrics.budget_adherence > 95 &&
        metrics.compensation_ratio < 30;
    } else if (c.includes("training_roi > 15") && c.includes("retention > 88")) {
      met = metrics.training_roi > 15 && retention > 88;
    } else if (c.includes("hr_tech_level == 2") && c.includes("succession_pipeline > 70")) {
      met =
        decision.hr_tech_level === 2 && metrics.succession_pipeline > 70;
    } else if (c.includes("engagement_level > 80") && c.includes("employee_satisfaction > 80")) {
      met =
        metrics.engagement_level > 80 && metrics.employee_satisfaction > 80;
    } else if (c.includes("cost_per_hire < 5000") && c.includes("training_effectiveness > 15")) {
      met =
        metrics.cost_per_hire < 5000 && metrics.training_effectiveness > 15;
    }

    if (met) bonus += cond.points;
  }

  return Math.min(bonus, 3);
}

function evaluateIndustryPenalties(
  metrics: HRMetrics,
  industry: IndustryConfig,
  decision: Decision
): number {
  let penalty = 0;

  for (const constraint of industry.constraints) {
    if (constraint.effect === "process_penalty") {
      if (
        constraint.condition.includes("review_coverage") &&
        metrics.review_coverage < 80
      ) {
        penalty += constraint.value;
      }
      if (
        constraint.condition.includes("time_to_fill") &&
        metrics.time_to_fill > 45
      ) {
        penalty += constraint.value;
      }
    }
  }

  return penalty;
}

export function computeBSCScores(
  metrics: HRMetrics,
  financials: FinancialMetrics,
  budget: BudgetBreakdown,
  industryConfig: IndustryConfig,
  strategyConfig: StrategyConfig,
  decision: Decision
): BSCScores {
  const retention = 100 - metrics.turnover_rate;
  const metricsWithFinancials: HRMetrics = {
    ...metrics,
    budget_adherence: budget.adherence_pct,
    compensation_ratio:
      financials.revenue > 0
        ? (financials.total_compensation / financials.revenue) * 100
        : metrics.compensation_ratio,
  };

  const benchmarkOverrides = getBenchmarkOverrides();

  const rawFinancial = perspectiveScore(
    [
      metricsWithFinancials.training_roi,
      metricsWithFinancials.cost_per_hire,
      metricsWithFinancials.compensation_ratio,
      metricsWithFinancials.budget_adherence,
    ],
    benchmarksForPerspective("financial", benchmarkOverrides)
  );

  const rawEmployee = perspectiveScore(
    [
      metricsWithFinancials.employee_satisfaction,
      retention,
      metricsWithFinancials.engagement_level,
      metricsWithFinancials.dei_score,
    ],
    benchmarksForPerspective("employee", benchmarkOverrides)
  );

  const rawProcess = perspectiveScore(
    [
      metricsWithFinancials.time_to_fill,
      metricsWithFinancials.turnover_rate,
      metricsWithFinancials.absenteeism_rate,
      metricsWithFinancials.review_coverage,
    ],
    benchmarksForPerspective("process", benchmarkOverrides)
  );

  const rawLearning = perspectiveScore(
    [
      metricsWithFinancials.training_effectiveness,
      metricsWithFinancials.succession_pipeline,
      metricsWithFinancials.hr_tech_score,
      metricsWithFinancials.dei_score,
    ],
    benchmarksForPerspective("learning", benchmarkOverrides)
  );

  const w = strategyConfig.bsc_weights;
  const score_financial = Math.min(
    rawFinancial * (w.financial / 25),
    w.financial
  );
  const score_employee = Math.min(
    rawEmployee * (w.employee / 25),
    w.employee
  );
  const score_process = Math.min(
    rawProcess * (w.process / 25),
    w.process
  );
  const score_learning = Math.min(
    rawLearning * (w.learning / 25),
    w.learning
  );

  const strategy_bonus = evaluateStrategyBonus(
    metricsWithFinancials,
    financials,
    strategyConfig,
    decision
  );
  const industry_penalty = evaluateIndustryPenalties(
    metricsWithFinancials,
    industryConfig,
    decision
  );

  const total_score = clamp(
    score_financial +
      score_employee +
      score_process +
      score_learning +
      strategy_bonus -
      industry_penalty,
    0,
    100
  );

  return {
    score_financial,
    score_employee,
    score_process,
    score_learning,
    total_score,
    strategy_bonus,
    industry_penalty,
  };
}
