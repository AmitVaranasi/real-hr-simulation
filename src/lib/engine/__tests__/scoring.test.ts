import { describe, expect, it } from "vitest";
import { computeBSCScores } from "../scoring";
import { getIndustryConfig, getStrategyConfig } from "../config";
import { createDefaultDecision } from "../defaults";
import type { BudgetBreakdown, FinancialMetrics, HRMetrics } from "../types";

// computeBSCScores is the only exported function in scoring.ts; every rule
// below (metricToScoreHigher/Lower thresholds, weight scaling, strategy
// bonus capping, industry penalties) is exercised only through it, using
// hand-built HRMetrics/FinancialMetrics/BudgetBreakdown fixtures so each
// branch can be isolated deliberately.

const industry = getIndustryConfig("Manufacturing");
const decision = createDefaultDecision();

const excellentMetrics: HRMetrics = {
  cost_per_hire: 1000,
  time_to_fill: 10,
  turnover_rate: 5,
  employee_satisfaction: 95,
  training_roi: 30,
  engagement_level: 95,
  dei_score: 95,
  absenteeism_rate: 1,
  review_coverage: 100,
  training_effectiveness: 30,
  succession_pipeline: 90,
  hr_tech_score: 100,
  compensation_ratio: 20,
  budget_adherence: 100,
  productivity: 0.9,
  hiring_quality: 90,
  turnover_cost: 1000,
};

const fin: FinancialMetrics = {
  headcount: 300,
  revenue: 50_000_000,
  profit: 5_000_000,
  cashflow: 5_000_000,
  stock_price: 30,
  market_share: 15,
  profit_margin: 10,
  total_compensation: 15_000_000,
  total_budget_spent: 400_000,
  turnover_cost: 1000,
};

const budget: BudgetBreakdown = {
  recruitment_spend: 50_000,
  performance_spend: 20_000,
  training_spend: 30_000,
  relations_spend: 20_000,
  compensation_spend: 200_000,
  org_design_spend: 30_000,
  dei_spend: 20_000,
  total_spend: 370_000,
  available_budget: 500_000,
  remaining: 130_000,
  adherence_pct: 100,
};

describe("computeBSCScores — perspective scoring", () => {
  it("caps every perspective score exactly at the strategy's weight allocation when all inputs are excellent", () => {
    // Focus strategy splits weight evenly (25/25/25/25); with every metric
    // at or beyond its "excellent" benchmark, each perspective's raw score
    // hits the 25-point ceiling and (w/25)=1, so score == weight exactly.
    const strategy = getStrategyConfig("Focus");
    const bsc = computeBSCScores(
      excellentMetrics,
      fin,
      budget,
      industry,
      strategy,
      decision
    );
    expect(bsc.score_financial).toBe(strategy.bsc_weights.financial);
    expect(bsc.score_employee).toBe(strategy.bsc_weights.employee);
    expect(bsc.score_process).toBe(strategy.bsc_weights.process);
    expect(bsc.score_learning).toBe(strategy.bsc_weights.learning);
  });

  it("produces low, non-negative scores for uniformly poor metrics, well under the strategy weight", () => {
    const strategy = getStrategyConfig("Focus");
    const poorMetrics: HRMetrics = {
      ...excellentMetrics,
      cost_per_hire: 20_000,
      time_to_fill: 100,
      turnover_rate: 60,
      employee_satisfaction: 20,
      training_roi: -40,
      engagement_level: 20,
      dei_score: 10,
      absenteeism_rate: 20,
      review_coverage: 30,
      training_effectiveness: 0,
      succession_pipeline: 5,
      hr_tech_score: 10,
      compensation_ratio: 60,
      budget_adherence: 30,
    };
    const bsc = computeBSCScores(
      poorMetrics,
      fin,
      budget,
      industry,
      strategy,
      decision
    );
    for (const score of [
      bsc.score_financial,
      bsc.score_employee,
      bsc.score_process,
      bsc.score_learning,
    ]) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(strategy.bsc_weights.financial);
    }
    expect(bsc.total_score).toBeLessThan(30);
  });

  it("clamps total_score to [0, 100]", () => {
    const strategy = getStrategyConfig("Focus");
    const bscExcellent = computeBSCScores(
      excellentMetrics,
      fin,
      budget,
      industry,
      strategy,
      decision
    );
    expect(bscExcellent.total_score).toBeLessThanOrEqual(100);
    expect(bscExcellent.total_score).toBeGreaterThanOrEqual(0);
  });
});

