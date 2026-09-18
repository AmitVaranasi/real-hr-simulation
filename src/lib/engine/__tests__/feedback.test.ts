import { describe, expect, it } from "vitest";
import { generateFeedback, generateRoundSummary } from "../feedback";
import { getIndustryConfig, getStrategyConfig } from "../config";
import type { BSCScores, FinancialMetrics, HRMetrics } from "../types";

// Baseline metrics land every metric exactly on its "moderate" plateau
// (halfway between excellent and poor per feedback.ts's metricDefs) so each
// test below can nudge a single field across a threshold without any other
// metric's status changing underneath it.
function baseMetrics(overrides: Partial<HRMetrics> = {}): HRMetrics {
  return {
    cost_per_hire: 7250, // mid of 4500..10000
    time_to_fill: 45, // mid of 30..60
    turnover_rate: 20, // mid of 10..30
    employee_satisfaction: 70, // mid of 85..55
    training_roi: 10, // mid of 20..0
    engagement_level: 70, // mid of 85..55
    dei_score: 67.5, // mid of 85..50
    absenteeism_rate: 8, // mid of 4..12
    review_coverage: 80, // mid of 95..65
    training_effectiveness: 12.5, // mid of 20..5
    succession_pipeline: 55, // mid of 80..30
    hr_tech_score: 57.5, // mid of 85..30
    compensation_ratio: 40, // mid of 30..50
    budget_adherence: 77.5, // mid of 95..60
    productivity: 0.425, // mid of 0.55..0.3
    hiring_quality: 60, // mid of 80..40
    turnover_cost: 0,
    ...overrides,
  };
}

const financials: FinancialMetrics = {
  headcount: 300,
  revenue: 50_000_000,
  profit: 5_000_000,
  cashflow: 1_000_000,
  stock_price: 25,
  market_share: 15,
  profit_margin: 12,
  total_compensation: 20_000_000,
  total_budget_spent: 500_000,
  turnover_cost: 100_000,
};

const bsc: BSCScores = {
  score_financial: 15,
  score_employee: 15,
  score_process: 15,
  score_learning: 15,
  total_score: 60,
  strategy_bonus: 0,
  industry_penalty: 0,
};

// generateFeedback receives industry as `_industry` and never reads it, so a
// real resolved config is used purely to satisfy the type signature.
const industry = getIndustryConfig("Manufacturing");
const strategy = getStrategyConfig("Focus");

function feedbackFor(key: keyof HRMetrics, value: number) {
  const metrics = baseMetrics({ [key]: value } as Partial<HRMetrics>);
  const payload = generateFeedback(metrics, financials, bsc, industry, strategy, null);
  return payload.metrics.find((m) => m.metric_name === key)!;
}

describe("generateFeedback — metric status thresholds", () => {
  // cost_per_hire is "lower is better": excellent=4500, poor=10000,
  // midpoint=7250. metricStatus uses <= comparisons, so the boundary value
  // itself belongs to the *better* bucket.
  it("cost_per_hire: exactly at excellent boundary (4500) is excellent, one cent over is moderate", () => {
    expect(feedbackFor("cost_per_hire", 4500).status).toBe("excellent");
    expect(feedbackFor("cost_per_hire", 4500.01).status).toBe("moderate");
  });

  it("cost_per_hire: exactly at midpoint (7250) is moderate, one cent over is poor", () => {
    expect(feedbackFor("cost_per_hire", 7250).status).toBe("moderate");
    expect(feedbackFor("cost_per_hire", 7250.01).status).toBe("poor");
  });

  it("cost_per_hire: exactly at poor boundary (10000) is poor, one cent over is critical", () => {
    expect(feedbackFor("cost_per_hire", 10000).status).toBe("poor");
    expect(feedbackFor("cost_per_hire", 10000.01).status).toBe("critical");
  });

  // employee_satisfaction is "higher is better": excellent=85, poor=55,
  // midpoint=70. Boundaries flip direction relative to cost_per_hire.
  it("employee_satisfaction: exactly at excellent boundary (85) is excellent, one cent under is moderate", () => {
    expect(feedbackFor("employee_satisfaction", 85).status).toBe("excellent");
    expect(feedbackFor("employee_satisfaction", 84.99).status).toBe("moderate");
  });

  it("employee_satisfaction: exactly at midpoint (70) is moderate, one cent under is poor", () => {
    expect(feedbackFor("employee_satisfaction", 70).status).toBe("moderate");
    expect(feedbackFor("employee_satisfaction", 69.99).status).toBe("poor");
  });

  it("employee_satisfaction: exactly at poor boundary (55) is poor, one cent under is critical", () => {
    expect(feedbackFor("employee_satisfaction", 55).status).toBe("poor");
    expect(feedbackFor("employee_satisfaction", 54.99).status).toBe("critical");
  });

  it("extreme values still resolve to excellent/critical without throwing", () => {
    expect(feedbackFor("cost_per_hire", 0).status).toBe("excellent");
    expect(feedbackFor("employee_satisfaction", 100).status).toBe("excellent");
    expect(feedbackFor("employee_satisfaction", -50).status).toBe("critical");
  });
});

