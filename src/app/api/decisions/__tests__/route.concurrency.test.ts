/**
 * Reproduces the data-loss bug described in the concurrency fix task:
 * two teammates editing the same round's decisions concurrently, where the
 * second save silently overwrites fields the first save just set.
 *
 * This test is written against the DESIRED behavior (reject a stale write
 * with 409 instead of silently overwriting) and is expected to FAIL against
 * the pre-fix route.ts, which blindly upserts with no version check. Once
 * the version column + conflict check land, this test should pass — see the
 * commit history for the red -> green progression.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHarness, authedContext } from "@/test/harness";
import { createDefaultDecision } from "@/lib/engine/defaults";

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

const base = createDefaultDecision();

describe("POST /api/decisions — concurrent save data loss", () => {
  it("rejects a stale second save instead of silently discarding the first save's field", async () => {
    // --- Student A loads the round (base state), edits, and saves first ---
    harness.setAuth(authedContext("student", { id: "student-a" }));
    harness.serverClient.queue("team_members", { data: { id: "m1" }, error: null });
    harness.serverClient.queue("rounds", { data: { status: "open" }, error: null });
    // No row exists yet for this team/round.
    harness.serverClient.queue("decisions", { data: null, error: null });
    harness.serverClient.queue("decisions", {
      data: { ...base, diversity_goal_pct: 40, version: 1 },
      error: null,
    });

    const resA = await POST(
      req({
        team_id: "t1",
        round_id: "r1",
        ...base,
        diversity_goal_pct: 40, // A's edit
        expected_version: null, // A loaded before any row existed
      })
    );
    expect(resA.status).toBe(200);
    const bodyA = await resA.json();
    expect(bodyA.decision.diversity_goal_pct).toBe(40);
    expect(bodyA.decision.version).toBe(1);

    // --- Student B loaded the SAME stale base (before A's save) and now
    // saves their own unrelated edit, unaware A already wrote version 1. ---
    harness.setAuth(authedContext("student", { id: "student-b" }));
    harness.serverClient.queue("team_members", { data: { id: "m2" }, error: null });
    harness.serverClient.queue("rounds", { data: { status: "open" }, error: null });
    // Server now has A's row at version 1.
    harness.serverClient.queue("decisions", {
      data: { ...base, diversity_goal_pct: 40, version: 1 },
      error: null,
    });

    const resB = await POST(
      req({
        team_id: "t1",
        round_id: "r1",
        ...base,
        onboarding_investment: 999, // B's edit
        expected_version: null, // B's stale snapshot predates A's save
      })
    );

    // The fix: B's stale write must be rejected with 409, not silently
    // applied — silently applying it would revert diversity_goal_pct back
    // to the default (15), destroying A's save.
    expect(resB.status).toBe(409);
    const bodyB = await resB.json();
    expect(bodyB.current.version).toBe(1);
    // The server's current row (returned so B can reconcile) still carries
    // A's edit — proof nothing was lost.
    expect(bodyB.current.diversity_goal_pct).toBe(40);
  });
});
