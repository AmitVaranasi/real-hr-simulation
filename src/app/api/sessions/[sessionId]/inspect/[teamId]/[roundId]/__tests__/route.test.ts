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
vi.mock("@/lib/db/compute", () => ({
  computeTeamOutcome: vi.fn(() => ({
    outcome: { bsc_scores: { total_score: 50 } },
    trace: { steps: [] },
    newCarryover: {},
  })),
  priorMetricsFromOutcome: vi.fn(() => null),
}));
vi.mock("@/lib/db/simulation-config", () => ({
  withSimulationConfig: async (fn: () => unknown) => fn(),
}));

let GET: typeof import(
  "@/app/api/sessions/[sessionId]/inspect/[teamId]/[roundId]/route"
).GET;
beforeAll(async () => {
  ({ GET } = await import(
    "@/app/api/sessions/[sessionId]/inspect/[teamId]/[roundId]/route"
  ));
});

beforeEach(() => {
  harness.reset();
});

const params = Promise.resolve({
  sessionId: "session-1",
  teamId: "team-1",
  roundId: "round-1",
});

function req() {
  return new Request(
    "http://localhost/api/sessions/session-1/inspect/team-1/round-1"
  );
}

describe("GET /api/sessions/[sessionId]/inspect/[teamId]/[roundId]", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET(req(), { params });
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await GET(req(), { params });
    expect(res.status).toBe(403);
  });

  it("404s when the session isn't owned by this instructor (ownership check)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-NOT-owner" }));
    harness.adminClient.queue("sessions", {
      data: { id: "session-1", name: "S", instructor_id: "instructor-owner" },
      error: null,
    });
    const res = await GET(req(), { params });
    expect(res.status).toBe(404);
  });

  it("404s when the team doesn't belong to the session", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.adminClient.queue("sessions", {
      data: { id: "session-1", name: "S", instructor_id: "instructor-1" },
      error: null,
    });
    harness.adminClient.queue("teams", { data: null, error: null });
    const res = await GET(req(), { params });
    expect(res.status).toBe(404);
  });

  it("404s when there's neither a stored trace nor a decision to compute from", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.adminClient.queue("sessions", {
      data: { id: "session-1", name: "S", instructor_id: "instructor-1" },
      error: null,
    });
    harness.adminClient.queue("teams", { data: { id: "team-1" }, error: null });
    harness.adminClient.queue("rounds", { data: { id: "round-1", round_number: 1 }, error: null });
    harness.adminClient.queue("decisions", { data: null, error: null });
    harness.adminClient.queue("outcomes", { data: null, error: null });
    harness.adminClient.queue("rounds", { data: null, error: null }); // prior round
    const res = await GET(req(), { params });
    expect(res.status).toBe(404);
  });

  it("returns a stored trace directly when present", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.adminClient.queue("sessions", {
      data: { id: "session-1", name: "S", instructor_id: "instructor-1" },
      error: null,
    });
    harness.adminClient.queue("teams", { data: { id: "team-1", name: "Team A" }, error: null });
    harness.adminClient.queue("rounds", {
      data: { id: "round-1", round_number: 1, economy_condition: "stable" },
      error: null,
    });
    harness.adminClient.queue("decisions", { data: { id: "d1" }, error: null });
    harness.adminClient.queue("outcomes", { data: { trace_json: { steps: ["cached"] } }, error: null });
    harness.adminClient.queue("rounds", { data: null, error: null }); // prior round

    const res = await GET(req(), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trace).toEqual({ steps: ["cached"] });
  });

  it("computes the trace when none is stored but a decision exists", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.adminClient.queue("sessions", {
      data: { id: "session-1", name: "S", instructor_id: "instructor-1" },
      error: null,
    });
    harness.adminClient.queue("teams", { data: { id: "team-1", name: "Team A" }, error: null });
    harness.adminClient.queue("rounds", {
      data: { id: "round-1", round_number: 1, economy_condition: "stable" },
      error: null,
    });
    harness.adminClient.queue("decisions", { data: { id: "d1" }, error: null });
    harness.adminClient.queue("outcomes", { data: null, error: null });
    harness.adminClient.queue("rounds", { data: null, error: null }); // prior round

    const res = await GET(req(), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trace).toEqual({ steps: [] });
  });
});
