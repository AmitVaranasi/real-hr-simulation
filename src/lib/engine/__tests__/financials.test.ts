import { describe, expect, it } from "vitest";
import {
  applyBudgetAdherenceToMetrics,
  computeFinancials,
  computeRevenue,
  computeTotalCompensation,
} from "../financials";
import { computeAllMetrics } from "../metrics";
import { computeBudgetBreakdown } from "../budget";
import { getIndustryConfig, priorStateFromIndustry } from "../config";
import { createDefaultDecision } from "../defaults";
import { ROLE_GROUPS } from "../roles";
import type { HRMetrics } from "../types";

describe("computeTotalCompensation", () => {
  it("sums base pay + benefits + bonus across all role groups by headcount share", () => {
    const d = createDefaultDecision();
    const marketSalary = 55_000;
    const headcount = 300;
    // Manually derive the expected total for the "entry" role slice to pin
    // the per-role formula: hc * marketSalary * mult * (1 + band/100), then
    // benefits/bonus applied on TOTAL base pay (not per-role).
    const entry = ROLE_GROUPS.find((r) => r.id === "entry")!;
    const entryHc = Math.round(headcount * (entry.defaultHeadcountPct / 100));
    const entryBasePay = entryHc * marketSalary * entry.defaultMarketSalaryMult;

    let totalBasePay = 0;
    for (const rc of d.role_compensation) {
      const role = ROLE_GROUPS.find((r) => r.id === rc.role_id)!;
      const hc = Math.round(headcount * (role.defaultHeadcountPct / 100));
      totalBasePay += hc * marketSalary * role.defaultMarketSalaryMult;
    }
    expect(totalBasePay).toBeGreaterThan(entryBasePay);

    // default decision: salary_band 0, benefits_pct 10, bonus_tier 5
    const expected = totalBasePay * (1 + 0.1 + 0.05);
    expect(
      computeTotalCompensation(d, headcount, marketSalary)
    ).toBeCloseTo(expected, 5);
  });

  it("ignores role_compensation entries whose role_id is unknown", () => {
    const d = createDefaultDecision({
      role_compensation: [{ role_id: "not-a-real-role", salary_band: 0 }],
    });
    expect(computeTotalCompensation(d, 300, 55_000)).toBe(0);
  });

  it("scales base pay up/down with a positive/negative salary band", () => {
    const base = createDefaultDecision();
    const raised = createDefaultDecision({
      role_compensation: base.role_compensation.map((rc) => ({
        ...rc,
        salary_band: 20 as const,
      })),
    });
    const lowered = createDefaultDecision({
      role_compensation: base.role_compensation.map((rc) => ({
        ...rc,
        salary_band: -20 as const,
      })),
    });
    const baseComp = computeTotalCompensation(base, 300, 55_000);
    const raisedComp = computeTotalCompensation(raised, 300, 55_000);
    const loweredComp = computeTotalCompensation(lowered, 300, 55_000);
    expect(raisedComp).toBeGreaterThan(baseComp);
    expect(loweredComp).toBeLessThan(baseComp);
  });
});

