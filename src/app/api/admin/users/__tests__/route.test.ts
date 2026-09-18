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

let GET: typeof import("@/app/api/admin/users/route").GET;
let PATCH: typeof import("@/app/api/admin/users/route").PATCH;
beforeAll(async () => {
  ({ GET, PATCH } = await import("@/app/api/admin/users/route"));
});

beforeEach(() => {
  harness.reset();
  harness.adminClient.auth.admin.listUsers = async () => ({
    data: { users: [] },
    error: null,
  });
  harness.adminClient.auth.admin.updateUserById = async () => ({
    data: {},
    error: null,
  });
});

function patchReq(body: unknown) {
  return new Request("http://localhost/api/admin/users", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("GET /api/admin/users", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("403s for instructors", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("lists users merging profile and auth ban state on success", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("profiles", {
      data: [
        {
          id: "u1",
          display_name: "User One",
          role: "student",
          created_at: "2026-01-01",
          disabled_at: null,
          disabled_reason: null,
        },
      ],
      error: null,
    });
    harness.adminClient.auth.admin.listUsers = async () => ({
      data: { users: [{ id: "u1", email: "U1@Example.com" }] },
      error: null,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.users).toHaveLength(1);
    expect(body.users[0].email).toBe("u1@example.com");
    expect(body.users[0].disabled).toBe(false);
  });

  it("500s when both the primary and fallback profile queries fail", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("profiles", {
      data: null,
      error: { message: "missing column" },
    });
    harness.adminClient.queue("profiles", {
      data: null,
      error: { message: "still broken" },
    });
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/users", () => {
  it("401s when unauthenticated", async () => {
    const res = await PATCH(patchReq({ userId: "u1", role: "instructor" }));
    expect(res.status).toBe(401);
  });

  it("403s for instructors", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await PATCH(patchReq({ userId: "u1", role: "instructor" }));
    expect(res.status).toBe(403);
  });

  it("400s on invalid JSON", async () => {
    harness.setAuth(authedContext("admin"));
    const res = await PATCH(
      new Request("http://localhost/api/admin/users", {
        method: "PATCH",
        body: "not json",
      })
    );
    expect(res.status).toBe(400);
  });

  it("400s when userId is missing", async () => {
    harness.setAuth(authedContext("admin"));
    const res = await PATCH(patchReq({ role: "instructor" }));
    expect(res.status).toBe(400);
  });

  it("blocks an admin from disabling their own account", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    const res = await PATCH(patchReq({ userId: "admin-1", disabled: true }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("You cannot disable your own account");
  });

  it("blocks an admin from removing their own admin role", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    const res = await PATCH(patchReq({ userId: "admin-1", role: "student" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("You cannot remove your own admin role");
  });

  it("400s for an invalid role value", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    const res = await PATCH(patchReq({ userId: "u2", role: "superuser" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid role");
  });

  it("changes a user's role on success", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    const updated = { id: "u2", display_name: "U2", role: "instructor", created_at: "2026-01-01" };
    harness.adminClient.queue("profiles", { data: updated, error: null });
    const res = await PATCH(patchReq({ userId: "u2", role: "instructor" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual(updated);
  });

  it("disables a user on success", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    const updated = {
      id: "u2",
      display_name: "U2",
      role: "student",
      created_at: "2026-01-01",
      disabled_at: "2026-09-18T00:00:00.000Z",
      disabled_reason: "abuse",
    };
    harness.adminClient.queue("profiles", { data: updated, error: null });
    const res = await PATCH(
      patchReq({ userId: "u2", disabled: true, disabled_reason: "abuse" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.user).toEqual(updated);
  });
});
