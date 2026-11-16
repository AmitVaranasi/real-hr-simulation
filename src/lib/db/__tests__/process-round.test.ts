import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decisionToRow } from "@/lib/db/decisions";
import { loadRoundStart } from "@/lib/db/compute";
import { processRound } from "@/lib/db/process-round";
import { ENGINE_VERSION } from "@/lib/engine/version";
import type { SimulationTrace } from "@/lib/engine/types";
import { priorStateFromIndustry } from "@/lib/engine/config";
import { createDefaultDecision } from "@/lib/engine/defaults";
import type { Team } from "@/lib/engine/types";

type Row = Record<string, unknown>;

/** Just enough of the Supabase query builder for processRound/loadRoundStart. */
function fakeDb(tables: Record<string, Row[]>) {
  const from = (table: string) => {
    const filters: Array<[string, unknown]> = [];
    let update: Row | null = null;
    const matches = (row: Row) => filters.every(([c, v]) => row[c] === v);
    const builder = {
      select: () => builder,
      eq: (column: string, value: unknown) => {
        filters.push([column, value]);
        return builder;
      },
      upsert: async (row: Row, opts: { onConflict: string }) => {
        const keys = opts.onConflict.split(",");
        const rows = (tables[table] ??= []);
        const i = rows.findIndex((r) => keys.every((k) => r[k] === row[k]));
        if (i >= 0) rows[i] = { ...rows[i], ...row };
        else rows.push({ ...row });
        return { error: null };
      },
      update: (values: Row) => {
        update = values;
        return builder;
      },
      then: (resolve: (v: { data: Row[]; error: null }) => void) => {
        const rows = (tables[table] ?? []).filter(matches);
        if (update) rows.forEach((r) => Object.assign(r, update));
        resolve({ data: rows, error: null });
      },
    };
    return builder;
  };
  return { from } as unknown as SupabaseClient;
}

const SESSION = "s1";
const rounds = [1, 2, 3].map((n) => ({
  id: `r${n}`,
  session_id: SESSION,
  round_number: n,
  economy_condition: "normal",
}));

function freshTeam(id: string, name: string): Row {
  return {
    id,
    name,
    session_id: SESSION,
    industry: "Manufacturing",
    strategy: "Focus",
    ...priorStateFromIndustry("Manufacturing"),
    budget_carryover: 0,
  };
}

function submitted(teamId: string, roundId: string, overrides = {}) {
  return decisionToRow(
    { ...createDefaultDecision(overrides), is_submitted: true },
    teamId,
    roundId,
    "user"
  );
}

describe("processRound", () => {
  it("gives identical results when a round is processed twice", async () => {
    const tables: Record<string, Row[]> = {
      rounds: rounds.map((r) => ({ ...r })),
      teams: [freshTeam("t1", "Alpha")],
      decisions: [
        submitted("t1", "r1", { bonus_tier: 10 }),
        submitted("t1", "r2", { hr_tech_level: 2 }),
      ],
      outcomes: [],
    };
    const db = fakeDb(tables);

    await processRound(db, SESSION, rounds[0]);
    const first = await processRound(db, SESSION, rounds[1]);
    const teamAfterFirst = { ...tables.teams[0] };

    const second = await processRound(db, SESSION, rounds[1]);
    expect(second.results[0].total_score).toBe(first.results[0].total_score);
    expect(tables.teams[0]).toEqual(teamAfterFirst);
  });

  it("does not rewind team state when an earlier round is re-processed", async () => {
    const tables: Record<string, Row[]> = {
      rounds: rounds.map((r) => ({ ...r })),
      teams: [freshTeam("t1", "Alpha")],
      decisions: [submitted("t1", "r1"), submitted("t1", "r2")],
      outcomes: [],
    };
    const db = fakeDb(tables);

    await processRound(db, SESSION, rounds[0]);
    await processRound(db, SESSION, rounds[1]);
    const afterRound2 = { ...tables.teams[0] };

    await processRound(db, SESSION, rounds[0]);
    expect(tables.teams[0]).toEqual(afterRound2);
  });

  it("scores only submitted decisions and reports the rest as skipped", async () => {
    const draft = decisionToRow(
      { ...createDefaultDecision(), is_submitted: false },
      "t2",
      "r1"
    );
    const tables: Record<string, Row[]> = {
      rounds: rounds.map((r) => ({ ...r })),
      teams: [
        freshTeam("t1", "Submitted"),
        freshTeam("t2", "Draft only"),
        freshTeam("t3", "Absent"),
      ],
      decisions: [submitted("t1", "r1"), draft],
      outcomes: [],
    };
    const db = fakeDb(tables);

    const { results, skipped } = await processRound(db, SESSION, rounds[0]);

    expect(results.map((r) => r.team_id)).toEqual(["t1"]);
    expect(skipped).toEqual([
      { team_id: "t2", team_name: "Draft only", reason: "draft" },
      { team_id: "t3", team_name: "Absent", reason: "no_decision" },
    ]);
    expect(tables.outcomes.map((o) => o.team_id)).toEqual(["t1"]);
  });
});

