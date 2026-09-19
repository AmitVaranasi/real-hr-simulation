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
  };
});

let GET: typeof import("@/app/api/coach/transcripts/route").GET;
beforeAll(async () => {
  ({ GET } = await import("@/app/api/coach/transcripts/route"));
});

beforeEach(() => {
  harness.reset();
});

function makeRequest(teamId: string) {
  return new Request(`http://localhost/api/coach/transcripts?team_id=${teamId}`);
}

describe("GET /api/coach/transcripts", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET(makeRequest("team-1"));
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await GET(makeRequest("team-1"));
    expect(res.status).toBe(403);
  });

  it("400s without team_id", async () => {
    harness.setAuth(authedContext("instructor", { id: "instr-1" }));
    const res = await GET(new Request("http://localhost/api/coach/transcripts"));
    expect(res.status).toBe(400);
  });

  it("404s when the instructor does not own the team's session", async () => {
    harness.setAuth(authedContext("instructor", { id: "instr-1" }));
    harness.adminClient.queue("teams", {
      data: {
        id: "team-1",
        name: "Team A",
        session_id: "s1",
        sessions: { instructor_id: "someone-else" },
      },
    });
    const res = await GET(makeRequest("team-1"));
    expect(res.status).toBe(404);
  });

  it("returns transcript messages and token totals for the owning instructor", async () => {
    harness.setAuth(authedContext("instructor", { id: "instr-1" }));
    harness.adminClient.queue("teams", {
      data: {
        id: "team-1",
        name: "Team A",
        session_id: "s1",
        sessions: { instructor_id: "instr-1" },
      },
    });
    harness.adminClient.queue("coach_messages", {
      data: [
        { id: "m1", role: "user", content: "hi", input_tokens: null, output_tokens: null },
        { id: "m2", role: "assistant", content: "hello", input_tokens: 100, output_tokens: 20 },
      ],
    });

    const res = await GET(makeRequest("team-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.messages).toHaveLength(2);
    expect(body.usage).toEqual({ totalInputTokens: 100, totalOutputTokens: 20 });
  });
});
