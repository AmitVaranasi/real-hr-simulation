import { afterEach, describe, expect, it } from "vitest";
import {
  attainableFor,
  hasAnyIndustryBenchmark,
  resolveIndustryBenchmark,
  setSystemIndustryBenchmarks,
  toDisplayScale,
  toPercent,
} from "../industry-benchmarks";

// This module holds mutable module-level state (systemBenchmarks). Reset it
// after every test so test order in the full suite can never matter — a
// leaked override here would silently change engine.golden.test.ts results.
afterEach(() => {
  setSystemIndustryBenchmarks(null);
});

describe("resolveIndustryBenchmark", () => {
  it("returns source 'none' for an unknown/empty industry key", () => {
    expect(resolveIndustryBenchmark(null).source).toBe("none");
    expect(resolveIndustryBenchmark(undefined).source).toBe("none");
    expect(resolveIndustryBenchmark("Not A Real Industry").source).toBe("none");
  });

  it("FIXED_INDUSTRY_BENCHMARKS is empty by design (Iteration 5 §3)", () => {
    // The doc's High-Tech figures are illustrative only — nothing should be
    // seeded, so every real industry resolves to "none" until the system
    // (or a future designer edit) supplies values.
    expect(resolveIndustryBenchmark("High-Tech").source).toBe("none");
    expect(resolveIndustryBenchmark("Manufacturing").source).toBe("none");
  });

  it("system benchmarks take priority over fixed ones when both exist", () => {
    setSystemIndustryBenchmarks({ "High-Tech": { overall: 60 } });
    const resolved = resolveIndustryBenchmark("High-Tech");
    expect(resolved.source).toBe("system");
    expect(resolved.values.overall).toBe(60);
  });

  it("treats an empty values object as absent, not as a usable benchmark", () => {
    setSystemIndustryBenchmarks({ "High-Tech": {} });
    expect(resolveIndustryBenchmark("High-Tech").source).toBe("none");
  });

  it("setSystemIndustryBenchmarks(null) clears any prior override", () => {
    setSystemIndustryBenchmarks({ Retail: { overall: 50 } });
    expect(resolveIndustryBenchmark("Retail").source).toBe("system");
    setSystemIndustryBenchmarks(null);
    expect(resolveIndustryBenchmark("Retail").source).toBe("none");
  });
});

describe("hasAnyIndustryBenchmark", () => {
  it("is false when neither system nor fixed tables carry values", () => {
    expect(hasAnyIndustryBenchmark()).toBe(false);
  });

  it("becomes true once a system benchmark is installed", () => {
    setSystemIndustryBenchmarks({ Banking: { financial: 40 } });
    expect(hasAnyIndustryBenchmark()).toBe(true);
  });

  it("stays false for a system table whose industries all map to {}", () => {
    setSystemIndustryBenchmarks({ Banking: {} });
    expect(hasAnyIndustryBenchmark()).toBe(false);
  });
});

describe("attainableFor", () => {
  it("overall is always 100 regardless of strategy", () => {
    expect(attainableFor("overall", "Focus")).toBe(100);
    expect(attainableFor("overall", null)).toBe(100);
  });

  it("returns null for an unrecognized strategy", () => {
    expect(attainableFor("employee", "Not A Strategy")).toBeNull();
    expect(attainableFor("employee", null)).toBeNull();
    expect(attainableFor("employee", undefined)).toBeNull();
  });

  it("reads the perspective weight from STRATEGY_CONFIGS.bsc_weights", () => {
    // Customer Intimacy weights employee at 35 (also asserted indirectly via
    // toDisplayScale in engine.golden.test.ts — this pins the raw number).
    expect(attainableFor("employee", "Customer Intimacy")).toBe(35);
  });
});

describe("toDisplayScale / toPercent round-trip", () => {
  it("toPercent inverts toDisplayScale", () => {
    const attainable = attainableFor("financial", "Innovation")!;
    const raw = toDisplayScale(80, attainable)!;
    expect(toPercent(raw, attainable)).toBeCloseTo(80);
  });

  it("toDisplayScale returns null when either input is missing", () => {
    expect(toDisplayScale(null, 30)).toBeNull();
    expect(toDisplayScale(80, undefined)).toBeNull();
  });

  it("toPercent returns null when attainable is zero (guards divide-by-zero)", () => {
    expect(toPercent(10, 0)).toBeNull();
  });

  it("toPercent returns null when raw is missing", () => {
    expect(toPercent(null, 30)).toBeNull();
    expect(toPercent(undefined, 30)).toBeNull();
  });
});
