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

let POST: typeof import("@/app/api/sessions/[sessionId]/rounds/route").POST;
beforeAll(async () => {
  ({ POST } = await import("@/app/api/sessions/[sessionId]/rounds/route"));
});

beforeEach(() => {
  harness.reset();
});

const params = Promise.resolve({ sessionId: "session-1" });

function req(body: unknown) {
  return new Request("http://localhost/api/sessions/session-1/rounds", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/sessions/[sessionId]/rounds", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(req({}), { params });
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(req({}), { params });
    expect(res.status).toBe(403);
  });

  it("404s when the session isn't owned by this instructor (ownership check)", async () => {
    // requireInstructor only checks role; the route itself must scope the
    // session lookup by instructor_id. This queues no matching session, as
    // the fake .eq("instructor_id", ...) chain would do for another
    // instructor's session.
    harness.setAuth(authedContext("instructor", { id: "instructor-2" }));
    harness.serverClient.queue("sessions", { data: null, error: null });
    const res = await POST(req({}), { params });
    expect(res.status).toBe(404);
  });

  it("creates a competitive round as round_number 1 when none exist", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", {
      data: { id: "session-1", rounds_total: 0, practice_rounds: 0, status: "setup" },
      error: null,
    });
    harness.serverClient.queue("rounds", { data: [], error: null }); // existing list
    harness.serverClient.queue("rounds", {
      data: { id: "round-1", session_id: "session-1", round_number: 1, round_type: "competitive" },
      error: null,
    }); // insert
    harness.serverClient.queue("sessions", { data: null, error: null }); // session patch

    const res = await POST(req({}), { params });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.round.round_number).toBe(1);
  });

  it("creates a practice round when round_type is practice", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", {
      data: { id: "session-1", rounds_total: 2, practice_rounds: 0, status: "active" },
      error: null,
    });
    harness.serverClient.queue("rounds", { data: [{ round_number: 2 }], error: null });
    harness.serverClient.queue("rounds", {
      data: { id: "round-2", session_id: "session-1", round_number: 3, round_type: "practice" },
      error: null,
    });
    harness.serverClient.queue("sessions", { data: null, error: null });

    const res = await POST(req({ round_type: "practice" }), { params });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.round.round_type).toBe("practice");
  });

  it("500s when listing existing rounds fails", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", {
      data: { id: "session-1", rounds_total: 0, practice_rounds: 0, status: "setup" },
      error: null,
    });
    harness.serverClient.queue("rounds", { data: null, error: { message: "db down" } });
    const res = await POST(req({}), { params });
    expect(res.status).toBe(500);
  });

  it("500s when inserting the round fails", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", {
      data: { id: "session-1", rounds_total: 0, practice_rounds: 0, status: "setup" },
      error: null,
    });
    harness.serverClient.queue("rounds", { data: [], error: null });
    harness.serverClient.queue("rounds", { data: null, error: { message: "insert failed" } });
    const res = await POST(req({}), { params });
    expect(res.status).toBe(500);
  });
});
