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
    requireAuth: harness.requireAuth,
  };
});

let GET: typeof import("@/app/api/outcomes/[teamId]/[roundId]/route").GET;
beforeAll(async () => {
  ({ GET } = await import("@/app/api/outcomes/[teamId]/[roundId]/route"));
});

beforeEach(() => {
  harness.reset();
});

const params = Promise.resolve({ teamId: "team-1", roundId: "round-1" });

function req() {
  return new Request("http://localhost/api/outcomes/team-1/round-1");
}

describe("GET /api/outcomes/[teamId]/[roundId]", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET(req(), { params });
    expect(res.status).toBe(401);
  });

  it("403s for a student not on the team", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("team_members", { data: null, error: null });
    const res = await GET(req(), { params });
    expect(res.status).toBe(403);
  });

  it("returns the outcome for a student who is on the team", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("team_members", { data: { id: "m1" }, error: null });
    harness.serverClient.queue("outcomes", {
      data: { team_id: "team-1", round_id: "round-1", total_score: 80 },
      error: null,
    });
    const res = await GET(req(), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.outcome.total_score).toBe(80);
  });

  it("404s when no outcome exists yet", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("team_members", { data: { id: "m1" }, error: null });
    harness.serverClient.queue("outcomes", { data: null, error: null });
    const res = await GET(req(), { params });
    expect(res.status).toBe(404);
  });

  it("500s on a db error", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("team_members", { data: { id: "m1" }, error: null });
    harness.serverClient.queue("outcomes", { data: null, error: { message: "down" } });
    const res = await GET(req(), { params });
    expect(res.status).toBe(500);
  });

  // NOTE: suspected bug — src/app/api/outcomes/[teamId]/[roundId]/route.ts:12-19
  // The membership check only runs `if (profile?.role === "student")`. For an
  // instructor caller, there is no check at all that the team's session belongs
  // to them (no lookup through teams -> sessions.instructor_id, unlike e.g. the
  // override route which does perform that chain). Any authenticated instructor
  // can read any team's outcome for any round just by guessing/knowing the ids.
  // Pinning current (vulnerable) behavior.
  it("currently returns the outcome for ANY instructor regardless of session ownership — missing ownership check (see NOTE above)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-NOT-owner" }));
    harness.serverClient.queue("outcomes", {
      data: { team_id: "team-1", round_id: "round-1", total_score: 99 },
      error: null,
    });
    const res = await GET(req(), { params });
    expect(res.status).toBe(200);
  });
});
