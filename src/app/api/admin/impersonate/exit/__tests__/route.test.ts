import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// This route has NO requireAdmin/requireAuth gate at all — it only checks
// for the presence of the rh_admin_restore cookie. That is intentional: the
// caller is mid-impersonation (signed in as the target user, not the admin),
// so an auth-role gate would lock them out of exiting. Its only "auth" is
// possessing a valid signed restore cookie payload.
let cookieStore: Map<string, { value: string }>;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookieStore.get(name),
    getAll: () => [...cookieStore.entries()].map(([name, { value }]) => ({ name, value })),
    set: (name: string, value: string) => cookieStore.set(name, { value }),
    delete: (name: string) => cookieStore.delete(name),
  }),
}));

const setSession = vi.fn(async () => ({ error: null as { message: string } | null }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { setSession },
  }),
}));

vi.mock("@/lib/admin/audit", () => ({
  writeAdminAudit: vi.fn(async () => {}),
}));

let POST: typeof import("@/app/api/admin/impersonate/exit/route").POST;
beforeAll(async () => {
  ({ POST } = await import("@/app/api/admin/impersonate/exit/route"));
});

beforeEach(() => {
  cookieStore = new Map();
  setSession.mockClear();
  setSession.mockResolvedValue({ error: null });
});

describe("POST /api/admin/impersonate/exit", () => {
  it("400s when there's no restore cookie", async () => {
    const res = await POST();
    expect(res.status).toBe(400);
  });

  it("400s and clears the cookie on a corrupt restore cookie", async () => {
    cookieStore.set("rh_admin_restore", { value: "not json" });
    const res = await POST();
    expect(res.status).toBe(400);
  });

  it("500s when restoring the admin session fails", async () => {
    cookieStore.set("rh_admin_restore", {
      value: JSON.stringify({
        access_token: "at",
        refresh_token: "rt",
        admin_id: "admin-1",
        target_id: "student-1",
      }),
    });
    setSession.mockResolvedValueOnce({ error: { message: "expired" } });
    const res = await POST();
    expect(res.status).toBe(500);
  });

  it("restores the admin session and clears the cookie on success", async () => {
    cookieStore.set("rh_admin_restore", {
      value: JSON.stringify({
        access_token: "at",
        refresh_token: "rt",
        admin_id: "admin-1",
        target_id: "student-1",
      }),
    });
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, home: "/admin" });
    expect(setSession).toHaveBeenCalledWith({ access_token: "at", refresh_token: "rt" });
  });
});
