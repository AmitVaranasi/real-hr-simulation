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

let POST: typeof import("@/app/api/admin/users/reset-password/route").POST;
beforeAll(async () => {
  ({ POST } = await import("@/app/api/admin/users/reset-password/route"));
});

beforeEach(() => {
  harness.reset();
  harness.adminClient.auth.resetPasswordForEmail = async () => ({ error: null });
});

function req(body: unknown) {
  return new Request("http://localhost/api/admin/users/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/users/reset-password", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(req({ email: "s@example.com" }));
    expect(res.status).toBe(401);
  });

  it("403s for instructors", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await POST(req({ email: "s@example.com" }));
    expect(res.status).toBe(403);
  });

  it("400s on invalid JSON", async () => {
    harness.setAuth(authedContext("admin"));
    const res = await POST(
      new Request("http://localhost/api/admin/users/reset-password", {
        method: "POST",
        body: "bad",
      })
    );
    expect(res.status).toBe(400);
  });

  it("400s when neither email nor userId is provided", async () => {
    harness.setAuth(authedContext("admin"));
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it("404s when userId doesn't resolve to a user", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.auth.admin.getUserById = async () => ({
      data: { user: null },
      error: { message: "not found" },
    });
    const res = await POST(req({ userId: "u1" }));
    expect(res.status).toBe(404);
  });

  it("500s when the reset email fails to send", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    harness.adminClient.auth.resetPasswordForEmail = async () => ({
      error: { message: "smtp down" },
    });
    const res = await POST(req({ email: "s@example.com" }));
    expect(res.status).toBe(500);
  });

  it("sends the reset email and returns ok on success (by email)", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    const res = await POST(req({ email: "S@Example.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("resolves email from userId when only userId is given", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    harness.adminClient.auth.admin.getUserById = async () => ({
      data: { user: { email: "Resolved@Example.com" } },
      error: null,
    });
    const res = await POST(req({ userId: "u1" }));
    expect(res.status).toBe(200);
  });
});
