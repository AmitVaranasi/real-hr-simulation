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

let POST: typeof import("@/app/api/simulation-config/export-scenarios/route").POST;
beforeAll(async () => {
  ({ POST } = await import("@/app/api/simulation-config/export-scenarios/route"));
});

beforeEach(() => {
  harness.reset();
});

function req(body: unknown) {
  return new Request("http://localhost/api/simulation-config/export-scenarios", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/simulation-config/export-scenarios", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST(req({}));
    expect(res.status).toBe(403);
  });

  it("returns JSON scenarios for all industries by default", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.adminClient.queue("simulation_config", { data: null, error: null });
    const res = await POST(req({}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scenarios).toHaveLength(5);
    expect(body.scenarios[0].trace).toBeUndefined();
    expect(body.scenarios_full[0].trace).toBeDefined();
  });

  it("returns CSV when format=csv", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.adminClient.queue("simulation_config", { data: null, error: null });
    const res = await POST(req({ format: "csv" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv");
    const text = await res.text();
    expect(text.split("\n")).toHaveLength(6); // header + 5 industries
  });

  it("tolerates invalid JSON by falling back to defaults", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.adminClient.queue("simulation_config", { data: null, error: null });
    const res = await POST(
      new Request("http://localhost/api/simulation-config/export-scenarios", {
        method: "POST",
        body: "not json",
      })
    );
    expect(res.status).toBe(200);
  });
});
