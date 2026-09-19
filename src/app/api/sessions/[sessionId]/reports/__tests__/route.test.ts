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

let GET: typeof import("@/app/api/sessions/[sessionId]/reports/route").GET;
beforeAll(async () => {
  ({ GET } = await import("@/app/api/sessions/[sessionId]/reports/route"));
});

beforeEach(() => {
  harness.reset();
});

const params = Promise.resolve({ sessionId: "session-1" });

function req() {
  return new Request("http://localhost/api/sessions/session-1/reports");
}

describe("GET /api/sessions/[sessionId]/reports", () => {
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
    harness.setAuth(authedContext("instructor", { id: "instructor-2" }));
    harness.serverClient.queue("sessions", { data: null, error: null });
    const res = await GET(req(), { params });
    expect(res.status).toBe(404);
  });

  it("returns empty arrays for a session with no teams", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    harness.serverClient.queue("teams", { data: [], error: null });
    harness.serverClient.queue("rounds", { data: [], error: null });
    const res = await GET(req(), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.outcomes).toEqual([]);
    expect(body.decisions).toEqual([]);
    expect(body.reflections).toEqual([]);
  });

  it("aggregates teams/rounds/outcomes/decisions/reflections for the owner", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    harness.serverClient.queue("teams", { data: [{ id: "team-1" }], error: null });
    harness.serverClient.queue("rounds", { data: [{ id: "round-1" }], error: null });
    harness.serverClient.queue("outcomes", { data: [{ team_id: "team-1" }], error: null });
    harness.serverClient.queue("decisions", { data: [{ team_id: "team-1" }], error: null });
    harness.serverClient.queue("reflections", { data: [{ team_id: "team-1" }], error: null });

    const res = await GET(req(), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.teams).toHaveLength(1);
    expect(body.outcomes).toHaveLength(1);
    expect(body.decisions).toHaveLength(1);
    expect(body.reflections).toHaveLength(1);
  });
});
