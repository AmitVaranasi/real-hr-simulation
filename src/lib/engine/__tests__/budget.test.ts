import { describe, expect, it } from "vitest";
import {
  computeBudgetBreakdown,
  computeCompensationBudgetSpend,
  computeKPICost,
  computeRecruitmentCost,
  computeTrainingSpend,
} from "../budget";
import { getIndustryConfig } from "../config";
import { createDefaultDecision, DISCRETIONARY_BUDGET } from "../defaults";
import { PROGRAM_COSTS } from "../programs";
import type { Decision } from "../types";

const industry = getIndustryConfig("Manufacturing");

describe("computeRecruitmentCost", () => {
  it("returns 0 when no positions are being filled", () => {
    const decision = createDefaultDecision({ positions_to_fill: [] });
    expect(computeRecruitmentCost(decision, industry)).toBe(0);
  });

  it("skips positions with count <= 0 (guard against negative/zero hires)", () => {
    const decision = createDefaultDecision({
      positions_to_fill: [{ role_id: "entry", count: 0 }],
    });
    expect(computeRecruitmentCost(decision, industry)).toBe(0);
  });

  it("skips positions referencing an unknown role_id instead of throwing", () => {
    const decision = createDefaultDecision({
      positions_to_fill: [{ role_id: "bogus", count: 3 }],
    });
    expect(computeRecruitmentCost(decision, industry)).toBe(0);
  });

  it("computes per-hire cost as (base + onboarding + screening) * diversity adder, times count", () => {
    const decision = createDefaultDecision({
      positions_to_fill: [{ role_id: "entry", count: 2 }],
      screening_rigor: 1,
      diversity_goal_pct: 0,
      onboarding_investment: 500,
    });
    // entry.recruitCostMult = 0.6; base = 55000 * 0.6 * 0.1 = 3300
    // perHire = 3300 + 500 + SCREENING_COST[1]=0 = 3800
    // diversity_goal_pct=0 -> diversityAdder = 0
    // total = 3800 * 2 = 7600
    expect(computeRecruitmentCost(decision, industry)).toBeCloseTo(7600, 6);
  });

  it("raises cost with higher screening rigor (tier 3 costs more than tier 1)", () => {
    const base = createDefaultDecision({
      positions_to_fill: [{ role_id: "professional", count: 1 }],
      diversity_goal_pct: 0,
    });
    const low = computeRecruitmentCost({ ...base, screening_rigor: 1 }, industry);
    const high = computeRecruitmentCost({ ...base, screening_rigor: 3 }, industry);
    expect(high).toBeGreaterThan(low);
  });

  it("adds a 15% diversity adder proportional to diversity_goal_pct", () => {
    const decision = createDefaultDecision({
      positions_to_fill: [{ role_id: "entry", count: 1 }],
      screening_rigor: 1,
      diversity_goal_pct: 20,
      onboarding_investment: 0,
    });
    // base = 55000*0.6*0.1 = 3300; perHire = 3300 (no onboarding, no screening cost)
    // diversityAdder = 3300 * (20/100) * 0.15 = 99
    // total = 3300 + 99 = 3399
    expect(computeRecruitmentCost(decision, industry)).toBeCloseTo(3399, 6);
  });

  it("sums cost across multiple distinct positions", () => {
    const single = (roleId: string, count: number) =>
      computeRecruitmentCost(
        createDefaultDecision({ positions_to_fill: [{ role_id: roleId, count }] }),
        industry
      );
    const combined = computeRecruitmentCost(
      createDefaultDecision({
        positions_to_fill: [
          { role_id: "entry", count: 2 },
          { role_id: "professional", count: 1 },
        ],
      }),
      industry
    );
    expect(combined).toBeCloseTo(single("entry", 2) + single("professional", 1), 6);
  });
});

describe("computeKPICost", () => {
  it("charges nothing when every criterion sits at or below the 5 baseline", () => {
    const decision = createDefaultDecision({
      role_performance: [
        { role_id: "entry", productivity: 5, teamwork: 5, leadership: 5, communication: 3 },
      ],
    });
    // avgCriteria = (5+5+5+3)/4 = 4.5 -> delta = max(0, 4.5-5) = 0
    expect(computeKPICost(decision, 100, 55_000)).toBe(0);
  });

  it("clamps delta at 0 via Math.max — never charges for below-baseline performance", () => {
    const decision = createDefaultDecision({
      role_performance: [
        { role_id: "entry", productivity: 1, teamwork: 1, leadership: 1, communication: 1 },
      ],
    });
    expect(computeKPICost(decision, 100, 55_000)).toBe(0);
  });

  it("charges proportionally to how far the average exceeds 5", () => {
    const decision = createDefaultDecision({
      role_performance: [
        { role_id: "entry", productivity: 9, teamwork: 9, leadership: 9, communication: 9 },
      ],
    });
    const headcount = 100;
    const marketSalary = 55_000;
    // entry role: defaultHeadcountPct=30 -> roleHc = round(100*0.3) = 30
    // avgCriteria = 9, delta = 4
    // costPerPoint = 55000 * 0.65 (entry mult) * 0.005 = 178.75
    // totalCost = 4 * 178.75 * 30 = 21450
    expect(computeKPICost(decision, headcount, marketSalary)).toBeCloseTo(21450, 6);
  });

  it("skips role_performance entries with an unknown role_id", () => {
    const decision = createDefaultDecision({
      role_performance: [
        { role_id: "unknown-role", productivity: 10, teamwork: 10, leadership: 10, communication: 10 },
      ],
    });
    expect(computeKPICost(decision, 100, 55_000)).toBe(0);
  });

  it("returns 0 for an empty role_performance list", () => {
    const decision = createDefaultDecision({ role_performance: [] });
    expect(computeKPICost(decision, 100, 55_000)).toBe(0);
  });
});

