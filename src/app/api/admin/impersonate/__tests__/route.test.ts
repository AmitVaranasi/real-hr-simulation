import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHarness, authedContext } from "@/test/harness";

const harness = createHarness();

// admin/impersonate reads/writes an httpOnly cookie directly via
// next/headers and stands up a second Supabase client via @supabase/ssr to
// call verifyOtp — neither goes through the harness's fake clients, so both
// are mocked here. cookieStore is a simple in-memory stand-in shared across
// getAll()/get()/set()/delete() calls within one test.
let cookieStore: Map<string, { value: string }>;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookieStore.get(name),
    getAll: () => [...cookieStore.entries()].map(([name, { value }]) => ({ name, value })),
    set: (name: string, value: string) => cookieStore.set(name, { value }),
    delete: (name: string) => cookieStore.delete(name),
  }),
}));

const verifyOtp = vi.fn(async () => ({ error: null as { message: string } | null }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { verifyOtp },
  }),
}));

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

let GET: typeof import("@/app/api/admin/impersonate/route").GET;
let POST: typeof import("@/app/api/admin/impersonate/route").POST;
beforeAll(async () => {
  ({ GET, POST } = await import("@/app/api/admin/impersonate/route"));
});

beforeEach(() => {
  harness.reset();
  cookieStore = new Map();
  verifyOtp.mockClear();
  verifyOtp.mockResolvedValue({ error: null });
});

function postReq(body: unknown) {
  return new Request("http://localhost/api/admin/impersonate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("GET /api/admin/impersonate", () => {
  it("returns impersonating:false when there's no restore cookie", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.impersonating).toBe(false);
  });

  it("reports the current impersonation state from the restore cookie", async () => {
    cookieStore.set("rh_admin_restore", {
      value: JSON.stringify({ admin_id: "admin-1", target_id: "student-1" }),
    });
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({
      impersonating: true,
      admin_id: "admin-1",
      target_id: "student-1",
    });
  });
});

describe("POST /api/admin/impersonate", () => {
  it("401s when unauthenticated", async () => {
    const res = await POST(postReq({ userId: "u1" }));
    expect(res.status).toBe(401);
  });

  it("403s for instructors", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await POST(postReq({ userId: "u1" }));
    expect(res.status).toBe(403);
  });

  it("400s when userId is missing", async () => {
    harness.setAuth(authedContext("admin"));
    const res = await POST(postReq({}));
    expect(res.status).toBe(400);
  });

  it("400s when impersonating self", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    const res = await POST(postReq({ userId: "admin-1" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Cannot impersonate yourself");
  });

  it("404s when the target user doesn't exist", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    harness.adminClient.auth.admin.getUserById = async () => ({
      data: { user: null },
      error: { message: "not found" },
    });
    const res = await POST(postReq({ userId: "student-1" }));
    expect(res.status).toBe(404);
  });

  it("400s when the target user is disabled", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    harness.adminClient.auth.admin.getUserById = async () => ({
      data: { user: { email: "s1@example.com" } },
      error: null,
    });
    harness.adminClient.queue("profiles", {
      data: { role: "student", disabled_at: "2026-01-01" },
      error: null,
    });
    const res = await POST(postReq({ userId: "student-1" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Cannot impersonate a disabled user");
  });

  it("400s when the admin has no restorable session", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    harness.adminClient.auth.admin.getUserById = async () => ({
      data: { user: { email: "s1@example.com" } },
      error: null,
    });
    harness.adminClient.queue("profiles", {
      data: { role: "student", disabled_at: null },
      error: null,
    });
    harness.serverClient.auth.getSession = async () => ({
      data: { session: null },
      error: null,
    });
    const res = await POST(postReq({ userId: "student-1" }));
    expect(res.status).toBe(400);
  });

  it("impersonates successfully and sets the restore cookie", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    harness.adminClient.auth.admin.getUserById = async () => ({
      data: { user: { email: "s1@example.com" } },
      error: null,
    });
    harness.adminClient.queue("profiles", {
      data: { role: "student", disabled_at: null },
      error: null,
    });
    harness.serverClient.auth.getSession = async () => ({
      data: {
        session: { access_token: "at", refresh_token: "rt" },
      },
      error: null,
    });
    harness.adminClient.auth.admin.generateLink = async () => ({
      data: { properties: { hashed_token: "hashed" } },
      error: null,
    });

    const res = await POST(postReq({ userId: "student-1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.target.id).toBe("student-1");
    expect(body.home).toBe("/dashboard");
    expect(verifyOtp).toHaveBeenCalled();
  });
});