describe("computeRevenue", () => {
  const prior = priorStateFromIndustry("Manufacturing");

  it("applies the 0.5 + productivity multiplier directly against prior revenue", () => {
    // At productivity=0.5 and full retention/normal economy, the formula
    // collapses to prior.revenue * (0.5+0.5) * 1 * 1 = prior.revenue.
    expect(computeRevenue(prior, 0.5, 100, "normal")).toBeCloseTo(
      prior.revenue,
      5
    );
    // At productivity=0, the multiplier is 0.5 -> half of prior revenue.
    expect(computeRevenue(prior, 0, 100, "normal")).toBeCloseTo(
      prior.revenue * 0.5,
      5
    );
  });

  it("clamps the retention factor to a 0.5-1.0 floor/ceiling", () => {
    // retention=40% -> retention/100=0.4, clamped up to the 0.5 floor, so
    // this must equal the result for retention=50%.
    const atFloor = computeRevenue(prior, 0.5, 50, "normal");
    const belowFloor = computeRevenue(prior, 0.5, 40, "normal");
    expect(belowFloor).toBeCloseTo(atFloor, 5);

    // retention=120% (data artifact) -> clamped down to the 1.0 ceiling,
    // must equal retention=100%.
    const atCeiling = computeRevenue(prior, 0.5, 100, "normal");
    const aboveCeiling = computeRevenue(prior, 0.5, 120, "normal");
    expect(aboveCeiling).toBeCloseTo(atCeiling, 5);
  });

  it("applies the economy revenue multiplier (boom > normal > recession)", () => {
    const boom = computeRevenue(prior, 0.5, 100, "boom");
    const normal = computeRevenue(prior, 0.5, 100, "normal");
    const recession = computeRevenue(prior, 0.5, 100, "recession");
    expect(boom).toBeGreaterThan(normal);
    expect(normal).toBeGreaterThan(recession);
    // Economy multipliers are 1.1 / 1.0 / 0.9 (see config.ts ECONOMY_MULTIPLIERS).
    expect(boom).toBeCloseTo(normal * 1.1, 5);
    expect(recession).toBeCloseTo(normal * 0.9, 5);
  });
});

