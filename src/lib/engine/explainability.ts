import type {
  BSCScores,
  BudgetBreakdown,
  Decision,
  HRMetrics,
  SimulationTrace,
} from "./types";
import { budgetModuleShares } from "./budget-shares";
import { weightedAvgSalaryBand } from "./roles";

export interface LearningInsights {
  went_well: string[];
  hurt_performance: string[];
  next_round: string[];
  causal_factors: string[];
}

export function generateCausalFactors(
  d: Decision,
  metrics: HRMetrics,
  trace: SimulationTrace
): string[] {
  const factors: string[] = [];
  const avgBand = weightedAvgSalaryBand(d.role_compensation);
  const fc = trace.financial_cascade;

  if (avgBand < 0) {
    factors.push(
      `Turnover pressure increased because compensation bands averaged ${avgBand}% vs market.`
    );
  }
  if (d.pct_employees_trained < 30) {
    factors.push(
      "Low training coverage reduced productivity and training ROI contributions."
    );
  }
  if (metrics.engagement_level < 60) {
    factors.push(
      "Engagement fell due to limited voice mechanisms, flexibility, or relations spend."
    );
  }
  if (fc.turnover_cost > fc.other_hr_costs * 0.5) {
    factors.push(
      `Turnover cost (${Math.round(fc.turnover_cost).toLocaleString()}) materially reduced profit.`
    );
  }
  if (fc.total_compensation / Math.max(fc.revenue, 1) > 0.35) {
    factors.push("High labor cost share compressed profit margin.");
  }
  if (d.developmental_programs.length >= 2 && metrics.training_roi > 10) {
    factors.push(
      "Multiple developmental programs strengthened the learning & growth perspective."
    );
  }
  if (metrics.budget_adherence > 95) {
    factors.push("Strong budget discipline preserved financial flexibility.");
  }

  return factors.slice(0, 6);
}

export function generateLearningInsights(
  metrics: HRMetrics,
  bsc: BSCScores,
  trace: SimulationTrace,
  decision: Decision,
  priorMetrics?: HRMetrics | null
): LearningInsights {
  const went_well: string[] = [];
  const hurt_performance: string[] = [];
  const next_round: string[] = [];

  const topPerspectives = [
    { name: "Financial", score: bsc.score_financial },
    { name: "Employee", score: bsc.score_employee },
    { name: "Process", score: bsc.score_process },
    { name: "Learning", score: bsc.score_learning },
  ].sort((a, b) => b.score - a.score);

  went_well.push(
    `Strongest BSC perspective: ${topPerspectives[0]!.name} (${topPerspectives[0]!.score.toFixed(1)} points).`
  );

  if (metrics.employee_satisfaction >= 70) {
    went_well.push("Employee satisfaction is competitive for your industry.");
  }
  if (metrics.turnover_rate <= 15) {
    went_well.push("Retention outperformed typical turnover benchmarks.");
  }
  if (metrics.training_roi >= 12) {
    went_well.push("Training investments generated positive ROI.");
  }
  if (trace.financial_cascade.profit > 0) {
    went_well.push("The firm remained profitable this round.");
  }

  const weakest = topPerspectives[topPerspectives.length - 1]!;
  hurt_performance.push(
    `Weakest perspective: ${weakest.name} (${weakest.score.toFixed(1)} points) — review related HR levers.`
  );

  if (metrics.turnover_rate > 18) {
    hurt_performance.push(
      "Elevated turnover increased replacement costs and hurt productivity."
    );
  }
  if (metrics.budget_adherence < 85) {
    hurt_performance.push(
      "Budget misalignment reduced the financial perspective score."
    );
  }
  if (trace.financial_cascade.profit < 0) {
    hurt_performance.push("Negative profit dragged down financial outcomes.");
  }

  if (priorMetrics && metrics.turnover_rate > priorMetrics.turnover_rate + 2) {
    hurt_performance.push(
      `Turnover rose vs last round (${priorMetrics.turnover_rate.toFixed(1)}% → ${metrics.turnover_rate.toFixed(1)}%).`
    );
  }

  if (weakest.name === "Learning") {
    next_round.push(
      "Consider additional developmental programs or higher training coverage."
    );
  }
  if (metrics.cost_per_hire > 8000) {
    next_round.push(
      "Review screening rigor and role mix to reduce cost per hire."
    );
  }
  if (weightedAvgSalaryBand(decision.role_compensation) < 0) {
    next_round.push(
      "Evaluate compensation bands — below-market pay may not be sustainable."
    );
  }
  next_round.push(
    "Use the review page forecast before submitting next round's decisions."
  );

  const causal_factors = generateCausalFactors(
    decision,
    metrics,
    trace
  );

  return {
    went_well: went_well.slice(0, 4),
    hurt_performance: hurt_performance.slice(0, 4),
    next_round: next_round.slice(0, 4),
    causal_factors,
  };
}

export function generateBudgetRecommendations(
  budget: BudgetBreakdown,
  industryNorms: ReturnType<
    typeof import("./simulation-config").getIndustryNormsResolved
  >,
  industry: import("./types").Industry,
  benefitsPct: number
): string[] {
  const shares = budgetModuleShares(budget);
  const norms = industryNorms[industry];
  const messages: string[] = [];

  for (const key of Object.keys(shares) as Array<keyof typeof shares>) {
    const norm = norms[key];
    if (!norm) continue;
    const pct = shares[key];
    if (norm.max != null && pct > norm.max + 2) {
      messages.push(
        `Your ${norm.label ?? key} spending (${pct.toFixed(1)}% of HR budget) is above the suggested industry range.`
      );
    }
    if (norm.min != null && pct < norm.min - 2) {
      messages.push(
        `Your ${norm.label ?? key} spending (${pct.toFixed(1)}% of HR budget) is below industry minimums and may create hiring or retention challenges.`
      );
    }
  }

  const benefitsNorm = norms.benefits_pct_of_comp;
  if (benefitsNorm) {
    if (benefitsPct < benefitsNorm.min) {
      messages.push(
        "Benefits as % of salary are below typical industry norms — satisfaction may suffer."
      );
    }
    if (benefitsPct > benefitsNorm.max) {
      messages.push(
        "Benefits spending is above industry norms — watch total compensation impact on profit."
      );
    }
  }

  if (budget.remaining < 0) {
    messages.push(
      "You are over the discretionary HR budget — trim spend or expect budget adherence penalties."
    );
  }

  return messages;
}
