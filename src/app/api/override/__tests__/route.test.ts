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

let PATCH: typeof import("@/app/api/override/route").PATCH;
beforeAll(async () => {
  ({ PATCH } = await import("@/app/api/override/route"));
});

beforeEach(() => {
  harness.reset();
});

function req(body: unknown) {
  return new Request("http://localhost/api/override", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

const validBody = { team_id: "team-1", round_id: "round-1", override_score: 85 };

describe("PATCH /api/override", () => {
  it("401s when unauthenticated", async () => {
    const res = await PATCH(req(validBody));
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await PATCH(req(validBody));
    expect(res.status).toBe(403);
  });

  it("400s when required fields are missing", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await PATCH(req({ team_id: "team-1" }));
    expect(res.status).toBe(400);
  });

  it("403s when the team's session isn't owned by this instructor (ownership check)", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-NOT-owner" }));
    harness.adminClient.queue("teams", { data: { session_id: "session-1" }, error: null });
    harness.adminClient.queue("sessions", { data: { instructor_id: "instructor-owner" }, error: null });
    const res = await PATCH(req(validBody));
    expect(res.status).toBe(403);
  });

  it("500s when the outcome update fails", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.adminClient.queue("teams", { data: { session_id: "session-1" }, error: null });
    harness.adminClient.queue("sessions", { data: { instructor_id: "instructor-1" }, error: null });
    harness.adminClient.queue("outcomes", { data: null, error: { message: "not found" } });
    const res = await PATCH(req(validBody));
    expect(res.status).toBe(500);
  });

  it("applies the override for the owning instructor", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.adminClient.queue("teams", { data: { session_id: "session-1" }, error: null });
    harness.adminClient.queue("sessions", { data: { instructor_id: "instructor-1" }, error: null });
    harness.adminClient.queue("outcomes", {
      data: { team_id: "team-1", round_id: "round-1", instructor_override: 85, override_reason: null },
      error: null,
    });
    const res = await PATCH(req(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.outcome.instructor_override).toBe(85);
  });
});
