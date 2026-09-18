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

let POST: typeof import("@/app/api/sessions/[sessionId]/teams/route").POST;
let PATCH: typeof import("@/app/api/sessions/[sessionId]/teams/route").PATCH;
beforeAll(async () => {
  ({ POST, PATCH } = await import("@/app/api/sessions/[sessionId]/teams/route"));
});

beforeEach(() => {
  harness.reset();
});

const params = Promise.resolve({ sessionId: "session-1" });

function postReq(body: unknown) {
  return new Request("http://localhost/api/sessions/session-1/teams", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
function patchReq(body: unknown) {
  return new Request("http://localhost/api/sessions/session-1/teams", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

const validTeamBody = {
  name: "Team A",
  industry: "High-Tech",
  strategy: "Innovation",
};

describe("POST /api/sessions/[sessionId]/teams", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(postReq(validTeamBody), { params });
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(postReq(validTeamBody), { params });
    expect(res.status).toBe(403);
  });

  it("400s when required fields are missing", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await POST(postReq({ name: "Team A" }), { params });
    expect(res.status).toBe(400);
  });

  it("404s when the session doesn't exist or isn't owned by this instructor", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.serverClient.queue("sessions", { data: null, error: null });
    const res = await POST(postReq(validTeamBody), { params });
    expect(res.status).toBe(404);
  });

  it("creates the team with the industry's prior-state metrics on success", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    const team = { id: "team-1", session_id: "session-1", ...validTeamBody };
    harness.serverClient.queue("teams", { data: team, error: null });

    const res = await POST(postReq(validTeamBody), { params });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.team).toEqual(team);
  });
});

describe("PATCH /api/sessions/[sessionId]/teams", () => {
  it("401s when unauthenticated", async () => {
    const res = await PATCH(patchReq({ teamId: "team-1", name: "New" }), { params });
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await PATCH(patchReq({ teamId: "team-1", name: "New" }), { params });
    expect(res.status).toBe(403);
  });

  it("400s when teamId is missing", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await PATCH(patchReq({ name: "New" }), { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("teamId is required");
  });

  it("404s when the session doesn't exist or isn't owned by this instructor", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.serverClient.queue("sessions", { data: null, error: null });
    const res = await PATCH(patchReq({ teamId: "team-1", name: "New" }), { params });
    expect(res.status).toBe(404);
  });

  it("400s when no updatable fields are provided", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    const res = await PATCH(patchReq({ teamId: "team-1" }), { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No updates provided");
  });

  it("updates the team on success", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    const team = { id: "team-1", session_id: "session-1", name: "Renamed" };
    harness.serverClient.queue("teams", { data: team, error: null });

    const res = await PATCH(patchReq({ teamId: "team-1", name: "Renamed" }), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.team).toEqual(team);
  });
});