describe("computeTrainingSpend", () => {
  it("scales program cost and per-employee budget by the number of participants", () => {
    const decision = createDefaultDecision({
      developmental_programs: ["Technical Skills"], // cost 1000
      pct_employees_trained: 50,
      training_budget_per_ee: 200,
      succession_investment: 1000,
    });
    const headcount = 100;
    // participants = 100 * 0.5 = 50
    // programCost = 1000 (one program)
    // spend = 1000*50 + 200*50 + 1000 = 50000 + 10000 + 1000 = 61000
    expect(computeTrainingSpend(decision, headcount)).toBe(61000);
  });

  it("returns just succession_investment when 0% of employees are trained", () => {
    const decision = createDefaultDecision({
      developmental_programs: ["Technical Skills"],
      pct_employees_trained: 0,
      training_budget_per_ee: 500,
      succession_investment: 2500,
    });
    // participants = 0 -> programCost*0 + budget*0 + succession = 2500
    expect(computeTrainingSpend(decision, 100)).toBe(2500);
  });

  it("sums PROGRAM_COSTS across multiple selected programs", () => {
    const decision = createDefaultDecision({
      developmental_programs: ["Technical Skills", "Compliance"],
      pct_employees_trained: 10,
      training_budget_per_ee: 0,
      succession_investment: 0,
    });
    const headcount = 100; // participants = 10
    const expectedProgramCost =
      PROGRAM_COSTS["Technical Skills"] + PROGRAM_COSTS.Compliance;
    expect(computeTrainingSpend(decision, headcount)).toBe(expectedProgramCost * 10);
  });
});

describe("computeCompensationBudgetSpend", () => {
  it("returns exactly equity_level*10000 with no other compensation changes", () => {
    const decision = createDefaultDecision({
      role_compensation: [],
      benefits_pct: 10, // matches the 10 baseline in the formula -> no delta
      bonus_tier: 5, // matches the 5 baseline -> no delta
      equity_level: 2,
    });
    expect(computeCompensationBudgetSpend(decision, 100, 55_000)).toBe(20_000);
  });

  it("clamps the total at 0 via Math.max even when all deltas are negative", () => {
    const decision = createDefaultDecision({
      role_compensation: [],
      benefits_pct: 0, // below the 10 baseline -> negative benefitsDelta
      bonus_tier: 5,
      equity_level: 0,
    });
    expect(computeCompensationBudgetSpend(decision, 100, 55_000)).toBe(0);
  });

  it("uses the absolute value of salary_band so cuts and raises both add incremental cost", () => {
    const positiveBand = createDefaultDecision({
      role_compensation: [{ role_id: "entry", salary_band: 10 }],
      benefits_pct: 10,
      bonus_tier: 5,
      equity_level: 0,
    });
    const negativeBand = createDefaultDecision({
      role_compensation: [{ role_id: "entry", salary_band: -10 }],
      benefits_pct: 10,
      bonus_tier: 5,
      equity_level: 0,
    });
    const spendPositive = computeCompensationBudgetSpend(positiveBand, 100, 55_000);
    const spendNegative = computeCompensationBudgetSpend(negativeBand, 100, 55_000);
    expect(spendPositive).toBe(spendNegative);
    expect(spendPositive).toBeGreaterThan(0);
  });

  it("skips role_compensation entries with an unknown role_id", () => {
    const decision = createDefaultDecision({
      role_compensation: [{ role_id: "nope", salary_band: 20 }],
      benefits_pct: 10,
      bonus_tier: 5,
      equity_level: 0,
    });
    expect(computeCompensationBudgetSpend(decision, 100, 55_000)).toBe(0);
  });
});