describe("computeBSCScores — compensation_ratio/budget_adherence are recomputed, not passed through", () => {
  it("overrides metrics.budget_adherence with budget.adherence_pct before scoring/bonus checks", () => {
    // The HRMetrics passed in carries budget_adherence:100, but the function
    // recomputes it from `budget.adherence_pct` first — a caller passing a
    // stale/placeholder metrics.budget_adherence cannot silently affect the
    // score, only the budget object does.
    const strategy = getStrategyConfig("Cost Leadership");
    const lowAdherenceBudget: BudgetBreakdown = { ...budget, adherence_pct: 30 };
    const bsc = computeBSCScores(
      excellentMetrics, // metrics.budget_adherence: 100 (would score "excellent")
      fin,
      lowAdherenceBudget, // but the budget object says 30 ("poor")
      industry,
      strategy,
      decision
    );
    // budget_adherence benchmark: excellent>=95, poor=60. adherence_pct=30
    // is below poor, so the financial score must be visibly reduced versus
    // the fully-excellent case despite metrics saying 100.
    const bscExcellent = computeBSCScores(
      excellentMetrics,
      fin,
      budget, // adherence_pct: 100
      industry,
      strategy,
      decision
    );
    expect(bsc.score_financial).toBeLessThan(bscExcellent.score_financial);
  });

  it("recomputes compensation_ratio from financials.total_compensation/revenue rather than metrics.compensation_ratio, when revenue > 0", () => {
    const strategy = getStrategyConfig("Cost Leadership");
    // metrics says compensation_ratio: 20 (excellent), but
    // total_compensation/revenue = 17,500,000/50,000,000 = 35% — worse than
    // the compensation_ratio benchmark's excellent cutoff of 30.
    const finHigherComp: FinancialMetrics = {
      ...fin,
      total_compensation: 17_500_000,
      revenue: 50_000_000,
    };
    const bsc = computeBSCScores(
      excellentMetrics,
      finHigherComp,
      budget,
      industry,
      strategy,
      decision
    );
    // If metrics.compensation_ratio (20, excellent) had been used directly,
    // score_financial would hit the strategy's full weight ceiling like the
    // all-excellent case above. It does not, because it's actually 35%.
    expect(bsc.score_financial).toBeLessThan(strategy.bsc_weights.financial);
  });

  it("falls back to metrics.compensation_ratio when financials.revenue <= 0 (division-by-zero guard)", () => {
    const strategy = getStrategyConfig("Focus");
    const finZeroRevenue: FinancialMetrics = { ...fin, revenue: 0 };
    const bsc = computeBSCScores(
      excellentMetrics, // compensation_ratio: 20, excellent
      finZeroRevenue,
      budget,
      industry,
      strategy,
      decision
    );
    // With revenue<=0 the ratio can't be recomputed, so it falls back to
    // metrics.compensation_ratio=20 (excellent) and the financial score
    // still hits the ceiling.
    expect(bsc.score_financial).toBe(strategy.bsc_weights.financial);
  });
});

