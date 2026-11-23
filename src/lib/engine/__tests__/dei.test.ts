import { describe, expect, it } from "vitest";
import { SCORING_BENCHMARKS } from "../benchmarks";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "../config";
import { createDefaultDecision } from "../defaults";
import { runSimulation } from "../engine";
import { computeDEICapability, computeDEIScore } from "../metrics";
import type { Decision, InvestmentLevel } from "../types";
import { ENGINE_VERSION } from "../version";

/** Engine v3 DEI and weighting rules (Prof. Cooper, 2026-11-23). */

const allLevels = (l: InvestmentLevel): Partial<Decision> => ({
  dei_diverse_recruitment: l,
  dei_equity_practices: l,
  dei_inclusion_initiatives: l,
  dei_training_education: l,
  dei_accessibility_support: l,
});

const EVEN_TURNOVER = [10, 10, 10, 10, 10];

function run(d: Partial<Decision>) {
  return runSimulation(
    createDefaultDecision(d),
    priorStateFromIndustry("Manufacturing"),
    getIndustryConfig("Manufacturing"),
    getStrategyConfig("Differentiation"),
    "normal"
  );
}

describe("DEI Score (engine v3)", () => {
  it("is raised by the DEI Initiatives levels", () => {
    const levels: InvestmentLevel[] = ["Minimal", "Basic", "Moderate", "Strong", "Advanced"];
    const scores = levels.map((l) =>
      computeDEIScore(createDefaultDecision(allLevels(l)), EVEN_TURNOVER)
    );
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]);
    }
  });

  it("gives diminishing returns at the top levels", () => {
    const at = (l: InvestmentLevel) =>
      computeDEIScore(createDefaultDecision(allLevels(l)), EVEN_TURNOVER);
    expect(at("Advanced") - at("Strong")).toBeLessThan(at("Basic") - at("Minimal"));
  });

  it("is no longer saturated: default decisions score well below 100", () => {
    const dei = run({}).hr_metrics.dei_score;
    expect(dei).toBeGreaterThan(30);
    expect(dei).toBeLessThan(80);
  });

  it("is near zero when every DEI-related input is at its lowest", () => {
    const low = computeDEIScore(
      createDefaultDecision({
        ...allLevels("Minimal"),
        diversity_goal_pct: 0,
        conflict_approach: "disciplinary",
        voice_mechanisms: 0,
        engagement_investment: 0,
        flexibility_level: 0,
      }),
      [0, 30, 0, 30, 0]
    );
    expect(low).toBeLessThan(15);
  });
});

describe("DEI is not counted twice", () => {
  it("DEI Training & Education feeds DEI Capability, not the DEI Score", () => {
    const base = createDefaultDecision({ dei_training_education: "Minimal" });
    const more = createDefaultDecision({ dei_training_education: "Advanced" });
    expect(computeDEIScore(more, EVEN_TURNOVER)).toBe(computeDEIScore(base, EVEN_TURNOVER));
    expect(computeDEICapability(more)).toBeGreaterThan(computeDEICapability(base));
  });

  it("the other DEI Initiatives feed the DEI Score, not DEI Capability", () => {
    const base = createDefaultDecision({
      ...allLevels("Minimal"),
      dei_training_education: "Moderate",
    });
    const more = createDefaultDecision({
      ...allLevels("Advanced"),
      dei_training_education: "Moderate",
    });
    expect(computeDEICapability(more)).toBe(computeDEICapability(base));
    expect(computeDEIScore(more, EVEN_TURNOVER)).toBeGreaterThan(
      computeDEIScore(base, EVEN_TURNOVER)
    );
  });
});

describe("scorecard weights (engine v3)", () => {
  it("weights the Employee metrics 25% each", () => {
    const employee = SCORING_BENCHMARKS.filter((b) => b.perspective === "employee");
    expect(employee.map((b) => b.weight)).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it("weights every perspective's metrics to a total of 1", () => {
    for (const p of ["financial", "employee", "process", "learning"] as const) {
      const total = SCORING_BENCHMARKS.filter((b) => b.perspective === p).reduce(
        (s, b) => s + b.weight,
        0
      );
      expect(total, p).toBeCloseTo(1, 9);
    }
  });

  it("is engine version 3", () => {
    expect(ENGINE_VERSION).toBe(3);
  });
});
