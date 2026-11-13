import { describe, expect, it } from "vitest";
import {
  outcomeToBriefData,
  outcomesToRoundList,
} from "@/lib/results/workforce-brief-data";

const team = { name: "Market Leaders", industry: "Technology", strategy: "Focus" };

describe("outcomeToBriefData", () => {
  it("maps outcome columns onto the brief", () => {
    const brief = outcomeToBriefData(
      team,
      {
        total_score: 52.3,
        score_financial: 10.4,
        revenue: 50_117_000,
        engagement_level: 71.3,
        productivity: 0.82,
        total_compensation: 1_000_000,
        headcount: 20,
      },
      2
    );
    expect(brief.teamName).toBe("Market Leaders");
    expect(brief.roundNumber).toBe(2);
    expect(brief.totalScore).toBe(52.3);
    expect(brief.scoreFinancial).toBe(10.4);
    expect(brief.revenue).toBe(50_117_000);
    expect(brief.engagement).toBe(71.3);
    expect(brief.productivityIndex).toBe(0.82);
    expect(brief.averageSalary).toBe(50_000);
  });

  it("shows the instructor override in place of the computed score", () => {
    const brief = outcomeToBriefData(
      team,
      { total_score: 52.3, instructor_override: 60 },
      1
    );
    expect(brief.totalScore).toBe(60);
  });

  it("reports missing values as zero, never as sample data", () => {
    const brief = outcomeToBriefData(team, {}, 1);
    expect(brief.revenue).toBe(0);
    expect(brief.satisfaction).toBe(0);
    expect(brief.averageSalary).toBe(0);
  });
});

describe("outcomesToRoundList", () => {
  it("orders rounds and builds links with the caller's href", () => {
    const list = outcomesToRoundList(
      [
        { id: "o2", round_id: "r2", rounds: { round_number: 2, closed_at: "2026-08-14T12:00:00Z" } },
        { id: "o1", round_id: "r1", rounds: { round_number: 1, closed_at: null }, computed_at: "2026-07-31T12:00:00Z" },
      ],
      (roundId) => `/brief?round=${roundId}`
    );
    expect(list.map((r) => r.roundNumber)).toEqual([1, 2]);
    expect(list[0].href).toBe("/brief?round=r1");
    expect(list[0].dateLabel).toBe("Jul 31, 2026");
    expect(list[1].dateLabel).toBe("Aug 14, 2026");
  });
});
