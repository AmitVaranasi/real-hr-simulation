import { describe, expect, it } from "vitest";
import { createDefaultDecision } from "../defaults";
import {
  migrateV1RowToDecision,
  parseJsonColumn,
  rowToDecision,
} from "../migrate-v1";

// iteration5.test.ts already covers the hasV2Payload schema-detection logic
// (empty-array V2 defaults treated as V1, real V2 payload wins). This file
// focuses on the field-by-field mapping inside migrateV1RowToDecision and on
// parseJsonColumn, which iteration5 does not touch.

describe("migrateV1RowToDecision — empty/missing row", () => {
  it("fills every field from defaults when the row is empty", () => {
    const decision = migrateV1RowToDecision({});
    const base = createDefaultDecision();
    expect(decision.positions_to_fill).toEqual(base.positions_to_fill);
    expect(decision.screening_rigor).toBe(2);
    expect(decision.diversity_goal_pct).toBe(15);
    expect(decision.conflict_approach).toBe("mediation");
  });

  it("leaves id/team_id/round_id undefined and submitted_by/at null when absent", () => {
    const decision = migrateV1RowToDecision({});
    expect(decision.id).toBeUndefined();
    expect(decision.team_id).toBeUndefined();
    expect(decision.round_id).toBeUndefined();
    expect(decision.submitted_by).toBeNull();
    expect(decision.submitted_at).toBeNull();
    expect(decision.is_submitted).toBe(false);
  });

  it("legacy positions_to_fill of 0 keeps the default multi-role breakdown, not an empty array", () => {
    // legacyPositions > 0 gates the override — 0 (and absent) must fall
    // through to base.positions_to_fill rather than becoming [].
    const decision = migrateV1RowToDecision({ positions_to_fill: 0 });
    expect(decision.positions_to_fill).toEqual(
      createDefaultDecision().positions_to_fill
    );
  });
});

describe("migrateV1RowToDecision — legacy field mapping", () => {
  it("maps a positive legacy positions_to_fill onto a single 'professional' role", () => {
    const decision = migrateV1RowToDecision({ positions_to_fill: 7 });
    expect(decision.positions_to_fill).toEqual([
      { role_id: "professional", count: 7 },
    ]);
  });

  it("maps training_focus through programMap, defaulting unknown values to Technical Skills", () => {
    expect(
      migrateV1RowToDecision({ training_focus: "Leadership" }).developmental_programs
    ).toEqual(["Leadership Development"]);
    expect(
      migrateV1RowToDecision({ training_focus: "Soft Skills" }).developmental_programs
    ).toEqual(["Managerial Skills"]);
    expect(
      migrateV1RowToDecision({ training_focus: "Compliance" }).developmental_programs
    ).toEqual(["Compliance"]);
    expect(
      migrateV1RowToDecision({ training_focus: "Something Unmapped" })
        .developmental_programs
    ).toEqual(["Technical Skills"]);
  });

  it("derives conflict_approach from conflict_budget thresholds (<=2000 disciplinary, >=4500 coaching, else mediation)", () => {
    expect(
      migrateV1RowToDecision({ conflict_budget: 2000 }).conflict_approach
    ).toBe("disciplinary");
    expect(
      migrateV1RowToDecision({ conflict_budget: 4500 }).conflict_approach
    ).toBe("coaching");
    expect(
      migrateV1RowToDecision({ conflict_budget: 3000 }).conflict_approach
    ).toBe("mediation");
    // Boundary just inside each threshold.
    expect(
      migrateV1RowToDecision({ conflict_budget: 2001 }).conflict_approach
    ).toBe("mediation");
    expect(
      migrateV1RowToDecision({ conflict_budget: 4499 }).conflict_approach
    ).toBe("mediation");
  });

  it("derives a uniform salary_band from salary_vs_market_pct thresholds", () => {
    const bandFor = (pct: number) =>
      migrateV1RowToDecision({ salary_vs_market_pct: pct })
        .role_compensation[0]!.salary_band;
    expect(bandFor(80)).toBe(-20); // <=85
    expect(bandFor(90)).toBe(-10); // <=95
    expect(bandFor(100)).toBe(0); // in between: no band adjustment
    expect(bandFor(110)).toBe(10); // >=105
    expect(bandFor(120)).toBe(20); // >=115
  });

  it("applies the derived salary_band uniformly across every ROLE_GROUPS entry", () => {
    const decision = migrateV1RowToDecision({ salary_vs_market_pct: 80 });
    expect(decision.role_compensation.every((rc) => rc.salary_band === -20)).toBe(
      true
    );
    expect(decision.role_compensation.length).toBeGreaterThan(1);
  });

  it("normalizes bonus_pool_pct given as a fraction (<1) or already as a percent (>=1)", () => {
    // 0.08 -> 8% -> tier 10 (>=7). 8 (already percent) -> also tier 10.
    expect(migrateV1RowToDecision({ bonus_pool_pct: 0.08 }).bonus_tier).toBe(10);
    expect(migrateV1RowToDecision({ bonus_pool_pct: 8 }).bonus_tier).toBe(10);
  });

  it("bonus_tier thresholds: <7% -> 5, >=7% -> 10, >=12% -> 15", () => {
    expect(migrateV1RowToDecision({ bonus_pool_pct: 0.05 }).bonus_tier).toBe(5);
    expect(migrateV1RowToDecision({ bonus_pool_pct: 0.07 }).bonus_tier).toBe(10);
    expect(migrateV1RowToDecision({ bonus_pool_pct: 0.12 }).bonus_tier).toBe(15);
  });

  it("clamps benefits_pct derived from benefits_per_ee into [6, 20] and rounds it", () => {
    // benefits_per_ee / 55000 * 100, clamped to [6,20].
    expect(migrateV1RowToDecision({ benefits_per_ee: 0 }).benefits_pct).toBe(6);
    expect(migrateV1RowToDecision({ benefits_per_ee: 50_000 }).benefits_pct).toBe(20);
    // 3000 / 55000 * 100 ≈ 5.45 -> clamped up to 6, matching the default row.
    expect(migrateV1RowToDecision({}).benefits_pct).toBe(6);
    // 8250 / 55000 * 100 = 15 exactly, within range so unclamped.
    expect(migrateV1RowToDecision({ benefits_per_ee: 8250 }).benefits_pct).toBe(15);
  });

  it("coerces boolean-ish fields with Boolean()", () => {
    expect(migrateV1RowToDecision({ is_submitted: 1 }).is_submitted).toBe(true);
    expect(migrateV1RowToDecision({ is_submitted: 0 }).is_submitted).toBe(false);
    expect(migrateV1RowToDecision({ feedback_360: "yes" }).feedback_360).toBe(true);
  });

  it("passes through id/team_id/round_id/submitted_by/submitted_at when present", () => {
    const decision = migrateV1RowToDecision({
      id: "d1",
      team_id: "t1",
      round_id: "r1",
      submitted_by: "user-1",
      submitted_at: "2026-01-01T00:00:00Z",
    });
    expect(decision.id).toBe("d1");
    expect(decision.team_id).toBe("t1");
    expect(decision.round_id).toBe("r1");
    expect(decision.submitted_by).toBe("user-1");
    expect(decision.submitted_at).toBe("2026-01-01T00:00:00Z");
  });
});

