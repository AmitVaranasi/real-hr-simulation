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

let GET: typeof import("@/app/api/decisions/load/route").GET;
beforeAll(async () => {
  ({ GET } = await import("@/app/api/decisions/load/route"));
});

beforeEach(() => {
  harness.reset();
});

function req(qs = "?round_id=round-1") {
  return new Request(`http://localhost/api/decisions/load${qs}`);
}

describe("GET /api/decisions/load", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("400s when round_id is missing", async () => {
    harness.setAuth(authedContext("student"));
    const res = await GET(req(""));
    expect(res.status).toBe(400);
  });

  it("404s when the caller has no team", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("team_members", { data: null, error: null });
    const res = await GET(req());
    expect(res.status).toBe(404);
  });

  it("404s when there's no decision for that round", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("team_members", {
      data: { team_id: "team-1", teams: { id: "team-1", industry: "Manufacturing", strategy: "Focus", headcount: 40 } },
      error: null,
    });
    harness.serverClient.queue("rounds", { data: { economy_condition: "stable" }, error: null });
    harness.serverClient.queue("decisions", { data: null, error: null });
    const res = await GET(req());
    expect(res.status).toBe(404);
  });

  it("returns the caller's own decision (self-scoped via their team_members row, not caller-supplied ids)", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("team_members", {
      data: { team_id: "team-1", teams: { id: "team-1", industry: "High-Tech", strategy: "Innovation", headcount: 60 } },
      error: null,
    });
    harness.serverClient.queue("rounds", { data: { economy_condition: "boom" }, error: null });
    harness.serverClient.queue("decisions", { data: { id: "d1", team_id: "team-1" }, error: null });
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.team_id).toBe("team-1");
    expect(body.economy).toBe("boom");
  });
});
