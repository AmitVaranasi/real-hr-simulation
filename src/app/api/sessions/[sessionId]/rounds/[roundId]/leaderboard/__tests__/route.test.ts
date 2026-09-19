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

let GET: typeof import("@/app/api/sessions/[sessionId]/rounds/[roundId]/leaderboard/route").GET;
let PATCH: typeof import("@/app/api/sessions/[sessionId]/rounds/[roundId]/leaderboard/route").PATCH;
beforeAll(async () => {
  ({ GET, PATCH } = await import(
    "@/app/api/sessions/[sessionId]/rounds/[roundId]/leaderboard/route"
  ));
});

beforeEach(() => {
  harness.reset();
});

const params = Promise.resolve({ sessionId: "session-1", roundId: "round-1" });

function getReq() {
  return new Request("http://localhost/api/sessions/session-1/rounds/round-1/leaderboard");
}
function patchReq(body: unknown) {
  return new Request("http://localhost/api/sessions/session-1/rounds/round-1/leaderboard", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("GET /api/sessions/[sessionId]/rounds/[roundId]/leaderboard", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET(getReq(), { params });
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await GET(getReq(), { params });
    expect(res.status).toBe(403);
  });

  // NOTE: suspected bug — src/app/api/sessions/[sessionId]/rounds/[roundId]/leaderboard/route.ts:44-59 (GET)
  // Unlike its own PATCH handler (which scopes the session lookup by
  // `.eq("instructor_id", user!.id)` and 404s otherwise), GET never queries
  // `sessions` at all — it goes straight to `teams`/`outcomes` filtered only
  // by sessionId/roundId. Any authenticated instructor can view the full
  // leaderboard (team names, scores, revenue, stock price) of a session they
  // don't own, just by knowing its id. Pinning current (vulnerable) behavior.
  it("currently returns leaderboard data for a non-owning instructor — missing ownership check (see NOTE above)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-NOT-owner" }));
    harness.serverClient.queue("teams", {
      data: [{ id: "team-1", name: "Team A", industry: "High-Tech", strategy: "Innovation" }],
      error: null,
    });
    harness.serverClient.queue("outcomes", {
      data: [{ team_id: "team-1", total_score: 90, instructor_override: null, revenue: 100, stock_price: 10 }],
      error: null,
    });
    const res = await GET(getReq(), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toHaveLength(1);
  });
});

describe("PATCH /api/sessions/[sessionId]/rounds/[roundId]/leaderboard", () => {
  it("401s when unauthenticated", async () => {
    const res = await PATCH(patchReq({ released: true }), { params });
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await PATCH(patchReq({ released: true }), { params });
    expect(res.status).toBe(403);
  });

  it("404s when the session isn't owned by this instructor (ownership check)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-2" }));
    harness.serverClient.queue("sessions", { data: null, error: null });
    const res = await PATCH(patchReq({ released: true }), { params });
    expect(res.status).toBe(404);
  });

  it("500s when the round update fails", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    harness.serverClient.queue("rounds", { data: null, error: { message: "fail" } });
    const res = await PATCH(patchReq({ released: true }), { params });
    expect(res.status).toBe(500);
  });

  it("releases the leaderboard on success", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    harness.serverClient.queue("rounds", {
      data: { id: "round-1", leaderboard_released: true },
      error: null,
    });
    const res = await PATCH(patchReq({ released: true }), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.round.leaderboard_released).toBe(true);
  });
});
