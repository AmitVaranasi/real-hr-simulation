import { describe, expect, it } from "vitest";
import { deadlineState, formatRemaining } from "../deadline";
import { nextActions, roundLifecycle } from "../next-actions";
import {
  attainableFor,
  resolveIndustryBenchmark,
  setSystemIndustryBenchmarks,
  toDisplayScale,
} from "@/lib/engine/industry-benchmarks";
import { rowToDecision } from "@/lib/engine/migrate-v1";

describe("decision deadline (Iteration 5 §7)", () => {
  const now = Date.UTC(2026, 7, 6, 12, 0, 0);

  it("gives a neutral state rather than a fabricated date", () => {
    expect(deadlineState(null, now).kind).toBe("unset");
    expect(deadlineState(undefined, now).remaining).toBe("—");
    expect(deadlineState("not a date", now).kind).toBe("unset");
  });

  it("counts down while the deadline is ahead", () => {
    const at = new Date(now + 2 * 86_400_000 + 14 * 3_600_000 + 35 * 60_000);
    const state = deadlineState(at.toISOString(), now);
    expect(state.kind).toBe("upcoming");
    expect(state.remaining).toBe("2d 14h 35m");
  });

  it("never shows a positive countdown once the deadline passes", () => {
    const at = new Date(now - 60_000);
    const state = deadlineState(at.toISOString(), now);
    expect(state.kind).toBe("passed");
    expect(state.remaining).toBe("Deadline passed");
  });

  it("drops units that have run out", () => {
    expect(formatRemaining(3 * 3_600_000 + 4 * 60_000)).toBe("3h 4m");
    expect(formatRemaining(90_000)).toBe("1m");
  });
});

describe("contextual next actions (Iteration 5 §11)", () => {
  const base = {
    sessionId: "s1",
    teamsSubmitted: 2,
    teamsTotal: 6,
    selectedTeamId: "t1",
    selectedTeamName: "Crazy Managers",
    openRoundId: "r1",
    latestClosedRoundId: null,
  };

  it("derives the lifecycle from round state", () => {
    expect(
      roundLifecycle({
        hasOpenRound: true,
        hasClosedRound: false,
        teamsSubmitted: 2,
        teamsTotal: 6,
      })
    ).toBe("deciding");
    expect(
      roundLifecycle({
        hasOpenRound: true,
        hasClosedRound: false,
        teamsSubmitted: 6,
        teamsTotal: 6,
      })
    ).toBe("awaiting-close");
    expect(
      roundLifecycle({
        hasOpenRound: false,
        hasClosedRound: true,
        teamsSubmitted: 0,
        teamsTotal: 6,
      })
    ).toBe("processed");
    expect(
      roundLifecycle({
        hasOpenRound: false,
        hasClosedRound: false,
        teamsSubmitted: 0,
        teamsTotal: 0,
      })
    ).toBe("no-round");
  });

  it("does not display every possible action simultaneously", () => {
    for (const lifecycle of [
      "no-round",
      "deciding",
      "awaiting-close",
      "processed",
    ] as const) {
      expect(nextActions({ ...base, lifecycle }).length).toBeLessThanOrEqual(3);
    }
  });

  it("prioritises by round state", () => {
    expect(nextActions({ ...base, lifecycle: "deciding" })[0].title).toBe(
      "Make HR Decisions"
    );
    expect(nextActions({ ...base, lifecycle: "awaiting-close" })[0].title).toBe(
      "Close Round"
    );
    expect(nextActions({ ...base, lifecycle: "processed" })[0].title).toBe(
      "View Round Insights"
    );
    expect(nextActions({ ...base, lifecycle: "no-round" })[0].title).toBe(
      "Open Round"
    );
  });

  it("omits team-scoped actions when no team is selected", () => {
    const actions = nextActions({
      ...base,
      lifecycle: "deciding",
      selectedTeamId: null,
      selectedTeamName: null,
    });
    expect(actions.some((a) => a.teamScoped)).toBe(false);
  });
});

describe("industry benchmarks (Iteration 5 §3)", () => {
  it("reports no source until values are supplied — never invents one", () => {
    setSystemIndustryBenchmarks(null);
    const resolved = resolveIndustryBenchmark("High-Tech");
    expect(resolved.source).toBe("none");
    expect(resolved.values.overall).toBeUndefined();
  });

  it("prefers the system-generated benchmark once it exists", () => {
    setSystemIndustryBenchmarks({ "High-Tech": { employee: 74 } });
    const resolved = resolveIndustryBenchmark("High-Tech");
    expect(resolved.source).toBe("system");
    expect(resolved.values.employee).toBe(74);
    setSystemIndustryBenchmarks(null);
  });

  it("converts a stored percent onto the strategy's own scale", () => {
    // Customer Intimacy weights Employee at 35, Focus at 25.
    expect(toDisplayScale(74, attainableFor("employee", "Customer Intimacy"))).toBeCloseTo(25.9);
    expect(toDisplayScale(74, attainableFor("employee", "Focus"))).toBeCloseTo(18.5);
    expect(attainableFor("overall", "Focus")).toBe(100);
  });
});

describe("decision schema detection", () => {
  it("treats the empty V2 defaults as a V1 row", () => {
    // migration-v2.sql defaults these to '[]', so presence proves nothing.
    const decision = rowToDecision({
      positions_to_fill_json: [],
      role_compensation_json: [],
      role_performance_json: [],
      positions_to_fill: 12,
    });
    expect(decision.positions_to_fill.length).toBeGreaterThan(0);
  });

  it("uses the V2 columns when they carry data", () => {
    const decision = rowToDecision({
      positions_to_fill_json: [{ role_id: "analyst", count: 3 }],
      role_compensation_json: [],
      positions_to_fill: 12,
    });
    expect(decision.positions_to_fill).toEqual([
      { role_id: "analyst", count: 3 },
    ]);
  });
});
