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

let POST: typeof import("@/app/api/auth/reset-student/route").POST;
beforeAll(async () => {
  ({ POST } = await import("@/app/api/auth/reset-student/route"));
});

beforeEach(() => {
  harness.reset();
  harness.adminClient.auth.resetPasswordForEmail = async () => ({ error: null });
});

function req(body: unknown) {
  return new Request("http://localhost/api/auth/reset-student", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = { email: "student@example.com", sessionId: "session-1" };

describe("POST /api/auth/reset-student", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(req(validBody));
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(req(validBody));
    expect(res.status).toBe(403);
  });

  it("400s on invalid JSON", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await POST(
      new Request("http://localhost/api/auth/reset-student", { method: "POST", body: "bad" })
    );
    expect(res.status).toBe(400);
  });

  it("400s when email or sessionId is missing", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await POST(req({ email: "s@example.com" }));
    expect(res.status).toBe(400);
  });

  it("404s when the session isn't owned by this instructor (ownership check)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-NOT-owner" }));
    harness.serverClient.queue("sessions", { data: null, error: null });
    const res = await POST(req(validBody));
    expect(res.status).toBe(404);
  });

  it("404s when no user exists with that email", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    harness.adminClient.auth.admin.listUsers = async () => ({
      data: { users: [] },
      error: null,
    });
    const res = await POST(req(validBody));
    expect(res.status).toBe(404);
  });

  it("403s when the target user isn't on a team in this instructor's session (ownership/membership check)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    harness.adminClient.auth.admin.listUsers = async () => ({
      data: { users: [{ id: "student-1", email: "student@example.com" }] },
      error: null,
    });
    harness.serverClient.queue("team_members", { data: null, error: null });
    const res = await POST(req(validBody));
    expect(res.status).toBe(403);
  });

  it("500s when the reset email fails to send", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    harness.adminClient.auth.admin.listUsers = async () => ({
      data: { users: [{ id: "student-1", email: "student@example.com" }] },
      error: null,
    });
    harness.serverClient.queue("team_members", { data: { id: "m1" }, error: null });
    harness.adminClient.auth.resetPasswordForEmail = async () => ({
      error: { message: "smtp down" },
    });
    const res = await POST(req(validBody));
    expect(res.status).toBe(500);
  });

  it("sends the reset email for a student in the instructor's own session", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.serverClient.queue("sessions", { data: { id: "session-1" }, error: null });
    harness.adminClient.auth.admin.listUsers = async () => ({
      data: { users: [{ id: "student-1", email: "student@example.com" }] },
      error: null,
    });
    harness.serverClient.queue("team_members", { data: { id: "m1" }, error: null });
    const res = await POST(req(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
