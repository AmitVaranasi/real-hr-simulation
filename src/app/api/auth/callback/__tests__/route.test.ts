import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHarness } from "@/test/harness";

// This route has no requireAuth/requireInstructor* gate — it IS the OAuth /
// magic-link callback that establishes the session in the first place, so
// there is no caller identity to gate on yet. It's tested purely on the
// exchangeCodeForSession outcome and the resulting redirect target.
const harness = createHarness();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => harness.serverClient,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => harness.adminClient,
}));

let GET: typeof import("@/app/api/auth/callback/route").GET;
beforeAll(async () => {
  ({ GET } = await import("@/app/api/auth/callback/route"));
});

beforeEach(() => {
  harness.reset();
  harness.serverClient.auth.exchangeCodeForSession = async () => ({
    data: { session: null, user: null },
    error: null,
  });
  harness.serverClient.auth.getUser = async () => ({
    data: { user: { id: "user-1" } },
    error: null,
  });
});

function req(qs: string) {
  return new Request(`http://localhost/api/auth/callback${qs}`);
}

describe("GET /api/auth/callback", () => {
  it("redirects to /login?error=auth when there's no code", async () => {
    const res = await GET(req(""));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=auth");
  });

  it("redirects to /login?error=auth when the code exchange fails", async () => {
    harness.serverClient.auth.exchangeCodeForSession = async () => ({
      data: { session: null, user: null },
      error: { message: "invalid code" },
    });
    const res = await GET(req("?code=bad"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=auth");
  });

  it("redirects straight to the reset-password form for a recovery link, without a profile lookup", async () => {
    const res = await GET(req("?code=ok&next=/auth/reset-password"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/auth/reset-password");
  });

  it("redirects a student to the default /dashboard next", async () => {
    harness.serverClient.queue("profiles", { data: { role: "student" }, error: null });
    const res = await GET(req("?code=ok"));
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("redirects an instructor landing on /dashboard to /sessions instead", async () => {
    harness.serverClient.queue("profiles", { data: { role: "instructor" }, error: null });
    const res = await GET(req("?code=ok"));
    expect(res.headers.get("location")).toContain("/sessions");
  });

  it("redirects an admin to /admin when next isn't an allowed admin path", async () => {
    harness.serverClient.queue("profiles", { data: { role: "admin" }, error: null });
    const res = await GET(req("?code=ok&next=/dashboard"));
    expect(res.headers.get("location")).toContain("/admin");
  });

  it("lets an admin's next through when it's an allowed admin path", async () => {
    harness.serverClient.queue("profiles", { data: { role: "admin" }, error: null });
    const res = await GET(req("?code=ok&next=/admin/users"));
    expect(res.headers.get("location")).toContain("/admin/users");
  });

  it("sanitizes an open-redirect next (protocol-relative //)", async () => {
    harness.serverClient.queue("profiles", { data: { role: "student" }, error: null });
    const res = await GET(req("?code=ok&next=//evil.example.com"));
    expect(res.headers.get("location")).toContain("/dashboard");
    expect(res.headers.get("location")).not.toContain("evil.example.com");
  });
});
