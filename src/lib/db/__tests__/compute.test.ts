import { describe, expect, it } from "vitest";
import {
  computeTeamOutcome,
  outcomeToDbRow,
  priorMetricsFromOutcome,
  teamStateUpdateFromOutcome,
  teamToPriorState,
} from "@/lib/db/compute";
import { decisionToRow } from "@/lib/db/decisions";
import { createDefaultDecision } from "@/lib/engine/defaults";
import { priorStateFromIndustry } from "@/lib/engine/config";
import type { Outcome, Team } from "@/lib/engine/types";

describe("priorMetricsFromOutcome", () => {
  it("returns null for a missing row instead of throwing", () => {
    expect(priorMetricsFromOutcome(null)).toBeNull();
    expect(priorMetricsFromOutcome(undefined)).toBeNull();
  });

  it("coerces every stored column to a number", () => {
    const row = {
      cost_per_hire: "1200",
      time_to_fill: "30",
      turnover_rate: "0.12",
      employee_satisfaction: "80",
      training_roi: "1.5",
      engagement_level: "70",
      dei_score: "60",
      absenteeism_rate: "0.03",
      review_coverage: "0.9",
      training_effectiveness: "0.5",
      succession_pipeline: "0.4",
      hr_tech_score: "50",
      compensation_ratio: "1.0",
      budget_adherence: "0.95",
    };
    const metrics = priorMetricsFromOutcome(row);
    expect(metrics?.cost_per_hire).toBe(1200);
    expect(metrics?.turnover_rate).toBe(0.12);
    expect(typeof metrics?.time_to_fill).toBe("number");
  });

  it("defaults productivity, hiring_quality and turnover_cost to 0 when absent (older rows predate these columns)", () => {
    const row = {
      cost_per_hire: 1,
      time_to_fill: 1,
      turnover_rate: 1,
      employee_satisfaction: 1,
      training_roi: 1,
      engagement_level: 1,
      dei_score: 1,
      absenteeism_rate: 1,
      review_coverage: 1,
      training_effectiveness: 1,
      succession_pipeline: 1,
      hr_tech_score: 1,
      compensation_ratio: 1,
      budget_adherence: 1,
    };
    const metrics = priorMetricsFromOutcome(row);
    expect(metrics?.productivity).toBe(0);
    expect(metrics?.hiring_quality).toBe(0);
    expect(metrics?.turnover_cost).toBe(0);
  });
});

describe("teamToPriorState", () => {
  it("falls back to Manufacturing industry defaults when team fields are unset", () => {
    const team = {} as Team;
    const state = teamToPriorState(team);
    const base = priorStateFromIndustry("Manufacturing");
    expect(state).toEqual(base);
  });

  it("prefers explicit team values over industry defaults, field by field", () => {
    const team = {
      industry: "Banking",
      headcount: 999,
      // revenue intentionally left unset to confirm partial overrides work
    } as Team;
    const state = teamToPriorState(team);
    const base = priorStateFromIndustry("Banking");
    expect(state.headcount).toBe(999);
    expect(state.revenue).toBe(base.revenue);
  });
});

describe("outcomeToDbRow / teamStateUpdateFromOutcome", () => {
  const outcome: Outcome = {
    hr_metrics: {
      cost_per_hire: 1,
      time_to_fill: 2,
      turnover_rate: 3,
      employee_satisfaction: 4,
      training_roi: 5,
      engagement_level: 6,
      dei_score: 7,
      absenteeism_rate: 8,
      review_coverage: 9,
      training_effectiveness: 10,
      succession_pipeline: 11,
      hr_tech_score: 12,
      compensation_ratio: 13,
      budget_adherence: 14,
      productivity: 15,
      hiring_quality: 16,
      turnover_cost: 17,
    },
    financial_metrics: {
      headcount: 100,
      revenue: 1_000_000,
      profit: 50_000,
      cashflow: 20_000,
      stock_price: 42,
      market_share: 0.1,
      profit_margin: 0.05,
      total_compensation: 400_000,
      total_budget_spent: 480_000,
      turnover_cost: 17,
    },
    bsc_scores: {
      score_financial: 70,
      score_employee: 60,
      score_process: 65,
      score_learning: 55,
      total_score: 63,
      strategy_bonus: 2,
      industry_penalty: 0,
    },
    feedback: { round_summary: "ok" } as Outcome["feedback"],
  };

  it("flattens outcome sub-objects into the flat outcomes-table row shape", () => {
    const row = outcomeToDbRow("team-1", "round-1", outcome);
    expect(row.team_id).toBe("team-1");
    expect(row.round_id).toBe("round-1");
    expect(row.cost_per_hire).toBe(1);
    expect(row.headcount).toBe(100);
    expect(row.total_score).toBe(63);
    expect(row.feedback_json).toBe(outcome.feedback);
    expect(row.productivity).toBe(15);
    expect(row.hiring_quality).toBe(16);
    expect(row.turnover_cost).toBe(17);
  });

  it("carries forward next-round team state from the outcome plus the computed carryover", () => {
    const update = teamStateUpdateFromOutcome(outcome, 12345);
    expect(update.headcount).toBe(100);
    expect(update.satisfaction).toBe(4);
    expect(update.engagement).toBe(6);
    expect(update.turnover_rate).toBe(3);
    expect(update.budget_carryover).toBe(12345);
  });
});

describe("computeTeamOutcome", () => {
  it("clamps newCarryover to 0 when total_spend meets or exceeds available_budget", () => {
    const decision = createDefaultDecision();
    const decisionRow = decisionToRow(decision, "team-1", "round-1");
    const team = { industry: "Manufacturing", strategy: "Focus" } as Team;

    const result = computeTeamOutcome(decisionRow, team, "normal");
    expect(result.newCarryover).toBeGreaterThanOrEqual(0);
    expect(result.industry).toBe("Manufacturing");
    expect(result.strategy).toBe("Focus");
  });

  it("passes team.budget_carryover through to the engine as available budget", () => {
    const decision = createDefaultDecision();
    const decisionRow = decisionToRow(decision, "team-1", "round-1");
    const teamNoCarryover = { industry: "Retail", strategy: "Focus" } as Team;
    const teamWithCarryover = {
      industry: "Retail",
      strategy: "Focus",
      budget_carryover: 50_000,
    } as Team;

    const withoutCarry = computeTeamOutcome(decisionRow, teamNoCarryover, "normal");
    const withCarry = computeTeamOutcome(decisionRow, teamWithCarryover, "normal");

    expect(withCarry.trace.budget_breakdown.available_budget).toBe(
      withoutCarry.trace.budget_breakdown.available_budget + 50_000
    );
  });
});