describe("computeBudgetBreakdown", () => {
  it("sums the seven module spends into total_spend", () => {
    const decision = createDefaultDecision();
    const breakdown = computeBudgetBreakdown(decision, 300, industry.base_market_salary, industry);
    const sum =
      breakdown.recruitment_spend +
      breakdown.performance_spend +
      breakdown.training_spend +
      breakdown.relations_spend +
      breakdown.compensation_spend +
      breakdown.org_design_spend +
      breakdown.dei_spend;
    expect(breakdown.total_spend).toBeCloseTo(sum, 6);
  });

  it("adds budgetCarryover on top of the discretionary budget for available_budget", () => {
    const decision = createDefaultDecision();
    const breakdown = computeBudgetBreakdown(
      decision,
      300,
      industry.base_market_salary,
      industry,
      15_000
    );
    expect(breakdown.available_budget).toBe(DISCRETIONARY_BUDGET + 15_000);
  });

  it("computes remaining as available_budget minus total_spend (can go negative on overspend)", () => {
    const decision = createDefaultDecision();
    const breakdown = computeBudgetBreakdown(decision, 300, industry.base_market_salary, industry);
    expect(breakdown.remaining).toBeCloseTo(
      breakdown.available_budget - breakdown.total_spend,
      6
    );
  });

  it("gives adherence_pct exactly 100 when total_spend equals available_budget", () => {
    // Build a decision whose only spend is training, then dial succession_investment
    // to land total_spend exactly on the discretionary budget.
    const zeroSpendDecision: Decision = createDefaultDecision({
      positions_to_fill: [],
      role_performance: [],
      developmental_programs: [],
      pct_employees_trained: 0,
      training_budget_per_ee: 0,
      succession_investment: 0,
      engagement_investment: 0,
      flexibility_level: 0,
      voice_mechanisms: 0,
      role_compensation: [],
      benefits_pct: 10,
      bonus_tier: 5,
      equity_level: 0,
      hr_tech_level: 0,
      change_management_capability: "Minimal",
      collaboration_enablement: "Limited",
      dei_diverse_recruitment: "Minimal",
      dei_equity_practices: "Minimal",
      dei_inclusion_initiatives: "Minimal",
      dei_training_education: "Minimal",
      dei_accessibility_support: "Minimal",
      review_frequency: 1,
      feedback_360: false,
      conflict_approach: "disciplinary", // cheapest conflict config (1500)
    });
    const zeroBreakdown = computeBudgetBreakdown(
      zeroSpendDecision,
      300,
      industry.base_market_salary,
      industry
    );
    // Only relations_spend (CONFLICT_CONFIG.disciplinary.cost = 1500) remains nonzero.
    expect(zeroBreakdown.total_spend).toBe(1500);
    const exactDecision: Decision = {
      ...zeroSpendDecision,
      succession_investment: DISCRETIONARY_BUDGET - 1500,
    };
    const exactBreakdown = computeBudgetBreakdown(
      exactDecision,
      300,
      industry.base_market_salary,
      industry
    );
    expect(exactBreakdown.total_spend).toBe(DISCRETIONARY_BUDGET);
    expect(exactBreakdown.adherence_pct).toBe(100);
  });

  it("clamps adherence_pct at 0 for extreme overspend", () => {
    const decision = createDefaultDecision({
      succession_investment: DISCRETIONARY_BUDGET * 10,
    });
    const breakdown = computeBudgetBreakdown(decision, 300, industry.base_market_salary, industry);
    expect(breakdown.adherence_pct).toBe(0);
  });

  it("penalizes underspend symmetrically with overspend (adherence is based on |diff|)", () => {
    // Spend exactly half the budget vs. exactly double the budget: both are
    // 50% off, so adherence_pct should be identical.
    const half = createDefaultDecision({
      positions_to_fill: [],
      role_performance: [],
      developmental_programs: [],
      pct_employees_trained: 0,
      training_budget_per_ee: 0,
      succession_investment: DISCRETIONARY_BUDGET / 2 - 1500,
      engagement_investment: 0,
      flexibility_level: 0,
      voice_mechanisms: 0,
      role_compensation: [],
      benefits_pct: 10,
      bonus_tier: 5,
      equity_level: 0,
      hr_tech_level: 0,
      change_management_capability: "Minimal",
      collaboration_enablement: "Limited",
      dei_diverse_recruitment: "Minimal",
      dei_equity_practices: "Minimal",
      dei_inclusion_initiatives: "Minimal",
      dei_training_education: "Minimal",
      dei_accessibility_support: "Minimal",
      review_frequency: 1,
      feedback_360: false,
      conflict_approach: "disciplinary",
    });
    const double = createDefaultDecision({
      ...half,
      succession_investment: DISCRETIONARY_BUDGET * 1.5 - 1500,
    });
    const halfBreakdown = computeBudgetBreakdown(half, 300, industry.base_market_salary, industry);
    const doubleBreakdown = computeBudgetBreakdown(double, 300, industry.base_market_salary, industry);
    expect(halfBreakdown.adherence_pct).toBeCloseTo(50, 6);
    expect(doubleBreakdown.adherence_pct).toBeCloseTo(50, 6);
  });
});
