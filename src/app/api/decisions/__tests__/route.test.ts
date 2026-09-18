import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHarness, authedContext } from "@/test/harness";
import { createDefaultDecision } from "@/lib/engine/defaults";
import { decisionToRow } from "@/lib/db/decisions";

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

let POST: typeof import("@/app/api/decisions/route").POST;
beforeAll(async () => {
  ({ POST } = await import("@/app/api/decisions/route"));
});

beforeEach(() => {
  harness.reset();
});

function req(body: unknown) {
  return new Request("http://localhost/api/decisions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validDecision = createDefaultDecision();

describe("POST /api/decisions", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(req({ team_id: "t1", round_id: "r1", ...validDecision }));
    expect(res.status).toBe(401);
  });

  it("400s when team_id or round_id is missing", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(req({ ...validDecision }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("team_id and round_id required");
  });

  it("403s when the caller isn't on the team", async () => {
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("team_members", { data: null, error: null });
    const res = await POST(req({ team_id: "t1", round_id: "r1", ...validDecision }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Not on this team");
  });

  it("400s when the round isn't open", async () => {
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("team_members", { data: { id: "m1" }, error: null });
    harness.serverClient.queue("rounds", { data: { status: "closed" }, error: null });
    const res = await POST(req({ team_id: "t1", round_id: "r1", ...validDecision }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Round is not open for decisions");
  });

  it("400s with validation errors for an out-of-range decision", async () => {
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("team_members", { data: { id: "m1" }, error: null });
    harness.serverClient.queue("rounds", { data: { status: "open" }, error: null });
    const res = await POST(
      req({
        team_id: "t1",
        round_id: "r1",
        ...validDecision,
        bonus_tier: 99, // not one of 5, 10, 15
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toContain("Bonus tier must be 5%, 10%, or 15%");
  });

  // NOTE: suspected bug — src/app/api/decisions/route.ts never checks that
  // `round_id` belongs to `team_id`'s session. It only verifies (a) the
  // caller is a member of `team_id` and (b) the round pointed to by
  // `round_id` has status "open", with no join between the two. A student
  // could submit a decision against ANY currently-open round in the system
  // (from a different session/instructor) by supplying their own team_id
  // alongside an unrelated round_id. Pinning current (permissive) behavior
  // here rather than fixing it, per instructions not to modify route code.
  it("upserts and returns the decision on success", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("team_members", { data: { id: "m1" }, error: null });
    harness.serverClient.queue("rounds", { data: { status: "open" }, error: null });

    const row = decisionToRow(
      { ...validDecision, is_submitted: true },
      "t1",
      "r1",
      "student-1"
    );
    harness.serverClient.queue("decisions", { data: row, error: null });

    const res = await POST(
      req({ team_id: "t1", round_id: "r1", ...validDecision, is_submitted: true })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.decision.bonus_tier).toBe(validDecision.bonus_tier);
    expect(body.decision.is_submitted).toBe(true);
  });
});