describe("generateFeedback — feedback_text template selection", () => {
  it("substitutes {value} with the metric's formatted display value", () => {
    const mf = feedbackFor("cost_per_hire", 4500);
    expect(mf.formatted_value).toBe("$4,500");
    expect(mf.feedback_text).toContain("$4,500");
    expect(mf.feedback_text).not.toContain("{value}");
  });

  it("falls back to the generic template for a metric key with no entry in FEEDBACK_TEMPLATES", () => {
    // hr_tech_score has NO entry in FEEDBACK_TEMPLATES (feedback.ts's
    // FEEDBACK_TEMPLATES map covers 15 keys; hr_tech_score is the 16th
    // metricDef and is not among them). feedbackText() falls through both
    // `FEEDBACK_TEMPLATES[key]?.[status]` and `?.moderate` to the generic
    // "{name} is {value} ({status})." template. This is a real, reachable
    // gap: any player scoring on hr_tech_score sees generic boilerplate
    // instead of tailored guidance.
    const mf = feedbackFor("hr_tech_score", 57.5);
    expect(mf.status).toBe("moderate");
    expect(mf.feedback_text).toBe(
      "hr tech score is 58/100 (moderate). Review related HR decisions."
    );
  });
});

describe("generateFeedback — perspective strength/weakness thresholds", () => {
  it("marks a perspective as a top_strength once its score reaches 65% of its max", () => {
    const strategyLocal = getStrategyConfig("Focus"); // financial max weight = 25
    const bscAt65 = { ...bsc, score_financial: 25 * 0.65 };
    const payload = generateFeedback(
      baseMetrics(),
      financials,
      bscAt65,
      industry,
      strategyLocal,
      null
    );
    const financialPerspective = payload.perspectives.find(
      (p) => p.perspective === "financial"
    )!;
    expect(financialPerspective.top_strength).toContain("Strong performance");

    const bscJustBelow = { ...bsc, score_financial: 25 * 0.65 - 0.01 };
    const payloadBelow = generateFeedback(
      baseMetrics(),
      financials,
      bscJustBelow,
      industry,
      strategyLocal,
      null
    );
    const belowPerspective = payloadBelow.perspectives.find(
      (p) => p.perspective === "financial"
    )!;
    expect(belowPerspective.top_strength).toContain("Room to grow");
  });

  it("marks a perspective as a top_weakness once its score drops below 45% of its max", () => {
    const strategyLocal = getStrategyConfig("Focus"); // financial max weight = 25
    const bscAt45 = { ...bsc, score_financial: 25 * 0.45 };
    const payloadAt = generateFeedback(
      baseMetrics(),
      financials,
      bscAt45,
      industry,
      strategyLocal,
      null
    );
    const atPerspective = payloadAt.perspectives.find(
      (p) => p.perspective === "financial"
    )!;
    // score < max*0.45 is required (strict less-than), so exactly-45% is NOT
    // a weakness.
    expect(atPerspective.top_weakness).toContain("Maintain momentum");

    const bscBelow45 = { ...bsc, score_financial: 25 * 0.45 - 0.01 };
    const payloadBelow = generateFeedback(
      baseMetrics(),
      financials,
      bscBelow45,
      industry,
      strategyLocal,
      null
    );
    const belowPerspective = payloadBelow.perspectives.find(
      (p) => p.perspective === "financial"
    )!;
    expect(belowPerspective.top_weakness).toContain("Prioritize investments");
  });
});

