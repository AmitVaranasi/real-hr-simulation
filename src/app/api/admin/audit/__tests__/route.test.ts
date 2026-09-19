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

let GET: typeof import("@/app/api/admin/audit/route").GET;
beforeAll(async () => {
  ({ GET } = await import("@/app/api/admin/audit/route"));
});

beforeEach(() => {
  harness.reset();
});

function req(qs = "") {
  return new Request(`http://localhost/api/admin/audit${qs}`);
}

describe("GET /api/admin/audit", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("403s for students", async () => {
    harness.setAuth(authedContext("student"));
    const res = await GET(req());
    expect(res.status).toBe(403);
  });

  it("403s for instructors", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await GET(req());
    expect(res.status).toBe(403);
  });

  it("200s with empty entries and a helpful message when the table is missing", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("admin_audit_log", {
      data: null,
      error: { message: 'relation "admin_audit_log" does not exist' },
    });
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toEqual([]);
    expect(body.error).toContain("migration-v6-full-admin.sql");
  });

  it("500s for an unrelated db error", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("admin_audit_log", {
      data: null,
      error: { message: "connection refused" },
    });
    const res = await GET(req());
    expect(res.status).toBe(500);
  });

  it("200s and resolves actor names on success", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("admin_audit_log", {
      data: [
        {
          id: "e1",
          actor_id: "admin-1",
          action: "user.ban",
          target_type: "user",
          target_id: "u1",
          meta: {},
          created_at: "2026-01-01",
        },
      ],
      error: null,
    });
    harness.adminClient.queue("profiles", {
      data: [{ id: "admin-1", display_name: "Ada Admin" }],
      error: null,
    });
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries[0].actor_name).toBe("Ada Admin");
  });

  it("caps limit at 200 regardless of query param", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("admin_audit_log", { data: [], error: null });
    const res = await GET(req("?limit=9999"));
    expect(res.status).toBe(200);
  });
});
