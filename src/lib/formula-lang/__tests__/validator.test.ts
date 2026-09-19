import { describe, expect, it } from "vitest";
import { parse } from "../parser";
import { validate } from "../validator";

const VARS = ["turnover", "satisfaction", "prior_turnover", "budget"];

function issuesOf(source: string, variables: readonly string[] = VARS) {
  const parsed = parse(source);
  if (!parsed.ok) throw new Error(`expected parse ok: ${parsed.error.message}`);
  return validate(parsed.ast, { variables });
}

describe("validate: identifiers", () => {
  it("accepts a formula using only whitelisted variables", () => {
    expect(issuesOf("turnover + satisfaction")).toEqual([]);
  });

  it("flags an unknown identifier", () => {
    const issues = issuesOf("turnovr + 1");
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("turnovr");
  });

  it("suggests the closest legal variable for a near-miss typo", () => {
    const issues = issuesOf("turnovr");
    expect(issues[0].message).toMatch(/Did you mean 'turnover'/);
  });

  it("does not suggest a wildly unrelated variable name", () => {
    const issues = issuesOf("zzzzzzzzzz");
    expect(issues[0].message).not.toMatch(/Did you mean/);
  });

  it("reports the identifier's column", () => {
    const issues = issuesOf("1 + bogus");
    expect(issues[0].col).toBe(5);
  });

  it("flags every unknown identifier, not just the first", () => {
    const issues = issuesOf("foo + bar");
    expect(issues).toHaveLength(2);
  });
});

describe("validate: functions", () => {
  it("accepts known functions with correct arity", () => {
    expect(issuesOf("clamp(turnover, 0, 100)")).toEqual([]);
    expect(issuesOf("min(1, 2, 3)")).toEqual([]);
    expect(issuesOf("round(turnover)")).toEqual([]);
    expect(issuesOf("round(turnover, 2)")).toEqual([]);
    expect(issuesOf("abs(turnover)")).toEqual([]);
  });

  it("flags an unknown function", () => {
    const issues = issuesOf("sqrt(turnover)");
    expect(issues.some((i) => i.message.includes("sqrt"))).toBe(true);
  });

  it("flags wrong arity for clamp", () => {
    const issues = issuesOf("clamp(turnover, 0)");
    expect(issues[0].message).toMatch(/exactly 3/);
  });

  it("flags wrong arity for abs", () => {
    const issues = issuesOf("abs(1, 2)");
    expect(issues[0].message).toMatch(/exactly 1/);
  });

  it("flags too few args for min", () => {
    const issues = issuesOf("min()");
    expect(issues[0].message).toMatch(/between 1 and 8/);
  });

  it("validates identifiers nested inside call arguments", () => {
    const issues = issuesOf("clamp(bogus, 0, 100)");
    expect(issues.some((i) => i.message.includes("bogus"))).toBe(true);
  });
});

describe("validate: literal division/modulo by zero", () => {
  it("flags division by literal zero", () => {
    const issues = issuesOf("turnover / 0");
    expect(issues[0].message).toMatch(/[Dd]ivision by literal zero/);
  });

  it("flags modulo by literal zero", () => {
    const issues = issuesOf("turnover % 0");
    expect(issues[0].message).toMatch(/[Mm]odulo by literal zero/);
  });

  it("does not flag division by a non-zero literal", () => {
    expect(issuesOf("turnover / 2")).toEqual([]);
  });

  it("does not flag division by a variable (cannot know statically)", () => {
    expect(issuesOf("turnover / budget")).toEqual([]);
  });

  it("does not flag 0/x (only the divisor matters)", () => {
    expect(issuesOf("0 / turnover")).toEqual([]);
  });
});

describe("validate: hostile identifiers", () => {
  it("treats __proto__ as an ordinary unknown identifier, not special", () => {
    const issues = issuesOf("__proto__");
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("__proto__");
  });

  it("treats constructor as an ordinary unknown identifier", () => {
    const issues = issuesOf("constructor + 1");
    expect(issues.some((i) => i.message.includes("constructor"))).toBe(true);
  });

  it("treats toString/valueOf/hasOwnProperty as ordinary unknown identifiers", () => {
    for (const name of ["toString", "valueOf", "hasOwnProperty"]) {
      const issues = issuesOf(name);
      expect(issues).toHaveLength(1);
    }
  });
});
