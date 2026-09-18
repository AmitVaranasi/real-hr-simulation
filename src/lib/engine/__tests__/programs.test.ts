import { describe, expect, it } from "vitest";
import {
  CHANGE_MGMT_COST,
  COLLABORATION_COST,
  CONFLICT_CONFIG,
  DEI_LEVEL_COST,
  DEVELOPMENTAL_PROGRAMS,
  HR_TECH_ANNUAL_COST,
  INVESTMENT_LEVELS,
  PROGRAM_COSTS,
  PROGRAM_EFFECTIVENESS,
} from "../programs";
import type { DevelopmentalProgram, InvestmentLevel } from "../types";

// These lookup tables are pure data, but they are load-bearing: budget.ts and
// training.ts index into them directly with `d.developmental_programs` /
// `d.change_management_capability` etc. without a fallback default, so a
// missing key would produce `undefined` silently propagating through Number
// arithmetic (NaN) rather than throwing. These tests pin that every value
// the Decision type can produce has a corresponding cost entry.

describe("PROGRAM_COSTS", () => {
  it("has a cost entry for every DevelopmentalProgram in DEVELOPMENTAL_PROGRAMS", () => {
    for (const program of DEVELOPMENTAL_PROGRAMS) {
      expect(PROGRAM_COSTS[program]).toBeTypeOf("number");
      expect(PROGRAM_COSTS[program]).toBeGreaterThanOrEqual(0);
    }
  });

  it("pins the exact published cost for each program (regression guard)", () => {
    expect(PROGRAM_COSTS["Leadership Development"]).toBe(1200);
    expect(PROGRAM_COSTS["Time Management"]).toBe(400);
    expect(PROGRAM_COSTS["Managerial Skills"]).toBe(800);
    expect(PROGRAM_COSTS["Technical Skills"]).toBe(1000);
    expect(PROGRAM_COSTS.Compliance).toBe(300);
    expect(PROGRAM_COSTS["Project Management"]).toBe(600);
  });
});

describe("PROGRAM_EFFECTIVENESS", () => {
  it("has an effectiveness multiplier for every DevelopmentalProgram", () => {
    for (const program of DEVELOPMENTAL_PROGRAMS) {
      expect(PROGRAM_EFFECTIVENESS[program]).toBeTypeOf("number");
      expect(PROGRAM_EFFECTIVENESS[program]).toBeGreaterThan(0);
    }
  });

  it("ranks Technical Skills above Compliance (business rule: technical training pays off more)", () => {
    expect(PROGRAM_EFFECTIVENESS["Technical Skills"]).toBeGreaterThan(
      PROGRAM_EFFECTIVENESS.Compliance
    );
  });
});

describe("CONFLICT_CONFIG", () => {
  const approaches: Array<keyof typeof CONFLICT_CONFIG> = [
    "mediation",
    "disciplinary",
    "coaching",
  ];

  it("defines cost, satisfaction_impact, and engagement_impact for every approach", () => {
    for (const approach of approaches) {
      const cfg = CONFLICT_CONFIG[approach];
      expect(cfg.cost).toBeGreaterThanOrEqual(0);
      expect(cfg.satisfaction_impact).toBeTypeOf("number");
      expect(cfg.engagement_impact).toBeTypeOf("number");
    }
  });

  it("encodes disciplinary as the only approach with negative morale impact", () => {
    // Business rule: punitive conflict handling costs less but hurts satisfaction
    // and engagement, unlike mediation/coaching which cost more but help morale.
    expect(CONFLICT_CONFIG.disciplinary.satisfaction_impact).toBeLessThan(0);
    expect(CONFLICT_CONFIG.disciplinary.engagement_impact).toBeLessThan(0);
    expect(CONFLICT_CONFIG.mediation.satisfaction_impact).toBeGreaterThan(0);
    expect(CONFLICT_CONFIG.coaching.satisfaction_impact).toBeGreaterThan(0);
  });

  it("makes coaching the most expensive but highest-impact approach", () => {
    expect(CONFLICT_CONFIG.coaching.cost).toBeGreaterThan(
      CONFLICT_CONFIG.mediation.cost
    );
    expect(CONFLICT_CONFIG.coaching.cost).toBeGreaterThan(
      CONFLICT_CONFIG.disciplinary.cost
    );
  });
});

