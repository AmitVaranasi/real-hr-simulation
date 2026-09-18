import { describe, expect, it } from "vitest";
import { generateWarnings, validateDecision } from "../validation";
import { getIndustryConfig, priorStateFromIndustry } from "../config";
import { createDefaultDecision } from "../defaults";
import { computeBudgetBreakdown } from "../budget";
import type { Decision } from "../types";

// validateDecision has hardcoded, business-rule thresholds:
//   total hires: 0-50, diversity goal: 0-50%, pct trained: 0-50%,
//   benefits: 6-20%, bonus tier: exactly 5 | 10 | 15.
// These tests pin each boundary exactly (inclusive edges valid, one step
// outside invalid) so a future refactor can't silently loosen or tighten
// a rule without a failing test.

describe("validateDecision", () => {
  describe("total positions to fill (0-50)", () => {
    it("accepts 0 hires (lower bound)", () => {
      const d = createDefaultDecision({ positions_to_fill: [] });
      const result = validateDecision(d);
      expect(result.valid).toBe(true);
      expect(result.errors).not.toContain(
        "Total positions to fill must be between 0 and 50"
      );
    });

    it("accepts exactly 50 hires (upper bound)", () => {
      const d = createDefaultDecision({
        positions_to_fill: [{ role_id: "entry", count: 50 }],
      });
      const result = validateDecision(d);
      expect(result.errors).not.toContain(
        "Total positions to fill must be between 0 and 50"
      );
    });

    it("rejects 51 hires (one over upper bound)", () => {
      const d = createDefaultDecision({
        positions_to_fill: [{ role_id: "entry", count: 51 }],
      });
      const result = validateDecision(d);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Total positions to fill must be between 0 and 50"
      );
    });

    it("rejects a negative total (one under lower bound)", () => {
      const d = createDefaultDecision({
        positions_to_fill: [{ role_id: "entry", count: -1 }],
      });
      const result = validateDecision(d);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Total positions to fill must be between 0 and 50"
      );
    });
  });

  describe("diversity_goal_pct (0-50%)", () => {
    it("accepts the lower bound 0", () => {
      const d = createDefaultDecision({ diversity_goal_pct: 0 });
      expect(validateDecision(d).errors).not.toContain(
        "Diversity goal must be between 0% and 50%"
      );
    });

    it("accepts the upper bound 50", () => {
      const d = createDefaultDecision({ diversity_goal_pct: 50 });
      expect(validateDecision(d).errors).not.toContain(
        "Diversity goal must be between 0% and 50%"
      );
    });

    it("rejects -1", () => {
      const d = createDefaultDecision({ diversity_goal_pct: -1 });
      expect(validateDecision(d).errors).toContain(
        "Diversity goal must be between 0% and 50%"
      );
    });

    it("rejects 51", () => {
      const d = createDefaultDecision({ diversity_goal_pct: 51 });
      expect(validateDecision(d).errors).toContain(
        "Diversity goal must be between 0% and 50%"
      );
    });
  });

  describe("pct_employees_trained (0-50%)", () => {
    it("accepts the lower bound 0", () => {
      const d = createDefaultDecision({ pct_employees_trained: 0 });
      expect(validateDecision(d).errors).not.toContain(
        "% employees trained must be between 0% and 50%"
      );
    });

    it("accepts the upper bound 50", () => {
      const d = createDefaultDecision({ pct_employees_trained: 50 });
      expect(validateDecision(d).errors).not.toContain(
        "% employees trained must be between 0% and 50%"
      );
    });

    it("rejects -1", () => {
      const d = createDefaultDecision({ pct_employees_trained: -1 });
      expect(validateDecision(d).errors).toContain(
        "% employees trained must be between 0% and 50%"
      );
    });

    it("rejects 51", () => {
      const d = createDefaultDecision({ pct_employees_trained: 51 });
      expect(validateDecision(d).errors).toContain(
        "% employees trained must be between 0% and 50%"
      );
    });
  });

  describe("benefits_pct (6-20%)", () => {
    it("accepts the lower bound 6", () => {
      const d = createDefaultDecision({ benefits_pct: 6 });
      expect(validateDecision(d).errors).not.toContain(
        "Benefits percentage must be between 6% and 20%"
      );
    });

    it("accepts the upper bound 20", () => {
      const d = createDefaultDecision({ benefits_pct: 20 });
      expect(validateDecision(d).errors).not.toContain(
        "Benefits percentage must be between 6% and 20%"
      );
    });

    it("rejects 5 (one under lower bound)", () => {
      const d = createDefaultDecision({ benefits_pct: 5 });
      expect(validateDecision(d).errors).toContain(
        "Benefits percentage must be between 6% and 20%"
      );
    });

    it("rejects 21 (one over upper bound)", () => {
      const d = createDefaultDecision({ benefits_pct: 21 });
      expect(validateDecision(d).errors).toContain(
        "Benefits percentage must be between 6% and 20%"
      );
    });
  });

  describe("bonus_tier (must be exactly 5, 10, or 15)", () => {
    it.each([5, 10, 15] as const)("accepts %d", (tier) => {
      const d = createDefaultDecision({ bonus_tier: tier });
      expect(validateDecision(d).errors).not.toContain(
        "Bonus tier must be 5%, 10%, or 15%"
      );
    });

    it("rejects a value not in the allowed set (e.g. 7)", () => {
      // bonus_tier is typed as BonusTier, but validateDecision guards at
      // runtime too (e.g. data coming from storage/API); force an invalid
      // value past the type system to exercise that guard.
      const d = createDefaultDecision({
        bonus_tier: 7 as unknown as Decision["bonus_tier"],
      });
      const result = validateDecision(d);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Bonus tier must be 5%, 10%, or 15%"
      );
    });
  });

  it("accumulates multiple independent errors rather than short-circuiting", () => {
    const d = createDefaultDecision({
      positions_to_fill: [{ role_id: "entry", count: 51 }],
      diversity_goal_pct: 51,
      pct_employees_trained: 51,
      benefits_pct: 21,
      bonus_tier: 7 as unknown as Decision["bonus_tier"],
    });
    const result = validateDecision(d);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(5);
  });

  it("returns valid:true with no errors for the default decision", () => {
    const d = createDefaultDecision();
    const result = validateDecision(d);
    expect(result).toEqual({ valid: true, errors: [] });
  });
});

