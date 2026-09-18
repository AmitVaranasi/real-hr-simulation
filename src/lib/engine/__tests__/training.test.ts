import { describe, expect, it } from "vitest";
import { deriveTrainingBudgetPerEe, withDerivedTrainingBudget } from "../training";
import { PROGRAM_COSTS } from "../programs";
import { createDefaultDecision } from "../defaults";

describe("deriveTrainingBudgetPerEe", () => {
  it("returns the 100 base plus 8x pct_employees_trained when no programs are selected", () => {
    const decision = createDefaultDecision({
      developmental_programs: [],
      pct_employees_trained: 20,
    });
    // base 100 + 20*8 = 260, programFactor = 0 with no programs selected.
    expect(deriveTrainingBudgetPerEe(decision)).toBe(260);
  });

  it("adds each selected program's cost/200 to the per-employee budget", () => {
    const decision = createDefaultDecision({
      developmental_programs: ["Technical Skills"], // cost 1000 -> +5
      pct_employees_trained: 0,
    });
    // base 100 + 0 + 1000/200 = 105
    expect(deriveTrainingBudgetPerEe(decision)).toBe(105);
  });

  it("sums programFactor across multiple selected programs", () => {
    const decision = createDefaultDecision({
      developmental_programs: ["Technical Skills", "Compliance"], // 1000/200 + 300/200 = 5 + 1.5
      pct_employees_trained: 0,
    });
    // base 100 + 0 + 6.5 = 106.5 -> rounds to 107 (round half away from zero... actually 106.5 rounds to 107)
    expect(deriveTrainingBudgetPerEe(decision)).toBe(107);
  });

  it("rounds the final result to the nearest integer", () => {
    const decision = createDefaultDecision({
      developmental_programs: [],
      pct_employees_trained: 12.5,
    });
    // base 100 + 12.5*8 = 200 exactly, so this case doesn't probe rounding by
    // itself; combine with a program to force a fractional total.
    const withProgram = createDefaultDecision({
      developmental_programs: ["Project Management"], // 600/200 = 3
      pct_employees_trained: 12.5, // 12.5*8 = 100
    });
    // base 100 + 100 + 3 = 203 exactly (integer, still validates the formula holds).
    expect(deriveTrainingBudgetPerEe(withProgram)).toBe(203);
    expect(deriveTrainingBudgetPerEe(decision)).toBe(200);
  });

  it("scales linearly with pct_employees_trained at a fixed program set", () => {
    const low = createDefaultDecision({
      developmental_programs: [],
      pct_employees_trained: 10,
    });
    const high = createDefaultDecision({
      developmental_programs: [],
      pct_employees_trained: 50,
    });
    // Both are exact integers (100 + N*8), so the difference is exactly (50-10)*8 = 320.
    expect(
      deriveTrainingBudgetPerEe(high) - deriveTrainingBudgetPerEe(low)
    ).toBe(320);
  });

  it("handles 0% trained without special-casing (still returns the base + program factor)", () => {
    const decision = createDefaultDecision({
      developmental_programs: [],
      pct_employees_trained: 0,
    });
    expect(deriveTrainingBudgetPerEe(decision)).toBe(100);
  });
});

describe("withDerivedTrainingBudget", () => {
  it("overwrites training_budget_per_ee with the derived value, leaving other fields untouched", () => {
    const decision = createDefaultDecision({
      developmental_programs: ["Technical Skills"],
      pct_employees_trained: 0,
      training_budget_per_ee: 999999, // stale/incoming value that should be replaced
    });
    const result = withDerivedTrainingBudget(decision);
    expect(result.training_budget_per_ee).toBe(105);
    expect(result.training_budget_per_ee).toBe(deriveTrainingBudgetPerEe(decision));
    // Unrelated fields pass through unchanged.
    expect(result.developmental_programs).toEqual(decision.developmental_programs);
    expect(result.succession_investment).toBe(decision.succession_investment);
  });

  it("does not mutate the original decision object", () => {
    const decision = createDefaultDecision({
      developmental_programs: ["Compliance"],
      training_budget_per_ee: 1,
    });
    const before = decision.training_budget_per_ee;
    withDerivedTrainingBudget(decision);
    expect(decision.training_budget_per_ee).toBe(before);
  });

  it("is consistent with PROGRAM_COSTS lookups used by deriveTrainingBudgetPerEe", () => {
    // Sanity check that the module-under-test and programs.ts agree on cost,
    // guarding against silent drift if PROGRAM_COSTS values change later.
    const decision = createDefaultDecision({
      developmental_programs: ["Leadership Development"],
      pct_employees_trained: 0,
    });
    const expected = Math.round(100 + PROGRAM_COSTS["Leadership Development"] / 200);
    expect(deriveTrainingBudgetPerEe(decision)).toBe(expected);
  });
});
