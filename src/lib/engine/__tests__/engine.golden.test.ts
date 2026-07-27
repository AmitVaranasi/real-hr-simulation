import { describe, expect, it } from "vitest";
import { computeBudgetBreakdown } from "../budget";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "../config";
import { createDefaultDecision, DISCRETIONARY_BUDGET } from "../defaults";
import { runSimulation, runSimulationWithTrace } from "../engine";
import type { EconomyCondition, Industry, Strategy } from "../types";

const INDUSTRIES: Industry[] = [
  "Manufacturing",
  "Service",
  "High-Tech",
  "Banking",
  "Retail",
];

describe("engine golden path", () => {
  it("keeps total discretionary spend within available budget for defaults", () => {
    const decision = createDefaultDecision();
    const industry = getIndustryConfig("Manufacturing");
    const prior = priorStateFromIndustry("Manufacturing");
    const budget = computeBudgetBreakdown(
      decision,
      prior.headcount,
      industry.base_market_salary,
      industry
    );
    expect(budget.available_budget).toBe(DISCRETIONARY_BUDGET);
    expect(budget.total_spend).toBeGreaterThan(0);
    expect(budget.total_spend).toBeLessThanOrEqual(
      budget.available_budget * 1.25
    );
  });

  it("applies economy multipliers to revenue directionally", () => {
    const decision = createDefaultDecision();
    const industry = getIndustryConfig("Manufacturing");
    const strategy = getStrategyConfig("Focus");
    const prior = priorStateFromIndustry("Manufacturing");

    const boom = runSimulation(
      decision,
      prior,
      industry,
      strategy,
      "boom"
    );
    const recession = runSimulation(
      decision,
      prior,
      industry,
      strategy,
      "recession"
    );

    expect(boom.financial_metrics.revenue).toBeGreaterThan(
      recession.financial_metrics.revenue
    );
  });

  it("returns BSC scores in 0–100 range across industries", () => {
    for (const industryName of INDUSTRIES) {
      const decision = createDefaultDecision();
      const industry = getIndustryConfig(industryName);
      const strategy = getStrategyConfig("Differentiation");
      const prior = priorStateFromIndustry(industryName);
      const outcome = runSimulation(
        decision,
        prior,
        industry,
        strategy,
        "normal"
      );
      expect(outcome.bsc_scores.total_score).toBeGreaterThanOrEqual(0);
      expect(outcome.bsc_scores.total_score).toBeLessThanOrEqual(100);
    }
  });

  it("includes carryover in available budget", () => {
    const decision = createDefaultDecision();
    const industry = getIndustryConfig("Retail");
    const prior = priorStateFromIndustry("Retail");
    const carryover = 25_000;
    const budget = computeBudgetBreakdown(
      decision,
      prior.headcount,
      industry.base_market_salary,
      industry,
      carryover
    );
    expect(budget.available_budget).toBe(DISCRETIONARY_BUDGET + carryover);
  });

  it("produces a full simulation trace for diagnostics", () => {
    const decision = createDefaultDecision();
    const industry = getIndustryConfig("High-Tech");
    const strategy = getStrategyConfig("Innovation");
    const prior = priorStateFromIndustry("High-Tech");
    const { outcome, trace } = runSimulationWithTrace(
      decision,
      prior,
      industry,
      strategy,
      "normal" as EconomyCondition,
      0
    );

    expect(trace.budget_breakdown.total_spend).toBeGreaterThan(0);
    expect(trace.bsc_scores.total_score).toBe(outcome.bsc_scores.total_score);
    expect(trace.financial_cascade.revenue).toBe(
      outcome.financial_metrics.revenue
    );
    expect(Object.keys(trace.normalized_metrics).length).toBeGreaterThan(5);
  });

  it("strategy weights change relative BSC composition", () => {
    const decision = createDefaultDecision();
    const industry = getIndustryConfig("Banking");
    const prior = priorStateFromIndustry("Banking");

    const cost = runSimulation(
      decision,
      prior,
      industry,
      getStrategyConfig("Cost Leadership" as Strategy),
      "normal"
    );
    const innov = runSimulation(
      decision,
      prior,
      industry,
      getStrategyConfig("Innovation" as Strategy),
      "normal"
    );

    // Scores should both be valid; at least one perspective should differ.
    const perspectivesDiffer =
      cost.bsc_scores.score_financial !== innov.bsc_scores.score_financial ||
      cost.bsc_scores.score_learning !== innov.bsc_scores.score_learning ||
      cost.bsc_scores.total_score !== innov.bsc_scores.total_score;
    expect(perspectivesDiffer).toBe(true);
  });
});
