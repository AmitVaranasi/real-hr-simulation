import { describe, expect, it } from "vitest";
import { createDefaultDecision } from "../defaults";
import {
  generateBudgetRecommendations,
  generateCausalFactors,
  generateLearningInsights,
} from "../explainability";
import { DEFAULT_INDUSTRY_NORMS } from "../industry-norms";
import type {
  BSCScores,
  BudgetBreakdown,
  HRMetrics,
  SimulationTrace,
} from "../types";

function baseMetrics(overrides: Partial<HRMetrics> = {}): HRMetrics {
  return {
    cost_per_hire: 6000,
    time_to_fill: 35,
    turnover_rate: 12,
    employee_satisfaction: 75,
    training_roi: 8,
    engagement_level: 70,
    dei_score: 60,
    absenteeism_rate: 6,
    review_coverage: 85,
    training_effectiveness: 10,
    succession_pipeline: 50,
    hr_tech_score: 40,
    compensation_ratio: 35,
    budget_adherence: 90,
    productivity: 70,
    hiring_quality: 70,
    turnover_cost: 20_000,
    ...overrides,
  };
}

function baseBsc(overrides: Partial<BSCScores> = {}): BSCScores {
  return {
    score_financial: 20,
    score_employee: 20,
    score_process: 20,
    score_learning: 20,
    total_score: 80,
    strategy_bonus: 0,
    industry_penalty: 0,
    ...overrides,
  };
}

function baseTrace(overrides: Partial<SimulationTrace["financial_cascade"]> = {}): SimulationTrace {
  return {
    budget_breakdown: {} as BudgetBreakdown,
    raw_metrics: baseMetrics(),
    normalized_metrics: {},
    industry_adjusted_metrics: baseMetrics(),
    productivity_components: {
      training: 0,
      engagement: 0,
      retention: 0,
      leadership: 0,
      technology: 0,
      total: 0,
    },
    financial_cascade: {
      revenue: 1_000_000,
      total_compensation: 300_000,
      turnover_cost: 20_000,
      other_hr_costs: 100_000,
      non_hr_expenses: 200_000,
      profit: 100_000,
      ...overrides,
    },
    bsc_component_scores: {
      financial_components: [],
      employee_components: [],
      process_components: [],
      learning_components: [],
    },
    bsc_scores: baseBsc(),
    feedback: {
      metrics: [],
      warnings: [],
      summary: "",
      perspectives: [],
    } as unknown as SimulationTrace["feedback"],
  };
}

describe("generateCausalFactors", () => {
  it("flags below-market compensation when the weighted salary band is negative", () => {
    const decision = createDefaultDecision({
      role_compensation: createDefaultDecision().role_compensation.map((rc) => ({
        ...rc,
        salary_band: -20,
      })),
    });
    const factors = generateCausalFactors(decision, baseMetrics(), baseTrace());
    expect(factors.some((f) => f.includes("Turnover pressure"))).toBe(true);
  });

  it("does not flag compensation when the average band is at or above market", () => {
    const decision = createDefaultDecision(); // default salary_band 0
    const factors = generateCausalFactors(decision, baseMetrics(), baseTrace());
    expect(factors.some((f) => f.includes("Turnover pressure"))).toBe(false);
  });

  it("flags low training coverage under 30%", () => {
    const decision = createDefaultDecision({ pct_employees_trained: 10 });
    const factors = generateCausalFactors(decision, baseMetrics(), baseTrace());
    expect(
      factors.some((f) => f.includes("Low training coverage"))
    ).toBe(true);
  });

  it("flags low engagement under 60", () => {
    const decision = createDefaultDecision();
    const factors = generateCausalFactors(
      decision,
      baseMetrics({ engagement_level: 50 }),
      baseTrace()
    );
    expect(factors.some((f) => f.includes("Engagement fell"))).toBe(true);
  });

  it("flags turnover cost when it exceeds half of other_hr_costs", () => {
    const decision = createDefaultDecision();
    const trace = baseTrace({ turnover_cost: 60_000, other_hr_costs: 100_000 });
    const factors = generateCausalFactors(decision, baseMetrics(), trace);
    expect(factors.some((f) => f.includes("Turnover cost"))).toBe(true);
  });

  it("flags high labor cost share above 35% of revenue", () => {
    const decision = createDefaultDecision();
    const trace = baseTrace({ total_compensation: 400_000, revenue: 1_000_000 });
    const factors = generateCausalFactors(decision, baseMetrics(), trace);
    expect(factors.some((f) => f.includes("labor cost share"))).toBe(true);
  });

  it("caps output at 6 factors even when every condition fires", () => {
    const decision = createDefaultDecision({
      pct_employees_trained: 5,
      developmental_programs: ["Technical Skills", "Compliance"],
      role_compensation: createDefaultDecision().role_compensation.map((rc) => ({
        ...rc,
        salary_band: -20,
      })),
    });
    const metrics = baseMetrics({
      engagement_level: 30,
      training_roi: 15,
      budget_adherence: 97,
    });
    const trace = baseTrace({
      turnover_cost: 90_000,
      other_hr_costs: 100_000,
      total_compensation: 500_000,
      revenue: 1_000_000,
    });
    const factors = generateCausalFactors(decision, metrics, trace);
    expect(factors.length).toBeLessThanOrEqual(6);
  });
});

