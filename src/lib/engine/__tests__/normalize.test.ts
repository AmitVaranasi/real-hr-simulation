import { describe, expect, it } from "vitest";
import {
  normalizeInverse,
  normalizeMetric,
  normalizeStandard,
} from "../normalize";

describe("normalizeStandard", () => {
  it("maps 0..max onto 0..1", () => {
    expect(normalizeStandard(0, 100)).toBe(0);
    expect(normalizeStandard(50, 100)).toBe(0.5);
    expect(normalizeStandard(100, 100)).toBe(1);
  });

  it("clamps rather than exceeding the band", () => {
    expect(normalizeStandard(150, 100)).toBe(1);
    expect(normalizeStandard(-10, 100)).toBe(0);
  });
});

describe("normalizeInverse", () => {
  it("rewards low values", () => {
    expect(normalizeInverse(0, 40)).toBe(1);
    expect(normalizeInverse(20, 40)).toBe(0.5);
    expect(normalizeInverse(40, 40)).toBe(0);
  });

  it("floors at zero once past max instead of going negative", () => {
    // A 90% turnover rate is worse than the 40% band's floor, but a negative
    // normalized score would drag a weighted total below what any other
    // metric can offset.
    expect(normalizeInverse(90, 40)).toBe(0);
  });
});

describe("normalizeMetric", () => {
  it("uses each metric's own band, not a shared 0..100", () => {
    // training_effectiveness tops out at 40, so 40 is a perfect score.
    expect(normalizeMetric(40, "training_effectiveness")).toBe(1);
    // The same raw 40 against a 0..100 metric is far from perfect.
    expect(normalizeMetric(40, "employee_satisfaction")).toBe(0.4);
  });

  it("inverts the cost and rate metrics", () => {
    expect(normalizeMetric(0, "turnover_rate")).toBe(1);
    expect(normalizeMetric(40, "turnover_rate")).toBe(0);
    expect(normalizeMetric(0, "cost_per_hire")).toBe(1);
    expect(normalizeMetric(15_000, "cost_per_hire")).toBe(0);
    expect(normalizeMetric(90, "time_to_fill")).toBe(0);
  });

  it("treats productivity as an already-normalized ratio", () => {
    expect(normalizeMetric(1, "productivity")).toBe(1);
    expect(normalizeMetric(0.75, "productivity")).toBe(0.75);
  });

  it("falls back to a percentage band for unknown metrics", () => {
    expect(normalizeMetric(42, "not_a_real_metric")).toBe(0.42);
    expect(normalizeMetric(250, "not_a_real_metric")).toBe(1);
  });

  it("never leaves the 0..1 range for any known metric", () => {
    const metrics = [
      "employee_satisfaction",
      "turnover_rate",
      "cost_per_hire",
      "time_to_fill",
      "compensation_ratio",
      "absenteeism_rate",
      "training_roi",
      "productivity",
    ];
    for (const m of metrics) {
      for (const v of [-1000, 0, 37, 1e6]) {
        const n = normalizeMetric(v, m);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(1);
      }
    }
  });
});
