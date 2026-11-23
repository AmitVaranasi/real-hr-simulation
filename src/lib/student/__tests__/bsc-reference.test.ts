import { describe, expect, it } from "vitest";
import { SCORING_BENCHMARKS } from "@/lib/engine/benchmarks";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "@/lib/engine/config";
import { createDefaultDecision } from "@/lib/engine/defaults";
import { runSimulationWithTrace } from "@/lib/engine/engine";
import type { Decision, Industry } from "@/lib/engine/types";
import {
  ALL_STRATEGIES,
  BSC_TABS,
  DECISION_AREA_LINKS,
  ORGANIZATIONAL_KPIS,
  SCORED_METRICS,
  SUPPORTING_METRICS,
  isBscTabSlug,
  sharedScoredMetrics,
  strategyWeights,
} from "@/lib/student/bsc-reference";

describe("scored metrics match the engine", () => {
  it("lists exactly the engine's scored metrics, perspectives and weights", () => {
    expect(
      SCORED_METRICS.map((m) => [m.id, m.perspective, m.weight, m.direction])
    ).toEqual(
      SCORING_BENCHMARKS.map((b) => [b.id, b.perspective, b.weight, b.direction])
    );
  });

  it("never presents a reported-only figure as scored", () => {
    const scored = new Set(SCORED_METRICS.map((m) => m.id));
    for (const m of [...SUPPORTING_METRICS, ...ORGANIZATIONAL_KPIS]) {
      expect(scored.has(m.id), m.id).toBe(false);
    }
    // Prof. Cooper (2026-11-13): profit and revenue stay out of the
    // Financial perspective.
    const financial = SCORED_METRICS.filter((m) => m.perspective === "financial").map(
      (m) => m.name
    );
    expect(financial).toEqual([
      "Training ROI",
      "Cost per Hire",
      "Compensation Ratio",
      "Budget Adherence",
    ]);
  });

  it("names the outcomes that are scored in two perspectives", () => {
    expect(sharedScoredMetrics()).toEqual([
      {
        name: "Turnover (as Retention and Turnover Rate)",
        perspectives: ["employee", "process"],
      },
    ]);
  });
});

describe("strategy weights", () => {
  it("are 25/25/25/25 for every strategy", () => {
    for (const s of ALL_STRATEGIES) {
      expect(strategyWeights(s), s).toEqual({
        financial: 25,
        employee: 25,
        process: 25,
        learning: 25,
      });
    }
    expect(strategyWeights("Focus")).toEqual({
      financial: 25,
      employee: 25,
      process: 25,
      learning: 25,
    });
    expect(strategyWeights("Unknown")).toBeNull();
    expect(strategyWeights(null)).toBeNull();
  });
});

describe("tabs", () => {
  it("has the five topics in order", () => {
    expect(BSC_TABS.map((t) => t.label)).toEqual([
      "BSC Overview",
      "The Four Perspectives",
      "Key HR Metrics",
      "How It Works in the Simulation",
      "Using the Results",
    ]);
    expect(isBscTabSlug("key-metrics")).toBe(true);
    expect(isBscTabSlug("nope")).toBe(false);
  });
});

/**
 * The decision-to-perspective table must only promise effects the engine
 * implements. Change each decision area's inputs a lot and see which scored
 * metrics actually move. Budget Adherence is left out: every area spends
 * budget, which the page states separately.
 */
const CHANGES: Record<string, Partial<Decision>> = {
  "Recruitment & Selection": {
    screening_rigor: 3,
    diversity_goal_pct: 40,
    onboarding_investment: 3000,
  },
  "Performance Management": {
    review_frequency: 4,
    feedback_360: true,
  },
  "Training & Development": {
    developmental_programs: [
      "Leadership Development",
      "Time Management",
      "Managerial Skills",
      "Technical Skills",
      "Compliance",
      "Project Management",
    ],
    pct_employees_trained: 90,
    succession_investment: 60000,
  },
  "Employee Relations": {
    engagement_investment: 20000,
    conflict_approach: "coaching",
    flexibility_level: 2,
    voice_mechanisms: 2,
  },
  "Compensation & Benefits": {
    benefits_pct: 20,
    bonus_tier: 15,
    equity_level: 2,
    hr_tech_level: 2,
  },
  "Org Design & Change": {
    organizational_structure: "Matrix",
    span_of_control: 10,
    process_focus: "Innovation",
    change_management_capability: "Advanced",
    collaboration_enablement: "Highly Integrated",
  },
  "DEI Initiatives": {
    dei_diverse_recruitment: "Advanced",
    dei_equity_practices: "Advanced",
    dei_inclusion_initiatives: "Advanced",
    dei_training_education: "Advanced",
    dei_accessibility_support: "Advanced",
  },
};

function scoredValues(decision: Decision, industry: Industry) {
  const { outcome } = runSimulationWithTrace(
    decision,
    priorStateFromIndustry(industry),
    getIndustryConfig(industry),
    getStrategyConfig("Focus"),
    "normal"
  );
  const m = outcome.hr_metrics;
  // Direct effects only: compensation is compared before it is divided by
  // revenue, because revenue itself responds to the HR score.
  const values: Record<string, number> = {
    training_roi: m.training_roi,
    cost_per_hire: m.cost_per_hire,
    compensation_ratio: outcome.financial_metrics.total_compensation,
    employee_satisfaction: m.employee_satisfaction,
    retention: 100 - m.turnover_rate,
    engagement_level: m.engagement_level,
    dei_score_employee: m.dei_score,
    time_to_fill: m.time_to_fill,
    turnover_rate: m.turnover_rate,
    absenteeism_rate: m.absenteeism_rate,
    review_coverage: m.review_coverage,
    training_effectiveness: m.training_effectiveness,
    succession_pipeline: m.succession_pipeline,
    hr_tech_score: m.hr_tech_score,
    dei_score_learning: m.dei_capability,
  };
  return values;
}

describe("decision-to-result table matches the engine", () => {
  it("covers all seven decision areas", () => {
    expect(DECISION_AREA_LINKS.map((d) => d.area)).toEqual(Object.keys(CHANGES));
  });

  it.each(DECISION_AREA_LINKS.map((d) => [d.area, d] as const))(
    "%s moves every metric the page lists for it",
    (area, link) => {
      const moved = new Set<string>();
      for (const industry of ["Manufacturing", "Retail"] as Industry[]) {
        const base = scoredValues(createDefaultDecision(), industry);
        const changed = scoredValues(createDefaultDecision(CHANGES[area]), industry);
        for (const id of Object.keys(base)) {
          if (Math.abs(base[id] - changed[id]) > 1e-9) moved.add(id);
        }
      }
      for (const id of link.moves) expect(moved.has(id), `${area}: ${id}`).toBe(true);
      // Areas shown as budget-only must really move no other scored metric.
      if (link.moves.length === 0) expect([...moved]).toEqual([]);
    }
  );
});
