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

let GET: typeof import("@/app/api/sessions/[sessionId]/route").GET;
let PATCH: typeof import("@/app/api/sessions/[sessionId]/route").PATCH;
beforeAll(async () => {
  ({ GET, PATCH } = await import("@/app/api/sessions/[sessionId]/route"));
});

beforeEach(() => {
  harness.reset();
});

const params = Promise.resolve({ sessionId: "session-1" });

function getReq() {
  return new Request("http://localhost/api/sessions/session-1");
}
function patchReq(body: unknown) {
  return new Request("http://localhost/api/sessions/session-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("GET /api/sessions/[sessionId]", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET(getReq(), { params });
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await GET(getReq(), { params });
    expect(res.status).toBe(403);
  });

  it("404s when the session isn't owned by this instructor (ownership check)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-2" }));
    harness.serverClient.queue("sessions", { data: null, error: { message: "no rows" } });
    const res = await GET(getReq(), { params });
    expect(res.status).toBe(404);
  });

  it("returns the session with nested rounds/teams for the owner", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", {
      data: { id: "session-1", rounds: [], teams: [] },
      error: null,
    });
    const res = await GET(getReq(), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.session.id).toBe("session-1");
  });
});

describe("PATCH /api/sessions/[sessionId]", () => {
  it("401s when unauthenticated", async () => {
    const res = await PATCH(patchReq({ name: "New" }), { params });
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await PATCH(patchReq({ name: "New" }), { params });
    expect(res.status).toBe(403);
  });

  it("400s when no valid fields are provided", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await PATCH(patchReq({ unknown_field: 1 }), { params });
    expect(res.status).toBe(400);
  });

  it("500s when the underlying update fails (also enforces ownership via instructor_id filter)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-2" }));
    harness.serverClient.queue("sessions", { data: null, error: { message: "no rows" } });
    const res = await PATCH(patchReq({ name: "New" }), { params });
    expect(res.status).toBe(500);
  });

  it("updates allowed fields for the owner", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", {
      data: { id: "session-1", name: "New Name" },
      error: null,
    });
    const res = await PATCH(patchReq({ name: "New Name", status: "active" }), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.session.name).toBe("New Name");
  });
});