describe("computeFinancials", () => {
  const industry = getIndustryConfig("Manufacturing");
  const prior = priorStateFromIndustry("Manufacturing");

  it("clamps resulting headcount to a 50-1000 floor/ceiling", () => {
    const d = createDefaultDecision({
      positions_to_fill: [{ role_id: "entry", count: 50 }],
    });
    const metrics = computeAllMetrics(d, prior, industry);
    const budget = computeBudgetBreakdown(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    const fin = computeFinancials(d, metrics, prior, industry, "normal", budget);
    // prior.headcount (300) + 50 hires - separations must stay well under 1000
    // for this scenario; assert the arithmetic is at least being applied
    // (not simply clamped away) by checking it's greater than the prior.
    expect(fin.headcount).toBeGreaterThan(prior.headcount);
    expect(fin.headcount).toBeLessThanOrEqual(1000);
    expect(fin.headcount).toBeGreaterThanOrEqual(50);
  });

  it("clamps revenue to [0.7x, 1.5x] of prior revenue regardless of how extreme the inputs are", () => {
    const d = createDefaultDecision();
    const budget = computeBudgetBreakdown(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    const terribleMetrics: HRMetrics = {
      ...computeAllMetrics(d, prior, industry),
      turnover_rate: 90,
      productivity: 0,
    };
    const fin = computeFinancials(
      d,
      terribleMetrics,
      prior,
      industry,
      "recession",
      budget
    );
    expect(fin.revenue).toBeGreaterThanOrEqual(prior.revenue * 0.7);
    expect(fin.revenue).toBeLessThanOrEqual(prior.revenue * 1.5);
  });

  it("applies a 5% Service-industry revenue penalty when satisfaction < 60, and only in Service", () => {
    const serviceIndustry = getIndustryConfig("Service");
    const servicePrior = priorStateFromIndustry("Service");
    const d = createDefaultDecision();
    const budget = computeBudgetBreakdown(
      d,
      servicePrior.headcount,
      serviceIndustry.base_market_salary,
      serviceIndustry
    );
    const baseMetrics: HRMetrics = {
      cost_per_hire: 5000,
      time_to_fill: 30,
      turnover_rate: 10,
      employee_satisfaction: 59,
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
      productivity: 0.6,
      hiring_quality: 70,
      turnover_cost: 100_000,
    };
    const finLowSat = computeFinancials(
      d,
      baseMetrics,
      servicePrior,
      serviceIndustry,
      "normal",
      budget
    );
    const finHighSat = computeFinancials(
      d,
      { ...baseMetrics, employee_satisfaction: 60 },
      servicePrior,
      serviceIndustry,
      "normal",
      budget
    );
    // 60 is the threshold, so satisfaction=60 does NOT get the penalty
    // (condition is strictly `< 60`); ratio should be exactly 0.95.
    expect(finLowSat.revenue / finHighSat.revenue).toBeCloseTo(0.95, 5);

    // Same scenario in a non-Service industry must not apply the penalty.
    const mfgBudget = computeBudgetBreakdown(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    const finMfgLowSat = computeFinancials(
      d,
      baseMetrics,
      prior,
      industry,
      "normal",
      mfgBudget
    );
    const finMfgHighSat = computeFinancials(
      d,
      { ...baseMetrics, employee_satisfaction: 60 },
      prior,
      industry,
      "normal",
      mfgBudget
    );
    expect(finMfgLowSat.revenue).toBeCloseTo(finMfgHighSat.revenue, 5);
  });

  it("clamps stock_price to [1, 500] and market_share to [1, 40]", () => {
    const d = createDefaultDecision();
    const budget = computeBudgetBreakdown(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    const metrics = computeAllMetrics(d, prior, industry);
    const fin = computeFinancials(d, metrics, prior, industry, "normal", budget);
    expect(fin.stock_price).toBeGreaterThanOrEqual(1);
    expect(fin.stock_price).toBeLessThanOrEqual(500);
    expect(fin.market_share).toBeGreaterThanOrEqual(1);
    expect(fin.market_share).toBeLessThanOrEqual(40);
  });

  it("computes profit_margin as (profit/revenue)*100 when revenue > 0", () => {
    const d = createDefaultDecision();
    const budget = computeBudgetBreakdown(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    const metrics = computeAllMetrics(d, prior, industry);
    const fin = computeFinancials(d, metrics, prior, industry, "normal", budget);
    expect(fin.profit_margin).toBeCloseTo((fin.profit / fin.revenue) * 100, 6);
  });

  it("passes through total_budget_spent and turnover_cost from budget/metrics inputs", () => {
    const d = createDefaultDecision();
    const budget = computeBudgetBreakdown(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    const metrics = computeAllMetrics(d, prior, industry);
    const fin = computeFinancials(d, metrics, prior, industry, "normal", budget);
    expect(fin.total_budget_spent).toBe(budget.total_spend);
    expect(fin.turnover_cost).toBe(metrics.turnover_cost);
  });
});

describe("applyBudgetAdherenceToMetrics", () => {
  const industry = getIndustryConfig("Manufacturing");
  const prior = priorStateFromIndustry("Manufacturing");

  it("copies budget.adherence_pct onto metrics.budget_adherence", () => {
    const d = createDefaultDecision();
    const budget = computeBudgetBreakdown(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    const metrics = computeAllMetrics(d, prior, industry);
    const fin = computeFinancials(d, metrics, prior, industry, "normal", budget);
    const result = applyBudgetAdherenceToMetrics(metrics, budget, fin);
    expect(result.budget_adherence).toBe(budget.adherence_pct);
  });

  it("computes compensation_ratio as (total_compensation/revenue)*100 when revenue > 0", () => {
    const d = createDefaultDecision();
    const budget = computeBudgetBreakdown(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    const metrics = computeAllMetrics(d, prior, industry);
    const fin = computeFinancials(d, metrics, prior, industry, "normal", budget);
    const result = applyBudgetAdherenceToMetrics(metrics, budget, fin);
    expect(result.compensation_ratio).toBeCloseTo(
      (fin.total_compensation / fin.revenue) * 100,
      6
    );
  });

  it("guards division by zero: compensation_ratio is 0 when revenue <= 0", () => {
    const d = createDefaultDecision();
    const budget = computeBudgetBreakdown(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    const metrics = computeAllMetrics(d, prior, industry);
    const fin = computeFinancials(d, metrics, prior, industry, "normal", budget);
    const result = applyBudgetAdherenceToMetrics(
      metrics,
      budget,
      { ...fin, revenue: 0 }
    );
    expect(result.compensation_ratio).toBe(0);
  });
});
