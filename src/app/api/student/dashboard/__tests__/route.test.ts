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

let GET: typeof import("@/app/api/student/dashboard/route").GET;
beforeAll(async () => {
  ({ GET } = await import("@/app/api/student/dashboard/route"));
});

beforeEach(() => {
  harness.reset();
});

const teamRow = {
  id: "team-1",
  name: "Team A",
  industry: "High-Tech",
  strategy: "Innovation",
  session_id: "session-1",
  sessions: { name: "Session A", course_code: "MGT101", semester: "Fall" },
};

describe("GET /api/student/dashboard", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("403s for instructors (students only)", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Students only");
  });

  it("403s for admins (students only)", async () => {
    harness.setAuth(authedContext("admin"));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns hasTeam: false when the student has no team", async () => {
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("team_members", { data: null, error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      hasTeam: false,
      openRound: null,
      decision: null,
      simulation: null,
    });
  });

  it("reports a waiting state when there's no open round", async () => {
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("team_members", {
      data: { team_id: "team-1", teams: teamRow },
      error: null,
    });
    harness.serverClient.queue("rounds", { data: null, error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasTeam).toBe(true);
    expect(body.openRound).toBeNull();
    expect(body.decision).toBeNull();
    expect(body.simulation.roundLabel).toBe("Not Open — Waiting for Instructor");
  });

  it("reports the open round and decision status", async () => {
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("team_members", {
      data: { team_id: "team-1", teams: teamRow },
      error: null,
    });
    const openRound = {
      id: "round-1",
      round_number: 2,
      round_type: "competitive",
      status: "open",
      economy_condition: "growth",
    };
    harness.serverClient.queue("rounds", { data: openRound, error: null });
    harness.serverClient.queue("decisions", {
      data: { is_submitted: true },
      error: null,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasTeam).toBe(true);
    expect(body.openRound).toEqual(openRound);
    expect(body.decision).toEqual({ exists: true, is_submitted: true });
    expect(body.simulation.roundLabel).toBe("Round 2 — OPEN");
    expect(body.simulation.economy).toBe("growth");
  });
});