describe("processRound — scoring rule changes apply going forward", () => {
  /** Rewrites a stored result so it looks scored before versioning existed. */
  function asEarlierRules(outcome: Row) {
    const trace = { ...(outcome.trace_json as SimulationTrace) };
    delete trace.engine_version;
    outcome.trace_json = trace;
    outcome.total_score = 41.5;
    outcome.revenue = 12_345_678;
  }

  it("stamps new results with the current rules version", async () => {
    const tables: Record<string, Row[]> = {
      rounds: rounds.map((r) => ({ ...r })),
      teams: [freshTeam("t1", "Alpha")],
      decisions: [submitted("t1", "r1")],
      outcomes: [],
    };
    await processRound(fakeDb(tables), SESSION, rounds[0]);
    expect(
      (tables.outcomes[0].trace_json as SimulationTrace).engine_version
    ).toBe(ENGINE_VERSION);
  });

  it("keeps a result stored under earlier rules when its round is re-processed", async () => {
    const tables: Record<string, Row[]> = {
      rounds: rounds.map((r) => ({ ...r })),
      teams: [freshTeam("t1", "Alpha"), freshTeam("t2", "Late")],
      decisions: [submitted("t1", "r1")],
      outcomes: [],
    };
    const db = fakeDb(tables);
    await processRound(db, SESSION, rounds[0]);
    asEarlierRules(tables.outcomes[0]);
    const original = structuredClone(tables.outcomes[0]);
    const teamBefore = { ...tables.teams[0] };

    // A second team submits late; the round is processed again.
    tables.decisions.push(submitted("t2", "r1"));
    const { results, preserved } = await processRound(db, SESSION, rounds[0]);

    expect(preserved).toEqual([
      { team_id: "t1", team_name: "Alpha", total_score: 41.5 },
    ]);
    expect(results.map((r) => r.team_id)).toEqual(["t2"]);
    expect(tables.outcomes.find((o) => o.team_id === "t1")).toEqual(original);
    expect(tables.teams[0]).toEqual(teamBefore);
  });

  it("scores the next round with the current rules, starting from the kept result", async () => {
    const tables: Record<string, Row[]> = {
      rounds: rounds.map((r) => ({ ...r })),
      teams: [freshTeam("t1", "Alpha")],
      decisions: [submitted("t1", "r1"), submitted("t1", "r2")],
      outcomes: [],
    };
    const db = fakeDb(tables);
    await processRound(db, SESSION, rounds[0]);
    asEarlierRules(tables.outcomes[0]);

    const { results, preserved } = await processRound(db, SESSION, rounds[1]);

    expect(preserved).toEqual([]);
    expect(results.map((r) => r.team_id)).toEqual(["t1"]);
    const r2 = tables.outcomes.find((o) => o.round_id === "r2")!;
    const trace = r2.trace_json as SimulationTrace;
    expect(trace.engine_version).toBe(ENGINE_VERSION);
    // Round 2 revenue builds on the stored round 1 revenue, not a re-scored one.
    expect(Number(r2.revenue)).toBeCloseTo(
      12_345_678 * (trace.financial_cascade.hr_revenue_multiplier ?? NaN),
      0
    );
  });
});

describe("loadRoundStart", () => {
  it("starts a team that skipped a round from its last scored round", async () => {
    const tables: Record<string, Row[]> = {
      rounds: rounds.map((r) => ({ ...r })),
      teams: [freshTeam("t1", "Alpha")],
      decisions: [submitted("t1", "r1")],
      outcomes: [],
    };
    const db = fakeDb(tables);
    await processRound(db, SESSION, rounds[0]);
    const r1 = tables.outcomes[0];

    const { startTeam, priorMetrics } = await loadRoundStart(
      db,
      tables.teams[0] as unknown as Team,
      SESSION,
      3
    );

    expect(startTeam.headcount).toBe(r1.headcount);
    expect(startTeam.revenue).toBe(r1.revenue);
    expect(startTeam.satisfaction).toBe(r1.employee_satisfaction);
    expect(priorMetrics?.turnover_rate).toBe(r1.turnover_rate);
  });

  it("uses the industry baseline for a team's first round", async () => {
    const team = { ...freshTeam("t1", "Alpha"), headcount: 999 };
    const { startTeam, priorMetrics } = await loadRoundStart(
      fakeDb({ rounds: rounds.map((r) => ({ ...r })), outcomes: [] }),
      team as unknown as Team,
      SESSION,
      1
    );

    expect(startTeam.headcount).toBe(
      priorStateFromIndustry("Manufacturing").headcount
    );
    expect(startTeam.budget_carryover).toBe(0);
    expect(priorMetrics).toBeNull();
  });
});