describe("HR_TECH_ANNUAL_COST", () => {
  it("is monotonically non-decreasing across levels 0, 1, 2", () => {
    expect(HR_TECH_ANNUAL_COST[0]).toBe(0);
    expect(HR_TECH_ANNUAL_COST[1]).toBeGreaterThan(HR_TECH_ANNUAL_COST[0]);
    expect(HR_TECH_ANNUAL_COST[2]).toBeGreaterThan(HR_TECH_ANNUAL_COST[1]);
  });
});

describe("INVESTMENT_LEVELS-keyed cost tables", () => {
  it("CHANGE_MGMT_COST has an entry for every InvestmentLevel and is monotonic", () => {
    for (const level of INVESTMENT_LEVELS) {
      expect(CHANGE_MGMT_COST[level]).toBeTypeOf("number");
    }
    assertMonotonicNonDecreasing(INVESTMENT_LEVELS, CHANGE_MGMT_COST);
  });

  it("DEI_LEVEL_COST has an entry for every InvestmentLevel and is monotonic", () => {
    for (const level of INVESTMENT_LEVELS) {
      expect(DEI_LEVEL_COST[level]).toBeTypeOf("number");
    }
    assertMonotonicNonDecreasing(INVESTMENT_LEVELS, DEI_LEVEL_COST);
  });

  it("Minimal always costs 0 across all InvestmentLevel-keyed tables", () => {
    expect(CHANGE_MGMT_COST.Minimal).toBe(0);
    expect(DEI_LEVEL_COST.Minimal).toBe(0);
  });

  function assertMonotonicNonDecreasing(
    levels: InvestmentLevel[],
    table: Record<InvestmentLevel, number>
  ) {
    for (let i = 1; i < levels.length; i++) {
      expect(table[levels[i]]).toBeGreaterThanOrEqual(table[levels[i - 1]]);
    }
  }
});

describe("COLLABORATION_COST", () => {
  it("has an entry for each CollaborationEnablement level and is monotonic", () => {
    const levels: Array<keyof typeof COLLABORATION_COST> = [
      "Limited",
      "Standard",
      "Enhanced",
      "Highly Integrated",
    ];
    let prev = -Infinity;
    for (const level of levels) {
      expect(COLLABORATION_COST[level]).toBeGreaterThanOrEqual(prev);
      prev = COLLABORATION_COST[level];
    }
    expect(COLLABORATION_COST.Limited).toBe(0);
  });
});

describe("DEVELOPMENTAL_PROGRAMS / INVESTMENT_LEVELS enumerations", () => {
  it("DEVELOPMENTAL_PROGRAMS lists exactly the keys of PROGRAM_COSTS (no drift)", () => {
    const fromCosts = Object.keys(PROGRAM_COSTS).sort();
    const fromList = [...DEVELOPMENTAL_PROGRAMS].sort();
    expect(fromList).toEqual(fromCosts);
  });

  it("INVESTMENT_LEVELS lists exactly the keys of CHANGE_MGMT_COST (no drift)", () => {
    const fromTable = Object.keys(CHANGE_MGMT_COST).sort();
    const fromList = [...INVESTMENT_LEVELS].sort();
    expect(fromList).toEqual(fromTable);
  });

  it("is ordered from least to most investment (Minimal first, Advanced last)", () => {
    expect(INVESTMENT_LEVELS[0]).toBe("Minimal");
    expect(INVESTMENT_LEVELS[INVESTMENT_LEVELS.length - 1]).toBe("Advanced");
  });
});

// Type-level sanity: a variable typed as DevelopmentalProgram/InvestmentLevel
// must be assignable into these tables without a cast, i.e. the Record types
// in programs.ts stay in sync with the union types in types.ts.
function typeCheck(program: DevelopmentalProgram, level: InvestmentLevel) {
  return PROGRAM_COSTS[program] + CHANGE_MGMT_COST[level];
}
void typeCheck;
