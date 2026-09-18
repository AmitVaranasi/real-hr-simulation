import { describe, expect, it } from "vitest";
import { buildLeaderboard } from "../leaderboard";

describe("buildLeaderboard", () => {
  it("returns an empty leaderboard for no teams", () => {
    expect(buildLeaderboard([], [])).toEqual([]);
  });

  it("ranks teams with no outcome as a zero score, not omitted", () => {
    const teams = [
      { id: "a", name: "Alpha", industry: "Tech", strategy: "Focus" },
      { id: "b", name: "Beta", industry: null, strategy: null },
    ];
    const outcomes = [
      {
        team_id: "a",
        total_score: 80,
        instructor_override: null,
        revenue: 100,
        stock_price: 10,
      },
    ];
    const board = buildLeaderboard(teams, outcomes);
    expect(board).toHaveLength(2);
    const beta = board.find((e) => e.team_id === "b")!;
    expect(beta.latest_score).toBe(0);
    expect(beta.latest_revenue).toBe(0);
    expect(beta.latest_stock_price).toBe(0);
    // missing industry/strategy fall back to an em dash placeholder
    expect(beta.industry).toBe("—");
    expect(beta.strategy).toBe("—");
  });

  it("prefers instructor_override over total_score when both are present", () => {
    const teams = [{ id: "a", name: "Alpha", industry: "Tech", strategy: "Focus" }];
    const outcomes = [
      {
        team_id: "a",
        total_score: 50,
        instructor_override: 92,
        revenue: 100,
        stock_price: 10,
      },
    ];
    const [entry] = buildLeaderboard(teams, outcomes);
    expect(entry.latest_score).toBe(92);
    expect(entry.average_score).toBe(92);
  });

  it("sorts by latest_score descending and assigns sequential ranks", () => {
    const teams = [
      { id: "a", name: "Alpha", industry: "Tech", strategy: "Focus" },
      { id: "b", name: "Beta", industry: "Tech", strategy: "Focus" },
      { id: "c", name: "Gamma", industry: "Tech", strategy: "Focus" },
    ];
    const outcomes = [
      { team_id: "a", total_score: 60, instructor_override: null, revenue: 1, stock_price: 1 },
      { team_id: "b", total_score: 90, instructor_override: null, revenue: 1, stock_price: 1 },
      { team_id: "c", total_score: 75, instructor_override: null, revenue: 1, stock_price: 1 },
    ];
    const board = buildLeaderboard(teams, outcomes);
    expect(board.map((e) => e.team_id)).toEqual(["b", "c", "a"]);
    expect(board.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it("keeps input order for tied scores (stable sort, no arbitrary reshuffle)", () => {
    const teams = [
      { id: "a", name: "Alpha", industry: "Tech", strategy: "Focus" },
      { id: "b", name: "Beta", industry: "Tech", strategy: "Focus" },
      { id: "c", name: "Gamma", industry: "Tech", strategy: "Focus" },
    ];
    const outcomes = [
      { team_id: "a", total_score: 80, instructor_override: null, revenue: 1, stock_price: 1 },
      { team_id: "b", total_score: 80, instructor_override: null, revenue: 1, stock_price: 1 },
      { team_id: "c", total_score: 80, instructor_override: null, revenue: 1, stock_price: 1 },
    ];
    const board = buildLeaderboard(teams, outcomes);
    expect(board.map((e) => e.team_id)).toEqual(["a", "b", "c"]);
    expect(board.map((e) => e.rank)).toEqual([1, 2, 3]);
  });
});
