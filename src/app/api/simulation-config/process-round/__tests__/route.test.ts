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
    requireInstructorOrAdmin: harness.requireInstructorOrAdmin,
  };
});
vi.mock("@/lib/db/compute", () => ({
  computeTeamOutcome: vi.fn(() => ({
    outcome: { bsc_scores: { total_score: 77 } },
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

let POST: typeof import("@/app/api/simulation-config/process-round/route").POST;
beforeAll(async () => {
  ({ POST } = await import("@/app/api/simulation-config/process-round/route"));
});

beforeEach(() => {
  harness.reset();
});

function req(body: unknown) {
  return new Request("http://localhost/api/simulation-config/process-round", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/simulation-config/process-round", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(req({ sessionId: "s1", roundId: "r1" }));
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(req({ sessionId: "s1", roundId: "r1" }));
    expect(res.status).toBe(403);
  });

  it("400s when sessionId or roundId is missing", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await POST(req({ sessionId: "s1" }));
    expect(res.status).toBe(400);
  });

  it("404s when the round doesn't exist for that session", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.adminClient.queue("rounds", { data: null, error: null });
    const res = await POST(req({ sessionId: "s1", roundId: "r1" }));
    expect(res.status).toBe(404);
  });

  // NOTE: suspected bug — src/app/api/simulation-config/process-round/route.ts:36-41
  // Same pattern as the sibling compute route: the round lookup is scoped only by
  // id + session_id, never by the caller's instructor_id, and no ownership check
  // against sessions.instructor_id exists anywhere in this handler. Any
  // authenticated instructor (or admin, by design) can process — and mutate
  // outcomes/teams for — ANY session's round just by supplying its sessionId and
  // roundId. Pinning current (vulnerable) behavior for instructors specifically,
  // since admins are expected to have cross-session access.
  it("currently succeeds for a non-owning instructor — missing ownership check (see NOTE above)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-NOT-owner" }));
    harness.adminClient.queue("rounds", {
      data: { id: "r1", session_id: "s1", round_number: 1, economy_condition: "stable" },
      error: null,
    });
    harness.adminClient.queue("rounds", { data: null, error: null }); // prior round
    harness.adminClient.queue("teams", { data: [{ id: "team-1", name: "Team A" }], error: null });
    harness.adminClient.queue("decisions", { data: { id: "d1" }, error: null });
    harness.adminClient.queue("outcomes", { data: null, error: null }); // upsert
    harness.adminClient.queue("teams", { data: null, error: null }); // update

    const res = await POST(req({ sessionId: "s1", roundId: "r1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.computed).toBe(1);
  });
});