describe("computeBSCScores — strategy bonus", () => {
  it("awards the strategy's bonus when its condition is met (Cost Leadership: budget_adherence > 95 AND compensation_ratio < 30)", () => {
    const strategy = getStrategyConfig("Cost Leadership");
    const finLowComp: FinancialMetrics = {
      ...fin,
      total_compensation: 10_000_000, // ratio = 20% < 30
      revenue: 50_000_000,
    };
    const budgetHighAdherence: BudgetBreakdown = { ...budget, adherence_pct: 96 };
    const bsc = computeBSCScores(
      excellentMetrics,
      finLowComp,
      budgetHighAdherence,
      industry,
      strategy,
      decision
    );
    expect(bsc.strategy_bonus).toBe(3);
  });

  it("withholds the bonus when only one half of an AND condition is met", () => {
    const strategy = getStrategyConfig("Cost Leadership");
    const finLowComp: FinancialMetrics = {
      ...fin,
      total_compensation: 10_000_000,
      revenue: 50_000_000,
    };
    const budgetLowAdherence: BudgetBreakdown = { ...budget, adherence_pct: 80 }; // <= 95
    const bsc = computeBSCScores(
      excellentMetrics,
      finLowComp,
      budgetLowAdherence,
      industry,
      strategy,
      decision
    );
    expect(bsc.strategy_bonus).toBe(0);
  });

  it("caps cumulative strategy bonus at 3 even when multiple bonus_conditions are satisfied", () => {
    // Each shipped StrategyConfig only defines one bonus_conditions entry
    // (worth 3 points), so the `Math.min(bonus, 3)` cap can't be observed
    // from any real strategy. Build a synthetic strategy with two
    // simultaneously-satisfiable 3-point conditions to prove the cap holds.
    const costLeadership = getStrategyConfig("Cost Leadership");
    const customStrategy = {
      ...costLeadership,
      bonus_conditions: [
        {
          condition: "budget_adherence > 95 AND compensation_ratio < 30",
          perspective: "financial" as const,
          points: 3,
        },
        {
          condition: "training_roi > 15 AND retention > 88",
          perspective: "learning" as const,
          points: 3,
        },
      ],
    };
    const finLowComp: FinancialMetrics = {
      ...fin,
      total_compensation: 10_000_000,
      revenue: 50_000_000,
    };
    const budgetHighAdherence: BudgetBreakdown = { ...budget, adherence_pct: 96 };
    const metricsBothConditions: HRMetrics = {
      ...excellentMetrics,
      training_roi: 20,
      turnover_rate: 5, // retention = 95 > 88
    };
    const bsc = computeBSCScores(
      metricsBothConditions,
      finLowComp,
      budgetHighAdherence,
      industry,
      customStrategy,
      decision
    );
    expect(bsc.strategy_bonus).toBe(3);
  });
});

describe("computeBSCScores — industry process penalties", () => {
  it("applies Banking's process_penalty when review_coverage < 80", () => {
    const banking = getIndustryConfig("Banking");
    const strategy = getStrategyConfig("Focus");
    const metricsLowReview: HRMetrics = { ...excellentMetrics, review_coverage: 50 };
    const bsc = computeBSCScores(
      metricsLowReview,
      fin,
      budget,
      banking,
      strategy,
      decision
    );
    expect(bsc.industry_penalty).toBe(5);
  });

  it("does not apply Banking's process_penalty when review_coverage >= 80", () => {
    const banking = getIndustryConfig("Banking");
    const strategy = getStrategyConfig("Focus");
    const metricsHighReview: HRMetrics = { ...excellentMetrics, review_coverage: 90 };
    const bsc = computeBSCScores(
      metricsHighReview,
      fin,
      budget,
      banking,
      strategy,
      decision
    );
    expect(bsc.industry_penalty).toBe(0);
  });

  it("applies Retail's process_penalty when time_to_fill > 45", () => {
    const retail = getIndustryConfig("Retail");
    const strategy = getStrategyConfig("Focus");
    const metricsSlowFill: HRMetrics = { ...excellentMetrics, time_to_fill: 50 };
    const bsc = computeBSCScores(
      metricsSlowFill,
      fin,
      budget,
      retail,
      strategy,
      decision
    );
    expect(bsc.industry_penalty).toBe(5);
  });

  it("total_score equals the sum of the four perspective scores plus bonus minus penalty (pre-clamp)", () => {
    // Verify the composition rule directly rather than by varying an input
    // that (like review_coverage) also feeds its own perspective score —
    // isolating industry_penalty's effect that way conflates two changes.
    const banking = getIndustryConfig("Banking");
    const strategy = getStrategyConfig("Focus");
    const metricsLowReview: HRMetrics = { ...excellentMetrics, review_coverage: 50 };
    const bsc = computeBSCScores(
      metricsLowReview,
      fin,
      budget,
      banking,
      strategy,
      decision
    );
    expect(bsc.industry_penalty).toBe(5);
    const composed =
      bsc.score_financial +
      bsc.score_employee +
      bsc.score_process +
      bsc.score_learning +
      bsc.strategy_bonus -
      bsc.industry_penalty;
    expect(bsc.total_score).toBeCloseTo(composed, 6);
  });
});