describe("parseJsonColumn", () => {
  it("returns the fallback for null/undefined", () => {
    expect(parseJsonColumn(null, "fallback")).toBe("fallback");
    expect(parseJsonColumn(undefined, "fallback")).toBe("fallback");
  });

  it("parses a JSON string", () => {
    expect(parseJsonColumn("[1,2,3]", [] as number[])).toEqual([1, 2, 3]);
  });

  it("returns the fallback when the string is invalid JSON, without throwing", () => {
    expect(parseJsonColumn("{not json", "fallback")).toBe("fallback");
  });

  it("passes a non-string, non-null value through unchanged (already-parsed JSONB)", () => {
    const obj = { a: 1 };
    expect(parseJsonColumn(obj, {})).toBe(obj);
  });
});

describe("rowToDecision — V2 row shapes", () => {
  it("decodes org_design_json and dei_initiatives_json onto the base decision", () => {
    const decision = rowToDecision({
      positions_to_fill_json: [{ role_id: "entry", count: 1 }],
      org_design_json: JSON.stringify({
        organizational_structure: "Matrix",
        span_of_control: 9,
      }),
      dei_initiatives_json: JSON.stringify({ dei_diverse_recruitment: "High" }),
    });
    expect(decision.organizational_structure).toBe("Matrix");
    expect(decision.span_of_control).toBe(9);
    expect(decision.dei_diverse_recruitment).toBe("High");
    // Untouched DEI fields keep the (V1-mapped) base default.
    expect(decision.dei_equity_practices).toBe(
      createDefaultDecision().dei_equity_practices
    );
  });

  it("falls back to the bare span_of_control column when org_design_json omits it", () => {
    const decision = rowToDecision({
      positions_to_fill_json: [{ role_id: "entry", count: 1 }],
      span_of_control: 12,
    });
    expect(decision.span_of_control).toBe(12);
  });

  it("prefers conflict_approach/benefits_pct/bonus_tier columns over the V1-derived values when present", () => {
    const decision = rowToDecision({
      positions_to_fill_json: [{ role_id: "entry", count: 1 }],
      conflict_budget: 500, // would derive "disciplinary" if V1 mapping were used
      conflict_approach: "coaching",
      benefits_pct: 18,
      bonus_tier: 15,
    });
    expect(decision.conflict_approach).toBe("coaching");
    expect(decision.benefits_pct).toBe(18);
    expect(decision.bonus_tier).toBe(15);
  });

  it("falls back to the V1-derived conflict_approach when the V2 column is absent", () => {
    const decision = rowToDecision({
      positions_to_fill_json: [{ role_id: "entry", count: 1 }],
      conflict_budget: 500, // <=2000 -> disciplinary
    });
    expect(decision.conflict_approach).toBe("disciplinary");
  });
});
