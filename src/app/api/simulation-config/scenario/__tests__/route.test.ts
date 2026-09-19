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
    requireInstructorOrAdmin: harness.requireInstructorOrAdmin,
  };
});

let POST: typeof import("@/app/api/simulation-config/scenario/route").POST;
beforeAll(async () => {
  ({ POST } = await import("@/app/api/simulation-config/scenario/route"));
});

beforeEach(() => {
  harness.reset();
});

function req(body: unknown) {
  return new Request("http://localhost/api/simulation-config/scenario", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/simulation-config/scenario", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(req({}));
    expect(res.status).toBe(403);
  });

  it("runs a scenario with defaults for an instructor", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.adminClient.queue("simulation_config", { data: null, error: null });
    const res = await POST(req({}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.industry).toBe("Manufacturing");
    expect(body.strategy).toBe("Focus");
    expect(body.economy).toBe("normal");
    expect(body.outcome).toBeDefined();
    expect(body.trace).toBeDefined();
  });

  it("runs a scenario with explicit industry/strategy/economy for an admin", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("simulation_config", { data: null, error: null });
    const res = await POST(
      req({ industry: "High-Tech", strategy: "Innovation", economy: "boom" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.industry).toBe("High-Tech");
    expect(body.strategy).toBe("Innovation");
    expect(body.economy).toBe("boom");
  });
});
