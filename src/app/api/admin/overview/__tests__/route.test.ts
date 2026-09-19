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
    requireAdmin: harness.requireAdmin,
  };
});

let GET: typeof import("@/app/api/admin/overview/route").GET;
beforeAll(async () => {
  ({ GET } = await import("@/app/api/admin/overview/route"));
});

beforeEach(() => {
  harness.reset();
});

describe("GET /api/admin/overview", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("403s for instructors", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns aggregate counts on success", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("profiles", { data: null, error: null, count: 10 });
    harness.adminClient.queue("sessions", { data: null, error: null, count: 4 });
    harness.adminClient.queue("teams", { data: null, error: null, count: 12 });
    harness.adminClient.queue("profiles", { data: null, error: null, count: 3 });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.counts).toEqual({ users: 10, sessions: 4, teams: 12, instructors: 3 });
  });

  it("defaults missing counts to 0", async () => {
    harness.setAuth(authedContext("admin"));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.counts).toEqual({ users: 0, sessions: 0, teams: 0, instructors: 0 });
  });
});
