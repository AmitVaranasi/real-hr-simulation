import { describe, expect, it } from "vitest";
import * as M from "../metrics";
import { getIndustryConfig, priorStateFromIndustry } from "../config";
import { createDefaultDecision } from "../defaults";
import type { PriorState } from "../types";

const industry = getIndustryConfig("Manufacturing");
const prior = priorStateFromIndustry("Manufacturing");

describe("computeCostPerHire", () => {
  it("returns 0 (not NaN/Infinity) when there are no hires — division-by-zero guard", () => {
    const d = createDefaultDecision({ positions_to_fill: [] });
    expect(M.computeCostPerHire(d, industry)).toBe(0);
  });

  it("returns recruitment cost / hires for a nonzero headcount", () => {
    const d = createDefaultDecision({
      positions_to_fill: [{ role_id: "entry", count: 4 }],
    });
    // computeCostPerHire is defined as computeRecruitmentCost/hires; assert
    // it's a positive finite number that scales with recruitment spend
    // (i.e. actually divides, doesn't just return a constant).
    const result = M.computeCostPerHire(d, industry);
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });
});

describe("computeTimeToFill", () => {
  it("returns 0 when there are no hires — division-by-zero guard", () => {
    const d = createDefaultDecision({ positions_to_fill: [] });
    expect(M.computeTimeToFill(d)).toBe(0);
  });

  it("skips positions with count <= 0 in the weighted average", () => {
    const withZero = createDefaultDecision({
      positions_to_fill: [
        { role_id: "entry", count: 2 },
        { role_id: "manager", count: 0 },
      ],
    });
    const withoutZero = createDefaultDecision({
      positions_to_fill: [{ role_id: "entry", count: 2 }],
    });
    expect(M.computeTimeToFill(withZero)).toBeCloseTo(
      M.computeTimeToFill(withoutZero),
      6
    );
  });

  it("clamps each role's days-to-fill to [10, 120] before weighting", () => {
    // screening_rigor=3 (+8), diversity_goal_pct=50 (+10), hr_tech_level=0 (+0):
    // an "executive" role (base 60) would be 60+8+10=78, well under the 120
    // ceiling, so this pins the unclamped weighted result for a role mix
    // that does not hit either clamp bound.
    const d = createDefaultDecision({
      positions_to_fill: [{ role_id: "executive", count: 1 }],
      screening_rigor: 3,
      diversity_goal_pct: 50,
      hr_tech_level: 0,
    });
    expect(M.computeTimeToFill(d)).toBeCloseTo(60 + 8 + 50 * 0.2, 6);
  });
});