describe("generateLearningInsights", () => {
  const decision = createDefaultDecision();

  it("names the highest-scoring BSC perspective first in went_well", () => {
    const bsc = baseBsc({
      score_financial: 10,
      score_employee: 30,
      score_process: 5,
      score_learning: 5,
    });
    const insights = generateLearningInsights(baseMetrics(), bsc, baseTrace(), decision);
    expect(insights.went_well[0]).toContain("Employee");
  });

  it("names the lowest-scoring BSC perspective first in hurt_performance", () => {
    const bsc = baseBsc({
      score_financial: 10,
      score_employee: 30,
      score_process: 5,
      score_learning: 25,
    });
    const insights = generateLearningInsights(baseMetrics(), bsc, baseTrace(), decision);
    expect(insights.hurt_performance[0]).toContain("Process");
  });

  it("recommends more training when Learning is the weakest perspective", () => {
    const bsc = baseBsc({
      score_financial: 30,
      score_employee: 30,
      score_process: 30,
      score_learning: 5,
    });
    const insights = generateLearningInsights(baseMetrics(), bsc, baseTrace(), decision);
    expect(
      insights.next_round.some((n) => n.includes("developmental programs"))
    ).toBe(true);
  });

  it("compares turnover against priorMetrics only when priorMetrics is supplied", () => {
    const withoutPrior = generateLearningInsights(
      baseMetrics({ turnover_rate: 20 }),
      baseBsc(),
      baseTrace(),
      decision
    );
    expect(
      withoutPrior.hurt_performance.some((h) => h.includes("rose vs last round"))
    ).toBe(false);

    const withPrior = generateLearningInsights(
      baseMetrics({ turnover_rate: 20 }),
      baseBsc(),
      baseTrace(),
      decision,
      baseMetrics({ turnover_rate: 10 })
    );
    expect(
      withPrior.hurt_performance.some((h) => h.includes("rose vs last round"))
    ).toBe(true);
  });

  it("does not flag a turnover rise when it grew by 2 points or less (boundary)", () => {
    const insights = generateLearningInsights(
      baseMetrics({ turnover_rate: 12 }),
      baseBsc(),
      baseTrace(),
      decision,
      baseMetrics({ turnover_rate: 10 })
    );
    expect(
      insights.hurt_performance.some((h) => h.includes("rose vs last round"))
    ).toBe(false);
  });

  it("caps each of went_well/hurt_performance/next_round at 4 entries", () => {
    const bsc = baseBsc({
      score_financial: 5,
      score_employee: 5,
      score_process: 5,
      score_learning: 40,
    });
    const metrics = baseMetrics({
      employee_satisfaction: 80,
      turnover_rate: 5,
      training_roi: 20,
      cost_per_hire: 9000,
      budget_adherence: 70,
    });
    const trace = baseTrace({ profit: 50_000 });
    const badDecision = createDefaultDecision({
      role_compensation: createDefaultDecision().role_compensation.map((rc) => ({
        ...rc,
        salary_band: -20,
      })),
    });
    const insights = generateLearningInsights(
      metrics,
      bsc,
      trace,
      badDecision,
      baseMetrics({ turnover_rate: 1 })
    );
    expect(insights.went_well.length).toBeLessThanOrEqual(4);
    expect(insights.hurt_performance.length).toBeLessThanOrEqual(4);
    expect(insights.next_round.length).toBeLessThanOrEqual(4);
  });

  it("always includes the forecast reminder as the last possible next_round item", () => {
    const insights = generateLearningInsights(baseMetrics(), baseBsc(), baseTrace(), decision);
    expect(
      insights.next_round.some((n) => n.includes("review page forecast"))
    ).toBe(true);
  });
});