describe("generateWarnings", () => {
  const industry = getIndustryConfig("Manufacturing");
  const prior = priorStateFromIndustry("Manufacturing");

  it("warns on below-market compensation when weighted avg salary band < -10", () => {
    const d = createDefaultDecision({
      role_compensation: createDefaultDecision().role_compensation.map(
        (rc) => ({ ...rc, salary_band: -20 as const })
      ),
    });
    const warnings = generateWarnings(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    expect(
      warnings.some(
        (w) =>
          w.module === "Compensation" &&
          w.message.includes("Below-market salary bands")
      )
    ).toBe(true);
  });

  it("does not warn on below-market compensation at the default (band 0)", () => {
    const d = createDefaultDecision();
    const warnings = generateWarnings(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    expect(
      warnings.some((w) => w.message.includes("Below-market salary bands"))
    ).toBe(false);
  });

  it("warns on very low training coverage when 0 < pct_employees_trained < 15", () => {
    const d = createDefaultDecision({ pct_employees_trained: 10 });
    const warnings = generateWarnings(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    expect(
      warnings.some(
        (w) => w.module === "Training" && w.message.includes("Very low training")
      )
    ).toBe(true);
  });

  it("does not warn on training coverage when it is exactly 0 (rule requires > 0)", () => {
    // Rule is `pct_employees_trained > 0 && < 15`, so 0% (no training
    // program at all) is treated differently from "very low but present".
    const d = createDefaultDecision({ pct_employees_trained: 0 });
    const warnings = generateWarnings(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    expect(
      warnings.some((w) => w.message.includes("Very low training"))
    ).toBe(false);
  });

  it("does not warn on training coverage at 15% (upper bound is exclusive)", () => {
    const d = createDefaultDecision({ pct_employees_trained: 15 });
    const warnings = generateWarnings(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    expect(
      warnings.some((w) => w.message.includes("Very low training"))
    ).toBe(false);
  });

  it("warns when a budget module share is above the industry norm max (+1 tolerance)", () => {
    // Default decision spends heavily on training relative to Manufacturing's
    // training norm (max ~8%), so this fires with stock defaults.
    const d = createDefaultDecision();
    const warnings = generateWarnings(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    expect(
      warnings.some(
        (w) =>
          w.module === "Training" &&
          w.message.includes("significantly above industry norms")
      )
    ).toBe(true);
  });

  it("warns when a budget module share is below the industry norm min (-1 tolerance)", () => {
    // Default decision has salary_band 0 and bonus/benefits at market
    // baseline, so compensation_spend is $0 -> 0% share, well under
    // Manufacturing's compensation min (~60%).
    const d = createDefaultDecision();
    const budget = computeBudgetBreakdown(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    expect(budget.compensation_spend).toBe(0);
    const warnings = generateWarnings(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    expect(
      warnings.some(
        (w) =>
          w.module === "Compensation" &&
          w.message.includes("below industry minimums")
      )
    ).toBe(true);
  });

  // NOTE: suspected bug — benefits_pct (a Decision field validated to the
  // 6-20 range, representing benefits as a % of base pay) is compared
  // directly against industry_norms.benefits_pct_of_comp (min/max ~20-40),
  // a completely different scale. Since benefits_pct can never legally
  // exceed 20, `d.benefits_pct > max + 2` is unreachable for any valid
  // Decision, and `d.benefits_pct < min - 2` (min=20, so threshold 18) is
  // true for nearly every valid Decision (anything below 18%). The
  // "below industry norms" warning therefore fires almost unconditionally,
  // including for the stock default decision (benefits_pct: 10), while the
  // "above industry norms" warning can never fire. This test pins today's
  // (likely unintended) behavior rather than the presumably-intended rule.
  it("fires the low-benefits warning for the default decision (scale mismatch bug)", () => {
    const d = createDefaultDecision();
    expect(d.benefits_pct).toBe(10);
    const warnings = generateWarnings(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    expect(
      warnings.some((w) =>
        w.message.includes("Benefits level is below typical industry norms")
      )
    ).toBe(true);
  });

  it("never fires the high-benefits warning for any value in the valid benefits_pct range", () => {
    const d = createDefaultDecision({ benefits_pct: 20 });
    const warnings = generateWarnings(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    expect(
      warnings.some((w) => w.message.includes("reduce profitability"))
    ).toBe(false);
  });

  it("issues a critical warning and an overspend message when discretionary budget is exceeded", () => {
    const d = createDefaultDecision({
      positions_to_fill: [
        { role_id: "entry", count: 10 },
        { role_id: "professional", count: 10 },
        { role_id: "technical", count: 10 },
        { role_id: "manager", count: 10 },
        { role_id: "executive", count: 10 },
      ],
      training_budget_per_ee: 2000,
      succession_investment: 100_000,
      engagement_investment: 100_000,
    });
    const budget = computeBudgetBreakdown(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    expect(budget.remaining).toBeLessThan(0);

    const warnings = generateWarnings(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    const critical = warnings.filter((w) => w.severity === "critical");
    expect(critical.length).toBeGreaterThanOrEqual(2);
    expect(
      critical.some((w) => w.message.includes("over the discretionary"))
    ).toBe(true);
    expect(
      critical.some((w) => w.message.startsWith("Overspent discretionary budget by"))
    ).toBe(true);
  });

  it("does not duplicate a budget recommendation message that generateWarnings already produced", () => {
    // generateWarnings de-dupes generateBudgetRecommendations() output
    // against messages it has already pushed (`!warnings.some(w => w.message === msg)`).
    // The overspend message text differs between the two sources ("You are
    // over the discretionary..." vs "Overspent discretionary budget by...$"),
    // so this asserts there is no literal duplicate message string anywhere
    // in the warnings array for an overspend scenario.
    const d = createDefaultDecision({
      positions_to_fill: [
        { role_id: "entry", count: 10 },
        { role_id: "professional", count: 10 },
        { role_id: "technical", count: 10 },
        { role_id: "manager", count: 10 },
        { role_id: "executive", count: 10 },
      ],
      training_budget_per_ee: 2000,
      succession_investment: 100_000,
      engagement_investment: 100_000,
    });
    const warnings = generateWarnings(
      d,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    const messages = warnings.map((w) => w.message);
    expect(new Set(messages).size).toBe(messages.length);
  });
});
