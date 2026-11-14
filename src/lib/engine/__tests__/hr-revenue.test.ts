import { describe, expect, it } from "vitest";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "../config";
import { createDefaultDecision } from "../defaults";
import { runSimulationWithTrace } from "../engine";
import { computeRevenue } from "../financials";
import { hrRevenueMultiplier } from "../hr-revenue";
import type { Industry } from "../types";

const INDUSTRIES: Industry[] = [
  "Manufacturing",
  "Service",
  "High-Tech",
  "Banking",
  "Retail",
];

describe("hrRevenueMultiplier", () => {
  const manufacturing = getIndustryConfig("Manufacturing");

  it("leaves revenue unchanged across the neutral band (60–74)", () => {
    for (const score of [60, 65, 70, 74]) {
      expect(hrRevenueMultiplier(score, manufacturing)).toBe(1);
    }
  });

  it("reaches the proposal's band values at each band's midpoint", () => {
    expect(hrRevenueMultiplier(20, manufacturing)).toBeCloseTo(0.94, 10);
    expect(hrRevenueMultiplier(50, manufacturing)).toBeCloseTo(0.97, 10);
    expect(hrRevenueMultiplier(82, manufacturing)).toBeCloseTo(1.04, 10);
    expect(hrRevenueMultiplier(95, manufacturing)).toBeCloseTo(1.08, 10);
  });

  it("stays within the table's range at the extremes", () => {
    expect(hrRevenueMultiplier(0, manufacturing)).toBe(0.94);
    expect(hrRevenueMultiplier(100, manufacturing)).toBe(1.08);
    expect(hrRevenueMultiplier(-5, manufacturing)).toBe(0.94);
    expect(hrRevenueMultiplier(140, manufacturing)).toBe(1.08);
    expect(hrRevenueMultiplier(Number.NaN, manufacturing)).toBe(0.94);
  });

  it.each(INDUSTRIES)(
    "%s: never falls as the score rises, and never jumps",
    (industry) => {
      const config = getIndustryConfig(industry);
      let previous = hrRevenueMultiplier(0, config);
      for (let score = 1; score <= 100; score++) {
        const current = hrRevenueMultiplier(score, config);
        expect(current).toBeGreaterThanOrEqual(previous);
        // One score point moves revenue by well under 1%.
        expect(current - previous).toBeLessThan(0.008);
        previous = current;
      }
    }
  );

  it("gives the same score a different effect in different industries", () => {
    expect(hrRevenueMultiplier(95, getIndustryConfig("High-Tech"))).toBeCloseTo(
      1.12,
      10
    );
    expect(hrRevenueMultiplier(95, getIndustryConfig("Retail"))).toBeCloseTo(
      1.07,
      10
    );
  });

  it("supports the fixed step table from the proposal", () => {
    expect(hrRevenueMultiplier(39, manufacturing, "bands")).toBe(0.94);
    expect(hrRevenueMultiplier(40, manufacturing, "bands")).toBe(0.97);
    expect(hrRevenueMultiplier(74, manufacturing, "bands")).toBe(1);
    expect(hrRevenueMultiplier(75, manufacturing, "bands")).toBe(1.04);
    expect(hrRevenueMultiplier(90, manufacturing, "bands")).toBe(1.08);
  });

  it("does not move revenue for an industry without a table", () => {
    expect(hrRevenueMultiplier(95, {})).toBe(1);
  });
});

describe("revenue follows HR performance", () => {
  it("matches the proposal's manufacturing example", () => {
    // $50M baseline, score 85-range multiplier 1.04×, Normal economy.
    const prior = priorStateFromIndustry("Manufacturing");
    const revenue = computeRevenue(
      prior,
      82,
      getIndustryConfig("Manufacturing"),
      "normal"
    );
    expect(revenue).toBeCloseTo(52_000_000, 4);
  });

  it.each(INDUSTRIES)(
    "%s: revenue is last round's revenue × HR multiplier × economy",
    (industry) => {
      const config = getIndustryConfig(industry);
      const prior = priorStateFromIndustry(industry);
      for (const [economy, factor] of [
        ["normal", 1],
        ["boom", 1.1],
        ["recession", 0.9],
      ] as const) {
        const { outcome, trace } = runSimulationWithTrace(
          createDefaultDecision(),
          prior,
          config,
          getStrategyConfig("Focus"),
          economy
        );
        const fc = trace.financial_cascade;
        // Service has a separate low-satisfaction rule; defaults do not trip it.
        expect(outcome.financial_metrics.revenue).toBeCloseTo(
          prior.revenue * fc.hr_revenue_multiplier! * factor,
          4
        );
      }
    }
  );

  it("the HR score does not depend on revenue or strategy (no circularity)", () => {
    const config = getIndustryConfig("Manufacturing");
    const run = (revenue: number, strategy: "Focus" | "Cost Leadership") =>
      runSimulationWithTrace(
        createDefaultDecision(),
        priorStateFromIndustry("Manufacturing", { revenue }),
        config,
        getStrategyConfig(strategy),
        "normal"
      ).trace.financial_cascade.hr_performance_score;

    expect(run(80_000_000, "Focus")).toBe(run(50_000_000, "Focus"));
    expect(run(50_000_000, "Cost Leadership")).toBe(run(50_000_000, "Focus"));
  });

  it("stronger HR decisions earn more revenue than weaker ones", () => {
    const config = getIndustryConfig("Manufacturing");
    const prior = priorStateFromIndustry("Manufacturing");
    const run = (overrides: Parameters<typeof createDefaultDecision>[0]) =>
      runSimulationWithTrace(
        createDefaultDecision(overrides),
        prior,
        config,
        getStrategyConfig("Focus"),
        "normal"
      );

    const weak = run({ engagement_investment: 0, hr_tech_level: 0 });
    const strong = run({ engagement_investment: 150_000, hr_tech_level: 2 });

    expect(
      strong.trace.financial_cascade.hr_performance_score!
    ).toBeGreaterThan(weak.trace.financial_cascade.hr_performance_score!);
    expect(strong.outcome.financial_metrics.revenue).toBeGreaterThanOrEqual(
      weak.outcome.financial_metrics.revenue
    );
  });
});
