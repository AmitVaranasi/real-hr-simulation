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
vi.mock("@/lib/admin/audit", () => ({
  writeAdminAudit: vi.fn(async () => {}),
}));

let GET: typeof import("@/app/api/admin/versions/route").GET;
let POST: typeof import("@/app/api/admin/versions/route").POST;
beforeAll(async () => {
  ({ GET, POST } = await import("@/app/api/admin/versions/route"));
});

beforeEach(() => {
  harness.reset();
});

function postReq(body: unknown) {
  return new Request("http://localhost/api/admin/versions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("GET /api/admin/versions", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("403s for instructors", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("lists revisions alongside the current config", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("simulation_config_revisions", {
      data: [
        {
          id: "rev-1",
          note: "n",
          source: "manual",
          created_at: "2026-01-01",
          created_by: "admin-1",
          config_json: { a: 1 },
        },
      ],
      error: null,
    });
    harness.adminClient.queue("simulation_config", { data: null, error: null }); // loadSimulationConfigFromDb
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.revisions).toHaveLength(1);
    expect(body.revisions[0].has_config).toBe(true);
    expect(body.current).toBeDefined();
  });

  it("200s with empty revisions and a migration hint when the table is missing", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("simulation_config_revisions", {
      data: null,
      error: { message: 'relation "simulation_config_revisions" does not exist' },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.revisions).toEqual([]);
  });
});

describe("POST /api/admin/versions", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(postReq({ action: "snapshot" }));
    expect(res.status).toBe(401);
  });

  it("403s for instructors", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await POST(postReq({ action: "snapshot" }));
    expect(res.status).toBe(403);
  });

  it("400s on invalid JSON", async () => {
    harness.setAuth(authedContext("admin"));
    const res = await POST(
      new Request("http://localhost/api/admin/versions", { method: "POST", body: "bad" })
    );
    expect(res.status).toBe(400);
  });

  it("snapshots the current config on action=snapshot", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    harness.adminClient.queue("simulation_config", { data: null, error: null }); // load
    harness.adminClient.queue("simulation_config", { data: null, error: null }); // upsert
    harness.adminClient.queue("simulation_config_revisions", { data: null, error: null }); // insert
    const res = await POST(postReq({ action: "snapshot", note: "manual note" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("400s for restore without a revisionId", async () => {
    harness.setAuth(authedContext("admin"));
    const res = await POST(postReq({ action: "restore" }));
    expect(res.status).toBe(400);
  });

  it("404s for restore when the revision doesn't exist", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("simulation_config_revisions", { data: null, error: null });
    const res = await POST(postReq({ action: "restore", revisionId: "rev-x" }));
    expect(res.status).toBe(404);
  });

  it("restores a revision on success", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    harness.adminClient.queue("simulation_config_revisions", {
      data: { config_json: {}, note: "n" },
      error: null,
    });
    harness.adminClient.queue("simulation_config", { data: null, error: null }); // upsert
    harness.adminClient.queue("simulation_config_revisions", { data: null, error: null }); // insert
    const res = await POST(postReq({ action: "restore", revisionId: "rev-1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("400s for an unknown action", async () => {
    harness.setAuth(authedContext("admin"));
    const res = await POST(postReq({ action: "bogus" }));
    expect(res.status).toBe(400);
  });
});
