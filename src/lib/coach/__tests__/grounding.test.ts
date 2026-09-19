import { describe, expect, it } from "vitest";
import {
  buildTeamCoachContext,
  filterOwnTeamRows,
  renderTeamCoachContext,
  type CoachDecisionRow,
  type CoachOutcomeRow,
} from "@/lib/coach/grounding";

describe("filterOwnTeamRows", () => {
  it("drops rows belonging to other teams", () => {
    const rows = [
      { team_id: "team-a", value: 1 },
      { team_id: "team-b", value: 2 },
      { team_id: "team-a", value: 3 },
    ];
    expect(filterOwnTeamRows(rows, "team-a")).toEqual([
      { team_id: "team-a", value: 1 },
      { team_id: "team-a", value: 3 },
    ]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterOwnTeamRows([{ team_id: "team-b" }], "team-a")).toEqual([]);
  });
});

describe("buildTeamCoachContext", () => {
  const team = { name: "Team A", industry: "High-Tech", strategy: "Innovation" };

  it("never includes another team's decisions or outcomes even if passed in", () => {
    const decisions: CoachDecisionRow[] = [
      { team_id: "team-a", round_id: "r1", round_number: 1, training_budget_per_ee: 800 },
      { team_id: "team-b", round_id: "r1", round_number: 1, training_budget_per_ee: 9999 },
    ];
    const outcomes: CoachOutcomeRow[] = [
      { team_id: "team-a", round_id: "r1", round_number: 1, total_score: 70 },
      { team_id: "team-b", round_id: "r1", round_number: 1, total_score: 5 },
    ];

    const ctx = buildTeamCoachContext(team, "team-a", decisions, outcomes);

    expect(ctx.rounds).toHaveLength(1);
    expect(ctx.rounds[0].decision?.training_budget_per_ee).toBe(800);
    expect(ctx.rounds[0].outcome?.total_score).toBe(70);

    const rendered = renderTeamCoachContext(ctx);
    expect(rendered).not.toContain("9999");
    expect(rendered).not.toContain("team-b");
  });

  it("drops fields outside the allowlist even when present on the row", () => {
    const decisions: CoachDecisionRow[] = [
      {
        team_id: "team-a",
        round_id: "r1",
        round_number: 1,
        submitted_by: "user-secret-id",
        internal_scoring_weight: 0.42,
      } as CoachDecisionRow,
    ];
    const outcomes: CoachOutcomeRow[] = [
      {
        team_id: "team-a",
        round_id: "r1",
        round_number: 1,
        total_score: 70,
        instructor_override: 999,
      } as CoachOutcomeRow,
    ];

    const ctx = buildTeamCoachContext(team, "team-a", decisions, outcomes);
    expect(ctx.rounds[0].decision).not.toHaveProperty("submitted_by");
    expect(ctx.rounds[0].decision).not.toHaveProperty("internal_scoring_weight");
    expect(ctx.rounds[0].outcome).not.toHaveProperty("instructor_override");
  });

  it("handles a team with no submitted rounds", () => {
    const ctx = buildTeamCoachContext(team, "team-a", [], []);
    expect(ctx.rounds).toEqual([]);
    expect(renderTeamCoachContext(ctx)).toContain("No submitted rounds yet");
  });

  it("carries learning insights from feedback_json for the round", () => {
    const outcomes: CoachOutcomeRow[] = [
      {
        team_id: "team-a",
        round_id: "r1",
        round_number: 1,
        total_score: 70,
        feedback_json: {
          insights: {
            went_well: ["Strong engagement score"],
            hurt_performance: [],
            next_round: [],
            causal_factors: ["Training coverage was low"],
          },
        },
      },
    ];
    const ctx = buildTeamCoachContext(team, "team-a", [], outcomes);
    expect(ctx.rounds[0].insights?.went_well).toEqual(["Strong engagement score"]);
    const rendered = renderTeamCoachContext(ctx);
    expect(rendered).toContain("Strong engagement score");
    expect(rendered).toContain("Training coverage was low");
  });
});
