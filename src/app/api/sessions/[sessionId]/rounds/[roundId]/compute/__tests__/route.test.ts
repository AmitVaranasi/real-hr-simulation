import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHarness, authedContext } from "@/test/harness";

const harness = createHarness();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => harness.serverClient,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => harness.adminClient,
}));
vi.mock("@/lib/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth")>();
  return {
    ...actual,
    getAuthUser: harness.getAuthUser,
    requireInstructor: harness.requireInstructor,
  };
});

// The engine computation itself is covered elsewhere; this suite is about
// the route's auth/ownership/wiring behavior, so the heavy per-team math is
// stubbed to a fixed shape.
vi.mock("@/lib/db/compute", () => ({
  computeTeamOutcome: vi.fn(() => ({
    outcome: { bsc_scores: { total_score: 42 } },
    trace: {},
    newCarryover: {},
  })),
  outcomeToDbRow: vi.fn((teamId: string, roundId: string) => ({
    team_id: teamId,
    round_id: roundId,
  })),
  priorMetricsFromOutcome: vi.fn(() => null),
  teamStateUpdateFromOutcome: vi.fn(() => ({})),
}));
vi.mock("@/lib/db/simulation-config", () => ({
  withSimulationConfig: async (fn: () => unknown) => fn(),
}));

let POST: typeof import("@/app/api/sessions/[sessionId]/rounds/[roundId]/compute/route").POST;
beforeAll(async () => {
  ({ POST } = await import(
    "@/app/api/sessions/[sessionId]/rounds/[roundId]/compute/route"
  ));
});

beforeEach(() => {
  harness.reset();
});

const params = Promise.resolve({ sessionId: "session-1", roundId: "round-1" });

function req() {
  return new Request("http://localhost/api/sessions/session-1/rounds/round-1/compute", {
    method: "POST",
  });
}

describe("POST /api/sessions/[sessionId]/rounds/[roundId]/compute", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(req(), { params });
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(req(), { params });
    expect(res.status).toBe(403);
  });

  // NOTE: suspected bug — src/app/api/sessions/[sessionId]/rounds/[roundId]/compute/route.ts:20-26
  // The round lookup (`admin.from("rounds").select("*").eq("id", roundId).eq("session_id", sessionId)`)
  // never scopes by the caller's instructor_id, and no separate ownership check against
  // `sessions.instructor_id` is performed anywhere in this handler. Any authenticated
  // instructor — not just the session's owner — can trigger grade computation (and thus
  // mutate outcomes/teams) for ANY session's round, just by knowing or guessing its id.
  // Contrast with sibling routes rounds/route.ts and rounds/[roundId]/route.ts, which both
  // scope their session lookup with `.eq("instructor_id", user!.id)`. This test pins the
  // CURRENT (vulnerable) behavior: a non-owning instructor's request still succeeds.
  it("currently succeeds for a non-owning instructor — missing ownership check (see NOTE above)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-NOT-owner" }));
    harness.adminClient.queue("rounds", {
      data: {
        id: "round-1",
        session_id: "session-1",
        round_number: 2,
        economy_condition: "stable",
      },
      error: null,
    });
    harness.adminClient.queue("rounds", { data: null, error: null }); // prior round lookup
    harness.adminClient.queue("teams", {
      data: [{ id: "team-1", name: "Team A" }],
      error: null,
    });
    harness.adminClient.queue("decisions", {
      data: { id: "d1", team_id: "team-1", round_id: "round-1" },
      error: null,
    });
    harness.adminClient.queue("outcomes", { data: null, error: null }); // upsert
    harness.adminClient.queue("teams", { data: null, error: null }); // team update

    const res = await POST(req(), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.computed).toBe(1);
  });

  it("404s when the round doesn't exist for that session", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.adminClient.queue("rounds", { data: null, error: null });
    const res = await POST(req(), { params });
    expect(res.status).toBe(404);
  });

  it("500s when the teams query fails", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.adminClient.queue("rounds", {
      data: { id: "round-1", session_id: "session-1", round_number: 1, economy_condition: "stable" },
      error: null,
    });
    harness.adminClient.queue("rounds", { data: null, error: null }); // prior round
    harness.adminClient.queue("teams", { data: null, error: { message: "db down" } });
    const res = await POST(req(), { params });
    expect(res.status).toBe(500);
  });

  it("skips teams without a submitted decision", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.adminClient.queue("rounds", {
      data: { id: "round-1", session_id: "session-1", round_number: 1, economy_condition: "stable" },
      error: null,
    });
    harness.adminClient.queue("rounds", { data: null, error: null }); // prior round
    harness.adminClient.queue("teams", { data: [{ id: "team-1" }], error: null });
    harness.adminClient.queue("decisions", { data: null, error: null }); // no decision

    const res = await POST(req(), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.computed).toBe(0);
  });
});
