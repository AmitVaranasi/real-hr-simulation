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

let GET: typeof import("@/app/api/sessions/route").GET;
let POST: typeof import("@/app/api/sessions/route").POST;
beforeAll(async () => {
  ({ GET, POST } = await import("@/app/api/sessions/route"));
});

beforeEach(() => {
  harness.reset();
});

function postReq(body: unknown) {
  return new Request("http://localhost/api/sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("GET /api/sessions", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns the instructor's sessions on success", async () => {
    harness.setAuth(authedContext("instructor"));
    const sessions = [{ id: "s1", name: "Session A", rounds: [] }];
    harness.serverClient.queue("sessions", { data: sessions, error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessions).toEqual(sessions);
  });

  it("500s when the query errors", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.serverClient.queue("sessions", {
      data: null,
      error: { message: "db exploded" },
    });
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("POST /api/sessions", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(postReq({ name: "New Session" }));
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(postReq({ name: "New Session" }));
    expect(res.status).toBe(403);
  });

  it("400s when name is missing", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await POST(postReq({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Name is required");
  });

  it("creates a session with its rounds on success", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    const session = {
      id: "s1",
      instructor_id: "instructor-1",
      name: "New Session",
      rounds_total: 3,
      practice_rounds: 1,
      status: "setup",
    };
    harness.serverClient.queue("sessions", { data: session, error: null });
    const rounds = [
      { session_id: "s1", round_number: 1, round_type: "practice" },
      { session_id: "s1", round_number: 2, round_type: "competitive" },
      { session_id: "s1", round_number: 3, round_type: "competitive" },
      { session_id: "s1", round_number: 4, round_type: "competitive" },
    ];
    harness.serverClient.queue("rounds", { data: rounds, error: null });

    const res = await POST(postReq({ name: "New Session" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.session).toEqual(session);
    expect(body.rounds).toEqual(rounds);
  });
});
