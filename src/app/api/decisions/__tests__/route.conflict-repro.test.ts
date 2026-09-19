import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultDecision } from "@/lib/engine/defaults";
import {
  FakeDecisionsTable,
  fakeDecisionsSupabaseClient,
} from "./fake-decisions-db";

/**
 * Reproduction of the concurrent-edit data-loss bug described in the task:
 * src/app/api/decisions/route.ts upserts the client's full local snapshot
 * with no version check. Two teammates ("Alex" and "Sam") both load the
 * same round, each edits a *different* field from that shared base, and
 * save one after the other. Because neither save carries any notion of
 * "what version did I load from", the second save silently clobbers the
 * first teammate's change even though the two edits never touched the same
 * field.
 *
 * This test encodes the API contract the fix (steps 2-4 of this task) is
 * required to satisfy: a save whose `version` no longer matches the current
 * server version must be rejected with 409 and must NOT be written, so the
 * first teammate's change survives. Against the current code (no version
 * column, no version field accepted, blind upsert) this fails: Sam's save
 * succeeds with 200 and Alex's change is gone.
 */

const table = new FakeDecisionsTable();
const fakeSupabase = fakeDecisionsSupabaseClient(table);

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => fakeSupabase,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => fakeSupabase,
}));
vi.mock("@/lib/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth")>();
  let currentUserId = "alex";
  return {
    ...actual,
    __setUser: (id: string) => {
      currentUserId = id;
    },
    requireAuth: async () => ({
      error: null,
      user: { id: currentUserId, email: `${currentUserId}@example.com` },
      profile: { id: currentUserId, role: "student", display_name: currentUserId },
      supabase: fakeSupabase,
    }),
  };
});

let POST: typeof import("@/app/api/decisions/route").POST;
let setUser: (id: string) => void;
beforeAll(async () => {
  ({ POST } = await import("@/app/api/decisions/route"));
  const authMock = (await import("@/lib/api/auth")) as unknown as {
    __setUser: (id: string) => void;
  };
  setUser = authMock.__setUser;
});

beforeEach(() => {
  table.reset();
});

function req(body: unknown) {
  return new Request("http://localhost/api/decisions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const base = createDefaultDecision();

describe("concurrent decision saves (data-loss reproduction)", () => {
  it("rejects a save built on a stale version instead of losing the other teammate's field", async () => {
    // Both teammates load the round before anyone has saved: no row exists.
    setUser("alex");
    const alexEdit = {
      ...base,
      team_id: "team-1",
      round_id: "round-1",
      is_submitted: false,
      version: undefined, // no row yet
      benefits_pct: 18,
    };
    const alexRes = await POST(req(alexEdit));
    expect(alexRes.status).toBe(200);
    const alexBody = await alexRes.json();
    expect(alexBody.decision.benefits_pct).toBe(18);
    const versionAfterAlex = alexBody.decision.version;

    // Sam loaded the round BEFORE Alex saved, so Sam's local snapshot still
    // has the default benefits_pct and an older (or absent) version. Sam
    // only meant to change bonus_tier.
    setUser("sam");
    const samEdit = {
      ...base,
      team_id: "team-1",
      round_id: "round-1",
      is_submitted: false,
      version: undefined, // Sam never saw Alex's row
      bonus_tier: 15,
    };
    const samRes = await POST(req(samEdit));

    // The fix: Sam's stale-based save must be rejected, not silently
    // accepted and overwrite Alex's benefits_pct back to the default.
    expect(samRes.status).toBe(409);
    const samBody = await samRes.json();
    expect(samBody.error).toBe("conflict");
    expect(samBody.serverDecision.benefits_pct).toBe(18);
    expect(samBody.serverVersion).toBe(versionAfterAlex);

    // Alex's change must still be there in the database, untouched by Sam's
    // rejected save.
    const stored = table.get("team-1", "round-1");
    expect(stored?.benefits_pct).toBe(18);
  });
});
