import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHarness } from "@/test/harness";

// This route is intentionally unauthenticated (used on the join-team landing
// page before a session exists), so only the Supabase client is mocked.
const harness = createHarness();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => harness.serverClient,
}));

let GET: typeof import("@/app/api/teams/preview/route").GET;
beforeAll(async () => {
  ({ GET } = await import("@/app/api/teams/preview/route"));
});

beforeEach(() => {
  harness.reset();
});

function req(query: string) {
  return new Request(`http://localhost/api/teams/preview${query}`);
}

describe("GET /api/teams/preview", () => {
  it("400s when code is missing", async () => {
    const res = await GET(req(""));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("code required");
  });

  it("404s when the join code doesn't match a team", async () => {
    harness.serverClient.queue("teams", { data: null, error: null });
    const res = await GET(req("?code=nope"));
    expect(res.status).toBe(404);
  });

  it("returns the team preview on success", async () => {
    const team = {
      name: "Team A",
      industry: "High-Tech",
      strategy: "Innovation",
      sessions: { name: "Session A" },
    };
    harness.serverClient.queue("teams", { data: team, error: null });
    const res = await GET(req("?code=abc123"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.team).toEqual(team);
  });
});