describe("generateBudgetRecommendations", () => {
  const industry = "Manufacturing" as const;

  function budget(overrides: Partial<BudgetBreakdown> = {}): BudgetBreakdown {
    return {
      recruitment_spend: 0,
      performance_spend: 0,
      training_spend: 0,
      relations_spend: 0,
      compensation_spend: 0,
      org_design_spend: 0,
      dei_spend: 0,
      total_spend: 100_000,
      available_budget: 500_000,
      remaining: 400_000,
      adherence_pct: 100,
      ...overrides,
    };
  }

  it("warns when a module's share exceeds the industry max by more than 2 points", () => {
    // Manufacturing training suggested max is 8% of HR budget.
    const b = budget({ training_spend: 11_000, total_spend: 100_000 }); // 11%
    const messages = generateBudgetRecommendations(
      b,
      DEFAULT_INDUSTRY_NORMS,
      industry,
      10
    );
    expect(messages.some((m) => m.includes("above the suggested industry range"))).toBe(
      true
    );
  });

  it("does not warn when a module is within 2 points of the max (tolerance band)", () => {
    const b = budget({ training_spend: 9_500, total_spend: 100_000 }); // 9.5%, max 8 + 2 = 10
    const messages = generateBudgetRecommendations(
      b,
      DEFAULT_INDUSTRY_NORMS,
      industry,
      10
    );
    expect(messages.some((m) => m.includes("above the suggested"))).toBe(false);
  });

  it("warns when a module's share is more than 2 points below the industry min", () => {
    // Manufacturing recruitment min is 15%.
    const b = budget({ recruitment_spend: 12_000, total_spend: 100_000 }); // 12%
    const messages = generateBudgetRecommendations(
      b,
      DEFAULT_INDUSTRY_NORMS,
      industry,
      10
    );
    expect(
      messages.some((m) => m.includes("below industry minimums"))
    ).toBe(true);
  });

  it("skips modules with no configured norm for the industry (org_design)", () => {
    // org_design has no norm entry on any DEFAULT_INDUSTRY_NORMS profile —
    // it must be silently skipped rather than throwing on norm.max.
    const b = budget({ org_design_spend: 90_000, total_spend: 100_000 });
    expect(() =>
      generateBudgetRecommendations(b, DEFAULT_INDUSTRY_NORMS, industry, 10)
    ).not.toThrow();
  });

  it("flags benefits below the industry min and above the industry max", () => {
    const b = budget();
    const low = generateBudgetRecommendations(b, DEFAULT_INDUSTRY_NORMS, industry, 10);
    expect(low.some((m) => m.includes("below typical industry norms"))).toBe(true);

    const high = generateBudgetRecommendations(b, DEFAULT_INDUSTRY_NORMS, industry, 50);
    expect(high.some((m) => m.includes("above industry norms"))).toBe(true);
  });

  it("flags a negative remaining budget as an overspend", () => {
    const b = budget({ remaining: -5000 });
    const messages = generateBudgetRecommendations(b, DEFAULT_INDUSTRY_NORMS, industry, 25);
    expect(
      messages.some((m) => m.includes("over the discretionary HR budget"))
    ).toBe(true);
  });

  it("produces no messages for a budget that sits comfortably inside every norm", () => {
    // Manufacturing compensation suggested [65,75]; put every share mid-range
    // and remaining positive with benefits inside [20,40].
    const b = budget({
      compensation_spend: 70_000,
      training_spend: 6_000,
      recruitment_spend: 18_000,
      performance_spend: 3_000,
      total_spend: 100_000,
      remaining: 400_000,
    });
    const messages = generateBudgetRecommendations(b, DEFAULT_INDUSTRY_NORMS, industry, 25);
    expect(messages).toEqual([]);
  });
});
