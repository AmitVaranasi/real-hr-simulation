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
    trace: {},
    newCarryover: {},
  })),
  priorMetricsFromOutcome: vi.fn(() => null),
}));
vi.mock("@/lib/db/simulation-config", () => ({
  withSimulationConfig: async (fn: () => unknown) => fn(),
}));

let POST: typeof import(
  "@/app/api/sessions/[sessionId]/explore/[teamId]/[roundId]/route"
).POST;
beforeAll(async () => {
  ({ POST } = await import(
    "@/app/api/sessions/[sessionId]/explore/[teamId]/[roundId]/route"
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

function req(body: unknown = {}) {
  return new Request(
    "http://localhost/api/sessions/session-1/explore/team-1/round-1",
    { method: "POST", body: JSON.stringify(body) }
  );
}

describe("POST /api/sessions/[sessionId]/explore/[teamId]/[roundId]", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(req(), { params });
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(req(), { params });
    expect(res.status).toBe(403);
  });

  it("404s when the session isn't owned by this instructor (ownership check)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-NOT-owner" }));
    harness.adminClient.queue("sessions", {
      data: { id: "session-1", instructor_id: "instructor-owner" },
      error: null,
    });
    const res = await POST(req(), { params });
    expect(res.status).toBe(404);
  });

  it("404s when the team doesn't belong to the session", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.adminClient.queue("sessions", {
      data: { id: "session-1", instructor_id: "instructor-1" },
      error: null,
    });
    harness.adminClient.queue("teams", { data: null, error: null });
    const res = await POST(req(), { params });
    expect(res.status).toBe(404);
  });

  it("404s when there's no stored decision for that team/round", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.adminClient.queue("sessions", {
      data: { id: "session-1", instructor_id: "instructor-1" },
      error: null,
    });
    harness.adminClient.queue("teams", { data: { id: "team-1" }, error: null });
    harness.adminClient.queue("rounds", { data: { id: "round-1", round_number: 1 }, error: null });
    harness.adminClient.queue("decisions", { data: null, error: null });
    const res = await POST(req(), { params });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("no decisions");
  });

  it("returns actual vs explored outcomes without recording anything (recorded:false)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.adminClient.queue("sessions", {
      data: { id: "session-1", instructor_id: "instructor-1" },
      error: null,
    });
    harness.adminClient.queue("teams", { data: { id: "team-1", name: "Team A" }, error: null });
    harness.adminClient.queue("rounds", {
      data: { id: "round-1", round_number: 2, economy_condition: "stable" },
      error: null,
    });
    harness.adminClient.queue("decisions", { data: { id: "d1", is_submitted: true }, error: null });
    harness.adminClient.queue("rounds", { data: null, error: null }); // prior round

    const res = await POST(req({ overrides: { screening_rigor: 3 } }), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.recorded).toBe(false);
    expect(body.actual).toBeDefined();
    expect(body.explored).toBeDefined();
  });
});
