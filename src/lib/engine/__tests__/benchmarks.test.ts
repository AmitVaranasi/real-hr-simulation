import { describe, expect, it } from "vitest";
import { benchmarksForPerspective, SCORING_BENCHMARKS } from "../benchmarks";

describe("benchmarksForPerspective", () => {
  it("filters to only the requested perspective", () => {
    const financial = benchmarksForPerspective("financial");
    expect(financial.length).toBe(
      SCORING_BENCHMARKS.filter((b) => b.perspective === "financial").length
    );
  });

  it("returns excellent/moderate/poor/weight/direction but not id or label", () => {
    const [first] = benchmarksForPerspective("employee");
    expect(first).not.toHaveProperty("id");
    expect(first).not.toHaveProperty("label");
    expect(first).toHaveProperty("excellent");
    expect(first).toHaveProperty("weight");
    expect(first).toHaveProperty("direction");
  });

  it("falls back to the built-in thresholds when no override is supplied", () => {
    const [trainingRoi] = benchmarksForPerspective("financial");
    // training_roi is first financial entry: excellent 20, moderate 7.5, poor 0.
    expect(trainingRoi.excellent).toBe(20);
    expect(trainingRoi.moderate).toBe(7.5);
    expect(trainingRoi.poor).toBe(0);
  });

  it("applies an override by benchmark id without touching weight or direction", () => {
    const overridden = benchmarksForPerspective("financial", {
      training_roi: { excellent: 25 },
    });
    const [trainingRoi] = overridden;
    expect(trainingRoi.excellent).toBe(25);
    // moderate/poor not overridden — should still be the defaults.
    expect(trainingRoi.moderate).toBe(7.5);
    expect(trainingRoi.poor).toBe(0);
    expect(trainingRoi.weight).toBe(0.3);
    expect(trainingRoi.direction).toBe("higher");
  });

  it("ignores overrides keyed to a benchmark id outside the requested perspective", () => {
    // cost_per_hire belongs to "financial" — overriding it while asking for
    // "employee" benchmarks must have no effect on the employee list.
    const employee = benchmarksForPerspective("employee", {
      cost_per_hire: { excellent: 1 },
    });
    expect(employee.every((b) => b.excellent !== 1)).toBe(true);
  });

  it("returns an empty array for a perspective with no matching benchmarks", () => {
    // Cast bypasses the type system the way a bad DB value or query param might.
    expect(
      benchmarksForPerspective("nonexistent" as unknown as "financial")
    ).toEqual([]);
  });
});
