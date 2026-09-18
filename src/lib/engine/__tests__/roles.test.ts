import { describe, expect, it } from "vitest";
import {
  ROLE_GROUPS,
  avgPerformanceCriteria,
  computeVariance,
  getRoleById,
  roleHeadcount,
  salaryBandToMarketPct,
  totalHires,
  weightedAvgSalaryBand,
} from "../roles";
import type { RoleCompensation, RolePerformance, SalaryBand } from "../types";

describe("getRoleById", () => {
  it("finds a known role group", () => {
    expect(getRoleById("entry")?.label).toBe("Entry-Level / Support");
  });

  it("returns undefined for an unknown id", () => {
    expect(getRoleById("nonexistent")).toBeUndefined();
  });
});

describe("roleHeadcount", () => {
  it("rounds total headcount by the role's default headcount pct", () => {
    // "professional" is 35% of headcount per ROLE_GROUPS.
    expect(roleHeadcount(100, "professional")).toBe(35);
  });

  it("rounds a half-integer result up (executive is 5% of headcount)", () => {
    // 10 * 0.05 (executive) = 0.5 -> Math.round rounds half away from zero -> 1.
    expect(roleHeadcount(10, "executive")).toBe(1);
  });

  it("returns 0 for an unknown role id instead of throwing", () => {
    expect(roleHeadcount(500, "made-up-role")).toBe(0);
  });

  it("returns 0 for zero headcount", () => {
    expect(roleHeadcount(0, "entry")).toBe(0);
  });
});

describe("totalHires", () => {
  it("sums counts across positions", () => {
    expect(
      totalHires([
        { role_id: "entry", count: 2 },
        { role_id: "professional", count: 3 },
      ])
    ).toBe(5);
  });

  it("returns 0 for an empty list", () => {
    expect(totalHires([])).toBe(0);
  });

  it("still sums negative counts (no clamping at this layer)", () => {
    // totalHires performs no validation; negative counts pass through as-is.
    expect(
      totalHires([
        { role_id: "entry", count: -1 },
        { role_id: "professional", count: 3 },
      ])
    ).toBe(2);
  });
});

describe("weightedAvgSalaryBand", () => {
  it("weights each role's salary band by its default headcount pct", () => {
    const roleCompensation: RoleCompensation[] = ROLE_GROUPS.map((r) => ({
      role_id: r.id,
      salary_band: 0 as SalaryBand,
    }));
    expect(weightedAvgSalaryBand(roleCompensation)).toBe(0);
  });

  it("computes a genuinely weighted average for mixed bands", () => {
    // entry (30%) at band -10, professional (35%) at band +10, rest at 0.
    const roleCompensation: RoleCompensation[] = [
      { role_id: "entry", salary_band: -10 as SalaryBand },
      { role_id: "professional", salary_band: 10 as SalaryBand },
      { role_id: "technical", salary_band: 0 as SalaryBand },
      { role_id: "manager", salary_band: 0 as SalaryBand },
      { role_id: "executive", salary_band: 0 as SalaryBand },
    ];
    const expected = (-10 * 30 + 10 * 35) / (30 + 35 + 15 + 15 + 5);
    expect(weightedAvgSalaryBand(roleCompensation)).toBeCloseTo(expected, 6);
  });

  it("returns 0 for an empty list (division-by-zero guard)", () => {
    expect(weightedAvgSalaryBand([])).toBe(0);
  });

  it("skips entries whose role_id is unknown rather than throwing", () => {
    const roleCompensation: RoleCompensation[] = [
      { role_id: "bogus", salary_band: 20 as SalaryBand },
      { role_id: "entry", salary_band: 0 as SalaryBand },
    ];
    expect(weightedAvgSalaryBand(roleCompensation)).toBe(0);
  });
});

describe("avgPerformanceCriteria", () => {
  it("averages a single criterion across role_performance entries", () => {
    const rolePerformance: RolePerformance[] = [
      { role_id: "entry", productivity: 4, teamwork: 5, leadership: 5, communication: 5 },
      { role_id: "manager", productivity: 8, teamwork: 5, leadership: 5, communication: 5 },
    ];
    expect(avgPerformanceCriteria(rolePerformance, "productivity")).toBe(6);
  });

  it("defaults to 5 when there is no performance data (division-by-zero guard)", () => {
    expect(avgPerformanceCriteria([], "productivity")).toBe(5);
  });
});

describe("salaryBandToMarketPct", () => {
  it("maps a 0 band to 100% of market", () => {
    expect(salaryBandToMarketPct(0 as SalaryBand)).toBe(100);
  });

  it("adds a negative band below market", () => {
    expect(salaryBandToMarketPct(-10 as SalaryBand)).toBe(90);
  });

  it("adds a positive band above market", () => {
    expect(salaryBandToMarketPct(20 as SalaryBand)).toBe(120);
  });
});

describe("computeVariance", () => {
  it("returns 0 for an empty array (division-by-zero guard)", () => {
    expect(computeVariance([])).toBe(0);
  });

  it("returns 0 for identical values", () => {
    expect(computeVariance([5, 5, 5])).toBe(0);
  });

  it("computes population variance (divides by n, not n-1)", () => {
    // values [2,4,6]: mean=4, squared diffs=[4,0,4], sum=8, /3 = 2.666...
    expect(computeVariance([2, 4, 6])).toBeCloseTo(8 / 3, 10);
  });
});