describe("generateRoundSummary", () => {
  const priorMetrics = baseMetrics();

  it("reports no improvements/declines sentence when there is no prior round", () => {
    const summary = generateRoundSummary(bsc, baseMetrics(), null);
    expect(summary).not.toContain("improved");
    expect(summary).not.toContain("declined");
  });

  it("flags an improvement only once the delta strictly exceeds the +2 threshold (satisfaction)", () => {
    // metrics.employee_satisfaction > priorMetrics.employee_satisfaction + 2
    const atThreshold = generateRoundSummary(
      bsc,
      baseMetrics({ employee_satisfaction: priorMetrics.employee_satisfaction + 2 }),
      priorMetrics
    );
    expect(atThreshold).not.toContain("improved");

    const overThreshold = generateRoundSummary(
      bsc,
      baseMetrics({ employee_satisfaction: priorMetrics.employee_satisfaction + 2.01 }),
      priorMetrics
    );
    expect(overThreshold).toContain("employee satisfaction");
    expect(overThreshold).toContain("improved");
  });

  it("flags a decline only once turnover strictly exceeds the +2 threshold", () => {
    const atThreshold = generateRoundSummary(
      bsc,
      baseMetrics({ turnover_rate: priorMetrics.turnover_rate + 2 }),
      priorMetrics
    );
    expect(atThreshold).not.toContain("declined");

    const overThreshold = generateRoundSummary(
      bsc,
      baseMetrics({ turnover_rate: priorMetrics.turnover_rate + 2.01 }),
      priorMetrics
    );
    expect(overThreshold).toContain("turnover");
    expect(overThreshold).toContain("declined");
  });

  it("joins multiple simultaneous improvements with 'and'", () => {
    const summary = generateRoundSummary(
      bsc,
      baseMetrics({
        employee_satisfaction: priorMetrics.employee_satisfaction + 3,
        engagement_level: priorMetrics.engagement_level + 3,
      }),
      priorMetrics
    );
    expect(summary).toContain("employee satisfaction and engagement improved");
  });

  it("always names the lowest-scoring BSC perspective as next round's priority", () => {
    const lowLearning: BSCScores = {
      score_financial: 20,
      score_employee: 20,
      score_process: 20,
      score_learning: 5,
      total_score: 65,
      strategy_bonus: 0,
      industry_penalty: 0,
    };
    const summary = generateRoundSummary(lowLearning, baseMetrics(), null);
    expect(summary).toContain("prioritize Learning & Growth (scored 5.0)");
  });

  it("breaks ties by taking the first perspective in Financial/Employee/Process/Learning order", () => {
    // Array.prototype.sort is stable, and generateRoundSummary sorts a copy
    // of [Financial, Employee, Process, Learning] ascending by score without
    // a tiebreaker — so on a tie the first-listed perspective (Financial)
    // wins. This pins that stable-sort behaviour rather than any documented
    // priority rule.
    const allTied: BSCScores = {
      score_financial: 10,
      score_employee: 10,
      score_process: 10,
      score_learning: 10,
      total_score: 40,
      strategy_bonus: 0,
      industry_penalty: 0,
    };
    const summary = generateRoundSummary(allTied, baseMetrics(), null);
    expect(summary).toContain("prioritize Financial");
  });
});
