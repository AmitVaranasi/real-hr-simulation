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

const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
vi.stubGlobal("fetch", fetchMock);

let PATCH: typeof import("@/app/api/sessions/[sessionId]/rounds/[roundId]/route").PATCH;
beforeAll(async () => {
  ({ PATCH } = await import("@/app/api/sessions/[sessionId]/rounds/[roundId]/route"));
});

beforeEach(() => {
  harness.reset();
  fetchMock.mockClear();
});

const params = Promise.resolve({ sessionId: "session-1", roundId: "round-1" });

function req(body: unknown) {
  return new Request("http://localhost/api/sessions/session-1/rounds/round-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/sessions/[sessionId]/rounds/[roundId]", () => {
  it("401s when unauthenticated", async () => {
    const res = await PATCH(req({ status: "open" }), { params });
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await PATCH(req({ status: "open" }), { params });
    expect(res.status).toBe(403);
  });

  it("404s when the session isn't owned by this instructor (ownership check)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-2" }));
    harness.serverClient.queue("sessions", { data: null, error: null });
    const res = await PATCH(req({ status: "open" }), { params });
    expect(res.status).toBe(404);
  });

  it("500s when the round update fails", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    harness.serverClient.queue("rounds", { data: null, error: { message: "not found" } });
    const res = await PATCH(req({ status: "open" }), { params });
    expect(res.status).toBe(500);
  });

  it("opens the round and seeds default decisions for teams missing one", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    harness.serverClient.queue("rounds", {
      data: { id: "round-1", session_id: "session-1", status: "open" },
      error: null,
    });
    harness.serverClient.queue("teams", { data: [{ id: "team-1" }], error: null });
    harness.serverClient.queue("decisions", { data: null, error: null }); // existing check: none
    harness.serverClient.queue("decisions", { data: null, error: null }); // insert default

    const res = await PATCH(req({ status: "open" }), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.round.status).toBe("open");
  });

  it("closes the round and triggers compute via internal fetch", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    harness.serverClient.queue("rounds", {
      data: { id: "round-1", session_id: "session-1", status: "closed" },
      error: null,
    });

    const res = await PATCH(req({ status: "closed" }), { params });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/sessions/session-1/rounds/round-1/compute"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("updates economy_condition and decision_deadline without changing status", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    harness.serverClient.queue("rounds", {
      data: { id: "round-1", session_id: "session-1", economy_condition: "recession" },
      error: null,
    });

    const res = await PATCH(
      req({ economy_condition: "recession", decision_deadline: null }),
      { params }
    );
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
