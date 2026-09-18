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
    requireInstructor: harness.requireInstructor,
    requireInstructorOrAdmin: harness.requireInstructorOrAdmin,
    requireAdmin: harness.requireAdmin,
  };
});

let POST: typeof import("@/app/api/teams/join/route").POST;
beforeAll(async () => {
  ({ POST } = await import("@/app/api/teams/join/route"));
});

beforeEach(() => {
  harness.reset();
});

function req(body: unknown) {
  return new Request("http://localhost/api/teams/join", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const team = {
  id: "team-1",
  session_id: "session-1",
  join_code: "abc123",
  name: "Team A",
  sessions: { id: "session-1", name: "Session A" },
};

describe("POST /api/teams/join", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(req({ join_code: "abc123" }));
    expect(res.status).toBe(401);
  });

  it("403s for a non-student role", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await POST(req({ join_code: "abc123" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Only students can join teams");
  });

  it("400s when join_code is missing", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(req({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("join_code required");
  });

  it("404s for an invalid join code", async () => {
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("teams", {
      data: null,
      error: { message: "not found" },
    });
    const res = await POST(req({ join_code: "nope" }));
    expect(res.status).toBe(404);
  });

  it("400s when already on the target team", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("teams", { data: team, error: null });
    harness.serverClient.queue("team_members", {
      data: [{ id: "m1", team_id: "team-1", teams: { id: "team-1", session_id: "session-1" } }],
      error: null,
    });
    const res = await POST(req({ join_code: "abc123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("You are already on this team");
  });

  it("400s when already on a different team in the same session", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("teams", { data: team, error: null });
    harness.serverClient.queue("team_members", {
      data: [
        {
          id: "m1",
          team_id: "team-other",
          teams: { id: "team-other", session_id: "session-1" },
        },
      ],
      error: null,
    });
    const res = await POST(req({ join_code: "abc123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("You are already on a team in this session");
  });

  it("joins a fresh team (switched: false) on success", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("teams", { data: team, error: null });
    harness.serverClient.queue("team_members", { data: [], error: null });
    harness.adminClient.queue("team_members", { data: null, error: null }); // insert

    const res = await POST(req({ join_code: "abc123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.switched).toBe(false);
    expect(body.team).toEqual(team);
  });

  it("switches teams (switched: true) when already on a team in another session", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("teams", { data: team, error: null });
    harness.serverClient.queue("team_members", {
      data: [
        {
          id: "m1",
          team_id: "team-other",
          teams: { id: "team-other", session_id: "session-other" },
        },
      ],
      error: null,
    });
    harness.adminClient.queue("team_members", { data: null, error: null }); // delete
    harness.adminClient.queue("team_members", { data: null, error: null }); // insert

    const res = await POST(req({ join_code: "abc123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.switched).toBe(true);
  });
});
