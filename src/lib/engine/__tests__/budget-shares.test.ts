import { describe, expect, it } from "vitest";
import { budgetModuleShares, budgetUtilizationPct } from "../budget-shares";
import type { BudgetBreakdown } from "../types";

function makeBudget(overrides: Partial<BudgetBreakdown> = {}): BudgetBreakdown {
  return {
    recruitment_spend: 0,
    performance_spend: 0,
    training_spend: 0,
    relations_spend: 0,
    compensation_spend: 0,
    org_design_spend: 0,
    dei_spend: 0,
    total_spend: 0,
    available_budget: 0,
    remaining: 0,
    adherence_pct: 0,
    ...overrides,
  };
}

describe("budgetModuleShares", () => {
  it("expresses each of the six BudgetModuleKey spends as a pct of total_spend", () => {
    const budget = makeBudget({
      recruitment_spend: 100,
      performance_spend: 200,
      training_spend: 300,
      relations_spend: 100,
      compensation_spend: 200,
      org_design_spend: 100,
      total_spend: 1000,
    });
    const shares = budgetModuleShares(budget);
    expect(shares.recruitment).toBe(10);
    expect(shares.performance).toBe(20);
    expect(shares.training).toBe(30);
    expect(shares.relations).toBe(10);
    expect(shares.compensation).toBe(20);
    expect(shares.org_design).toBe(10);
  });

  it("excludes dei_spend from BudgetModuleKey — the six shares need not sum to 100 when dei_spend > 0", () => {
    // dei is tracked separately from the six "module" categories (see
    // BudgetModuleKey in industry-norms.ts, which omits "dei" on purpose).
    // This pins that behavior so it isn't "fixed" into always summing to 100.
    const budget = makeBudget({
      recruitment_spend: 100,
      performance_spend: 100,
      training_spend: 100,
      relations_spend: 100,
      compensation_spend: 100,
      org_design_spend: 100,
      dei_spend: 400,
      total_spend: 1000,
    });
    const shares = budgetModuleShares(budget);
    const sixModuleSum =
      shares.recruitment +
      shares.performance +
      shares.training +
      shares.relations +
      shares.compensation +
      shares.org_design;
    expect(sixModuleSum).toBe(60); // not 100, because dei's 40% isn't represented
  });

  it("falls back to a divisor of 1 when total_spend is 0 (division-by-zero guard)", () => {
    const budget = makeBudget({ recruitment_spend: 50, total_spend: 0 });
    const shares = budgetModuleShares(budget);
    // total treated as 1 -> share = (50/1)*100 = 5000, not NaN/Infinity.
    expect(shares.recruitment).toBe(5000);
    expect(Number.isFinite(shares.recruitment)).toBe(true);
  });

  it("also guards a negative total_spend the same way as zero (falls back to divisor 1)", () => {
    // NOTE: total_spend should never realistically go negative since every
    // module spend is clamped >= 0 upstream, but computeBudgetBreakdown's
    // total_spend field carries no explicit non-negativity guarantee in its
    // type. Pinning current behavior: the `> 0` check in budgetModuleShares
    // treats any non-positive total (0 or negative) identically.
    const budget = makeBudget({ recruitment_spend: 50, total_spend: -10 });
    const shares = budgetModuleShares(budget);
    expect(shares.recruitment).toBe(5000);
  });
});

describe("budgetUtilizationPct", () => {
  it("returns total_spend as a pct of available_budget", () => {
    const budget = makeBudget({ total_spend: 250_000, available_budget: 500_000 });
    expect(budgetUtilizationPct(budget)).toBe(50);
  });

  it("can exceed 100 on overspend (no clamping, unlike adherence_pct)", () => {
    const budget = makeBudget({ total_spend: 750_000, available_budget: 500_000 });
    expect(budgetUtilizationPct(budget)).toBe(150);
  });

  it("returns 0 when available_budget is 0 (division-by-zero guard)", () => {
    const budget = makeBudget({ total_spend: 100, available_budget: 0 });
    expect(budgetUtilizationPct(budget)).toBe(0);
  });

  it("returns 0 when available_budget is negative", () => {
    const budget = makeBudget({ total_spend: 100, available_budget: -500 });
    expect(budgetUtilizationPct(budget)).toBe(0);
  });
});