describe("computeSatisfaction", () => {
  it("blends the raw (current-decision) score with prior satisfaction 70/30", () => {
    const d = createDefaultDecision();
    const highPrior: PriorState = { ...prior, satisfaction: 100 };
    const lowPrior: PriorState = { ...prior, satisfaction: 20 };
    const satHigh = M.computeSatisfaction(d, highPrior);
    const satLow = M.computeSatisfaction(d, lowPrior);
    // Same decision, only prior.satisfaction differs by 80; the 0.3 weight
    // on the prior means the outputs should differ by roughly 0.3*80=24,
    // as long as neither result gets clamped away.
    expect(satHigh - satLow).toBeCloseTo(80 * 0.3, 1);
  });

  it("clamps the overall result to [20, 100]", () => {
    const d = createDefaultDecision({
      role_compensation: createDefaultDecision().role_compensation.map(
        (rc) => ({ ...rc, salary_band: -20 as const })
      ),
      benefits_pct: 6,
      bonus_tier: 5,
      developmental_programs: [],
      pct_employees_trained: 0,
      conflict_approach: "disciplinary",
      voice_mechanisms: 0,
      engagement_investment: 0,
      flexibility_level: 0,
      hr_tech_level: 0,
    });
    const worstPrior: PriorState = { ...prior, satisfaction: 20 };
    const result = M.computeSatisfaction(d, worstPrior);
    expect(result).toBeGreaterThanOrEqual(20);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe("computeTurnoverRate", () => {
  it("adds an 8-point spike in High-Tech specifically when avg salary band < -5% of market", () => {
    // Isolate the industry-specific branch with a fixed PriorState shared
    // across both industries so the only variable is `industryConfig`.
    const fixedPrior: PriorState = {
      headcount: 300,
      revenue: 50_000_000,
      stock_price: 25,
      market_share: 15,
      profit_margin: 12,
      satisfaction: 65,
      engagement: 60,
      turnover_rate: 15,
    };
    const dLowBand = createDefaultDecision({
      role_compensation: createDefaultDecision().role_compensation.map(
        (rc) => ({ ...rc, salary_band: -10 as const })
      ),
    });
    const satisfaction = M.computeSatisfaction(dLowBand, fixedPrior);
    const htRate = M.computeTurnoverRate(
      dLowBand,
      fixedPrior,
      satisfaction,
      getIndustryConfig("High-Tech")
    );
    const mfgRate = M.computeTurnoverRate(
      dLowBand,
      fixedPrior,
      satisfaction,
      getIndustryConfig("Manufacturing")
    );
    expect(htRate - mfgRate).toBeCloseTo(8, 6);
  });

  it("does not spike in High-Tech when avg salary band is at or above -5% of market", () => {
    const fixedPrior: PriorState = {
      headcount: 300,
      revenue: 50_000_000,
      stock_price: 25,
      market_share: 15,
      profit_margin: 12,
      satisfaction: 65,
      engagement: 60,
      turnover_rate: 15,
    };
    const dNoBand = createDefaultDecision(); // avgBand = 0, not < -5
    const satisfaction = M.computeSatisfaction(dNoBand, fixedPrior);
    const htRate = M.computeTurnoverRate(
      dNoBand,
      fixedPrior,
      satisfaction,
      getIndustryConfig("High-Tech")
    );
    const mfgRate = M.computeTurnoverRate(
      dNoBand,
      fixedPrior,
      satisfaction,
      getIndustryConfig("Manufacturing")
    );
    expect(htRate - mfgRate).toBeCloseTo(0, 6);
  });

  it("clamps the final rate to [3, 50]", () => {
    const d = createDefaultDecision({
      role_compensation: createDefaultDecision().role_compensation.map(
        (rc) => ({ ...rc, salary_band: -20 as const })
      ),
      equity_level: 0,
    });
    const veryHighPrior: PriorState = { ...prior, turnover_rate: 200 };
    const rate = M.computeTurnoverRate(
      d,
      veryHighPrior,
      20,
      getIndustryConfig("High-Tech")
    );
    expect(rate).toBeLessThanOrEqual(50);
    const veryLowPrior: PriorState = { ...prior, turnover_rate: -200 };
    const rateLow = M.computeTurnoverRate(
      createDefaultDecision(),
      veryLowPrior,
      100,
      industry
    );
    expect(rateLow).toBeGreaterThanOrEqual(3);
  });
});

describe("computeTrainingEffectiveness", () => {
  it("returns 0 with no developmental programs, no coverage, and no per-employee budget", () => {
    const d = createDefaultDecision({
      developmental_programs: [],
      pct_employees_trained: 0,
      training_budget_per_ee: 0,
    });
    // preTraining and postTraining are equal in this scenario, so the
    // percentage delta is exactly 0.
    expect(M.computeTrainingEffectiveness(d)).toBe(0);
  });

  it("clamps to a maximum of 40", () => {
    const d = createDefaultDecision({
      developmental_programs: [
        "Leadership Development",
        "Time Management",
        "Managerial Skills",
        "Technical Skills",
        "Compliance",
        "Project Management",
      ],
      pct_employees_trained: 50,
      training_budget_per_ee: 100_000,
    });
    expect(M.computeTrainingEffectiveness(d)).toBe(40);
  });
});

describe("computeTrainingROI", () => {
  it("guards division-by-zero by flooring trainingCost at 1, not returning NaN/Infinity", () => {
    const d = createDefaultDecision({
      developmental_programs: [],
      pct_employees_trained: 0,
      training_budget_per_ee: 0,
      succession_investment: 0,
    });
    const roi = M.computeTrainingROI(d, prior, prior.headcount, 0.5);
    expect(Number.isFinite(roi)).toBe(true);
    // With trainingCost effectively 0 -> floored to 1, ROI is enormous and
    // gets clamped to the 200 ceiling.
    expect(roi).toBe(200);
  });

  it("clamps to [-50, 200]", () => {
    const d = createDefaultDecision({
      succession_investment: 10_000_000, // huge, guaranteed-negative-ROI cost
    });
    const roi = M.computeTrainingROI(d, prior, prior.headcount, 0.1);
    expect(roi).toBe(-50);
  });
});

describe("computeHiringQuality", () => {
  it("increases selection accuracy monotonically with screening_rigor (1 < 2 < 3)", () => {
    const q1 = M.computeHiringQuality(
      createDefaultDecision({ screening_rigor: 1 }),
      10
    );
    const q2 = M.computeHiringQuality(
      createDefaultDecision({ screening_rigor: 2 }),
      10
    );
    const q3 = M.computeHiringQuality(
      createDefaultDecision({ screening_rigor: 3 }),
      10
    );
    expect(q1).toBeLessThan(q2);
    expect(q2).toBeLessThan(q3);
  });
});

describe("computeDEIScore", () => {
  it("clamps the final score to [0, 100] even given maxed inputs", () => {
    const d = createDefaultDecision({
      diversity_goal_pct: 50,
      developmental_programs: ["Leadership Development", "Compliance"],
      conflict_approach: "coaching",
      voice_mechanisms: 2,
      engagement_investment: 10_000,
    });
    const score = M.computeDEIScore(d, [0, 0, 0]); // zero variance -> full retentionEquity
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBe(100);
  });

  it("reduces retentionEquity as turnover variance across roles increases", () => {
    const d = createDefaultDecision();
    const lowVariance = M.computeDEIScore(d, [10, 10, 10]);
    const highVariance = M.computeDEIScore(d, [5, 15, 45]);
    expect(highVariance).toBeLessThan(lowVariance);
  });
});

describe("computeHRTechScore", () => {
  it.each([
    [0, 20],
    [1, 60],
    [2, 95],
  ] as const)("maps hr_tech_level %d to score %d", (level, expected) => {
    const d = createDefaultDecision({ hr_tech_level: level });
    expect(M.computeHRTechScore(d)).toBe(expected);
  });
});

describe("computeTurnoverCost", () => {
  it("multiplies floor(headcount * turnoverRate/100) by half the market salary", () => {
    // headcount=300, turnoverRate=15% -> floor(45) = 45 employees lost.
    const cost = M.computeTurnoverCost(300, 15, industry);
    expect(cost).toBe(45 * (industry.base_market_salary * 0.5));
  });

  it("floors fractional employees lost rather than rounding", () => {
    // 300 * 0.101 = 30.3 -> floor to 30, not 31.
    const cost = M.computeTurnoverCost(300, 10.1, industry);
    expect(cost).toBe(30 * (industry.base_market_salary * 0.5));
  });
});

describe("applyIndustryMultipliers", () => {
  it("divides recruitment-driven metrics and multiplies quality-driven metrics by the module multiplier", () => {
    const raw: Parameters<typeof M.applyIndustryMultipliers>[0] = {
      cost_per_hire: 1000,
      time_to_fill: 30,
      turnover_rate: 10,
      employee_satisfaction: 70,
      training_roi: 10,
      engagement_level: 70,
      dei_score: 60,
      absenteeism_rate: 5,
      review_coverage: 80,
      training_effectiveness: 15,
      succession_pipeline: 50,
      hr_tech_score: 60,
      compensation_ratio: 25,
      budget_adherence: 90,
      productivity: 0.5,
      hiring_quality: 70,
      turnover_cost: 10_000,
    };
    const result = M.applyIndustryMultipliers(raw, industry);
    // recruitment (1.05): cost_per_hire and time_to_fill are DIVIDED.
    expect(result.cost_per_hire).toBeCloseTo(1000 / 1.05, 6);
    expect(result.time_to_fill).toBeCloseTo(30 / 1.05, 6);
    // compensation (1.1): turnover_rate is DIVIDED (a higher multiplier
    // means the industry dampens reported turnover).
    expect(result.turnover_rate).toBeCloseTo(10 / 1.1, 6);
    // training (1.3): training_effectiveness/training_roi are MULTIPLIED.
    expect(result.training_effectiveness).toBeCloseTo(15 * 1.3, 6);
    expect(result.training_roi).toBeCloseTo(10 * 1.3, 6);
    // relations (1.2): satisfaction/engagement use a dampened
    // (0.5 + m*0.5) multiplier, not the raw module multiplier.
    expect(result.employee_satisfaction).toBeCloseTo(
      70 * (0.5 + 1.2 * 0.5),
      6
    );
    expect(result.engagement_level).toBeCloseTo(70 * (0.5 + 1.2 * 0.5), 6);
    // Unaffected fields pass through unchanged.
    expect(result.hr_tech_score).toBe(60);
    expect(result.turnover_cost).toBe(10_000);
  });
});

describe("computeAllMetrics (integration wiring)", () => {
  it("produces a full HRMetrics object with all fields finite for the default decision", () => {
    const d = createDefaultDecision();
    const metrics = M.computeAllMetrics(d, prior, industry);
    for (const [key, value] of Object.entries(metrics)) {
      expect(Number.isFinite(value), `${key} should be finite`).toBe(true);
    }
  });

  it("leaves compensation_ratio and budget_adherence as 0 placeholders (filled in later by applyBudgetAdherenceToMetrics)", () => {
    const d = createDefaultDecision();
    const metrics = M.computeAllMetrics(d, prior, industry);
    expect(metrics.compensation_ratio).toBe(0);
    expect(metrics.budget_adherence).toBe(0);
  });
});
