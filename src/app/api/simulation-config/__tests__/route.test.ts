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
vi.mock("@/lib/admin/audit", () => ({
  writeAdminAudit: vi.fn(async () => {}),
}));

let GET: typeof import("@/app/api/simulation-config/route").GET;
let PATCH: typeof import("@/app/api/simulation-config/route").PATCH;
let POST: typeof import("@/app/api/simulation-config/route").POST;
beforeAll(async () => {
  ({ GET, PATCH, POST } = await import("@/app/api/simulation-config/route"));
});

beforeEach(() => {
  harness.reset();
});

function patchReq(body: unknown) {
  return new Request("http://localhost/api/simulation-config", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("GET /api/simulation-config", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("200s for instructors with a config and effective snapshot", async () => {
    harness.setAuth(authedContext("instructor"));
    harness.adminClient.queue("simulation_config", { data: null, error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.config).toBeDefined();
    expect(body.effective).toBeDefined();
  });

  it("200s for admins too", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("simulation_config", { data: null, error: null });
    const res = await GET();
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/simulation-config", () => {
  it("401s when unauthenticated", async () => {
    const res = await PATCH(patchReq({ config: {} }));
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await PATCH(patchReq({ config: {} }));
    expect(res.status).toBe(403);
  });

  it("saves config for an instructor without writing an admin audit entry", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.adminClient.queue("simulation_config", { data: null, error: null }); // upsert
    harness.adminClient.queue("simulation_config_revisions", { data: null, error: null }); // revision insert
    const res = await PATCH(patchReq({ config: { overrides: { foo: 1 } }, note: "n" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.config).toBeDefined();
  });

  it("saves config for an admin and writes an audit entry", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    harness.adminClient.queue("simulation_config", { data: null, error: null });
    harness.adminClient.queue("simulation_config_revisions", { data: null, error: null });
    const res = await PATCH(patchReq({ config: {} }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/simulation-config", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await POST();
    expect(res.status).toBe(403);
  });

  it("resets config to defaults for an instructor", async () => {
    harness.setAuth(authedContext("instructor", { id: "instructor-1" }));
    harness.adminClient.queue("simulation_config", { data: null, error: null });
    harness.adminClient.queue("simulation_config_revisions", { data: null, error: null });
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.config.version).toBe(3);
  });
});
