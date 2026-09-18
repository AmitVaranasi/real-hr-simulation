import { describe, expect, it } from "vitest";
import { avg, fmtScore, pctDelta } from "../class-performance-data";

describe("avg", () => {
  it("averages plain numbers", () => {
    expect(avg([10, 20, 30])).toBe(20);
  });

  it("ignores null/undefined/NaN entries rather than propagating them", () => {
    expect(avg([10, null, 20, undefined, NaN, 30])).toBe(20);
  });

  it("returns null for an empty array instead of NaN", () => {
    expect(avg([])).toBeNull();
  });

  it("returns null when every value is null/undefined/NaN", () => {
    expect(avg([null, undefined, NaN])).toBeNull();
  });
});

describe("fmtScore", () => {
  it("formats a number to the default one decimal place", () => {
    expect(fmtScore(82.456)).toBe("82.5");
  });

  it("respects an explicit decimals count", () => {
    expect(fmtScore(82.456, 2)).toBe("82.46");
  });

  it("renders an em dash for null, undefined, and NaN", () => {
    expect(fmtScore(null)).toBe("—");
    expect(fmtScore(undefined)).toBe("—");
    expect(fmtScore(NaN)).toBe("—");
  });

  it("formats zero as 0.0, not the em dash fallback", () => {
    expect(fmtScore(0)).toBe("0.0");
  });
});

describe("pctDelta", () => {
  it("computes percent change between two values", () => {
    expect(pctDelta(110, 100)).toBe(10);
    expect(pctDelta(90, 100)).toBe(-10);
  });

  it("returns null when current or previous is null", () => {
    expect(pctDelta(null, 100)).toBeNull();
    expect(pctDelta(100, null)).toBeNull();
  });

  it("returns null instead of Infinity when previous is zero", () => {
    expect(pctDelta(50, 0)).toBeNull();
  });

  it("returns 0 when current equals previous (no false null)", () => {
    expect(pctDelta(50, 50)).toBe(0);
  });
});
