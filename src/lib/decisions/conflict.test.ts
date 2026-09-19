import { describe, expect, it } from "vitest";
import {
  classifyDecision,
  classifyField,
  conflictingFields,
  deepEqual,
  hasTrueConflicts,
} from "@/lib/decisions/conflict";

describe("deepEqual", () => {
  it("compares primitives", () => {
    expect(deepEqual(5, 5)).toBe(true);
    expect(deepEqual(5, 6)).toBe(false);
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual(true, false)).toBe(false);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it("compares arrays of objects order-sensitively but key-order-insensitively", () => {
    const a = [{ role_id: "r1", count: 2 }, { role_id: "r2", count: 1 }];
    const b = [{ count: 2, role_id: "r1" }, { role_id: "r2", count: 1 }];
    expect(deepEqual(a, b)).toBe(true);

    const reordered = [{ role_id: "r2", count: 1 }, { role_id: "r1", count: 2 }];
    expect(deepEqual(a, reordered)).toBe(false);
  });

  it("compares nested objects", () => {
    const a = { organizational_structure: "Flat", span_of_control: 8 };
    const b = { span_of_control: 8, organizational_structure: "Flat" };
    expect(deepEqual(a, b)).toBe(true);
    expect(deepEqual(a, { ...b, span_of_control: 9 })).toBe(false);
  });
});

describe("classifyField", () => {
  it("unchanged: base == mine == theirs", () => {
    expect(classifyField(5, 5, 5, true)).toBe("unchanged");
  });

  it("changed-by-me-only: I moved it, they didn't", () => {
    expect(classifyField(5, 10, 5, true)).toBe("changed-by-me-only");
  });

  it("changed-by-them-only: they moved it, I didn't", () => {
    expect(classifyField(5, 5, 10, true)).toBe("changed-by-them-only");
  });

  it("changed-by-both: both moved it to different values", () => {
    expect(classifyField(5, 10, 15, true)).toBe("changed-by-both");
  });

  it("identical edits: both moved it to the SAME value converges to unchanged", () => {
    expect(classifyField(5, 20, 20, true)).toBe("unchanged");
  });

  it("missing base + identical values classifies as unchanged", () => {
    expect(classifyField(undefined, 7, 7, false)).toBe("unchanged");
  });

  it("missing base + differing values classifies as a conflict (can't attribute)", () => {
    expect(classifyField(undefined, 7, 9, false)).toBe("changed-by-both");
  });

  it("handles array/object field values (positions_to_fill_json shape)", () => {
    const base = [{ role_id: "r1", count: 2 }];
    const mine = [{ role_id: "r1", count: 5 }];
    const theirs = [{ role_id: "r1", count: 2 }];
    expect(classifyField(base, mine, theirs, true)).toBe("changed-by-me-only");
  });
});

describe("classifyDecision", () => {
  const base = {
    diversity_goal_pct: 15,
    onboarding_investment: 500,
    positions_to_fill_json: [{ role_id: "r1", count: 2 }],
    org_design_json: { organizational_structure: "Flat", span_of_control: 8 },
  };

  it("classifies each field independently across a full row", () => {
    const mine = {
      ...base,
      diversity_goal_pct: 40, // I changed this
    };
    const theirs = {
      ...base,
      onboarding_investment: 999, // teammate changed this
    };

    const report = classifyDecision(base, mine, theirs);
    expect(report.diversity_goal_pct).toBe("changed-by-me-only");
    expect(report.onboarding_investment).toBe("changed-by-them-only");
    expect(report.positions_to_fill_json).toBe("unchanged");
    expect(report.org_design_json).toBe("unchanged");
  });

  it("flags a true conflict when both edited the same field differently", () => {
    const mine = { ...base, diversity_goal_pct: 40 };
    const theirs = { ...base, diversity_goal_pct: 25 };
    const report = classifyDecision(base, mine, theirs);
    expect(report.diversity_goal_pct).toBe("changed-by-both");
    expect(hasTrueConflicts(report)).toBe(true);
    expect(conflictingFields(report)).toEqual(["diversity_goal_pct"]);
  });

  it("no conflicts reported when nothing differs", () => {
    const report = classifyDecision(base, { ...base }, { ...base });
    expect(hasTrueConflicts(report)).toBe(false);
    expect(Object.values(report).every((c) => c === "unchanged")).toBe(true);
  });

  it("handles a null base (first-time save race) conservatively", () => {
    const mine = { onboarding_investment: 500 };
    const theirsSame = { onboarding_investment: 500 };
    const theirsDiff = { onboarding_investment: 700 };

    expect(classifyDecision(null, mine, theirsSame).onboarding_investment).toBe(
      "unchanged"
    );
    expect(classifyDecision(null, mine, theirsDiff).onboarding_investment).toBe(
      "changed-by-both"
    );
  });

  it("includes keys present only in mine or only in theirs", () => {
    const report = classifyDecision(
      { a: 1 },
      { a: 1, b: 2 },
      { a: 1, c: 3 }
    );
    expect(report.b).toBe("changed-by-me-only");
    expect(report.c).toBe("changed-by-them-only");
  });
});
