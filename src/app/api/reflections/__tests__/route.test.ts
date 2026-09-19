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

let GET: typeof import("@/app/api/reflections/route").GET;
let POST: typeof import("@/app/api/reflections/route").POST;
beforeAll(async () => {
  ({ GET, POST } = await import("@/app/api/reflections/route"));
});

beforeEach(() => {
  harness.reset();
});

const longContent = "a".repeat(150);

function postReq(body: unknown) {
  return new Request("http://localhost/api/reflections", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
function getReq(qs: string) {
  return new Request(`http://localhost/api/reflections${qs}`);
}

describe("POST /api/reflections", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(postReq({ team_id: "t1", round_id: "r1", content: longContent }));
    expect(res.status).toBe(401);
  });

  it("400s when required fields are missing", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(postReq({ team_id: "t1" }));
    expect(res.status).toBe(400);
  });

  it("400s when content is too short", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(postReq({ team_id: "t1", round_id: "r1", content: "short" }));
    expect(res.status).toBe(400);
  });

  it("400s when content is too long", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(
      postReq({ team_id: "t1", round_id: "r1", content: "a".repeat(2001) })
    );
    expect(res.status).toBe(400);
  });

  it("403s when the caller isn't on the team (ownership/membership check)", async () => {
    harness.setAuth(authedContext("student", { id: "student-2" }));
    harness.serverClient.queue("team_members", { data: null, error: null });
    const res = await POST(postReq({ team_id: "t1", round_id: "r1", content: longContent }));
    expect(res.status).toBe(403);
  });

  it("500s when the upsert fails", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("team_members", { data: { id: "m1" }, error: null });
    harness.serverClient.queue("reflections", { data: null, error: { message: "db down" } });
    const res = await POST(postReq({ team_id: "t1", round_id: "r1", content: longContent }));
    expect(res.status).toBe(500);
  });

  it("upserts the reflection for a team member", async () => {
    harness.setAuth(authedContext("student", { id: "student-1" }));
    harness.serverClient.queue("team_members", { data: { id: "m1" }, error: null });
    harness.serverClient.queue("reflections", {
      data: { team_id: "t1", round_id: "r1", content: longContent },
      error: null,
    });
    const res = await POST(postReq({ team_id: "t1", round_id: "r1", content: longContent }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reflection.team_id).toBe("t1");
  });
});

describe("GET /api/reflections", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET(getReq("?team_id=t1&round_id=r1"));
    expect(res.status).toBe(401);
  });

  it("400s when team_id or round_id is missing", async () => {
    harness.setAuth(authedContext("student"));
    const res = await GET(getReq("?team_id=t1"));
    expect(res.status).toBe(400);
  });

  it("500s on a db error", async () => {
    harness.setAuth(authedContext("student"));
    harness.serverClient.queue("reflections", { data: null, error: { message: "down" } });
    const res = await GET(getReq("?team_id=t1&round_id=r1"));
    expect(res.status).toBe(500);
  });

  // NOTE: suspected bug — src/app/api/reflections/route.ts:60-77 (GET)
  // Unlike POST in this same file (which checks the caller is a member of
  // team_id via team_members before writing), GET performs NO membership or
  // ownership check at all — it's gated only by requireAuth (any
  // authenticated role). Any authenticated student on a different team, or
  // any instructor, can read any team's reflection content for any round
  // just by supplying its team_id/round_id. Pinning current (vulnerable)
  // behavior.
  it("currently returns another team's reflection for an unrelated student — missing membership check (see NOTE above)", async () => {
    harness.setAuth(authedContext("student", { id: "student-NOT-on-team" }));
    harness.serverClient.queue("reflections", {
      data: { team_id: "some-other-team", round_id: "r1", content: longContent },
      error: null,
    });
    const res = await GET(getReq("?team_id=some-other-team&round_id=r1"));
    expect(res.status).toBe(200);
  });
});
