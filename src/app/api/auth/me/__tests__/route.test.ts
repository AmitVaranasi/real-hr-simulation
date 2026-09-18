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
  };
});

let GET: typeof import("@/app/api/auth/me/route").GET;
beforeAll(async () => {
  ({ GET } = await import("@/app/api/auth/me/route"));
});

beforeEach(() => {
  harness.reset();
});

describe("GET /api/auth/me", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns the current profile for any authenticated role", async () => {
    harness.setAuth(
      authedContext("student", {
        id: "student-1",
        email: "s@example.com",
        profileOverrides: { display_name: "Sam Student" },
      })
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      id: "student-1",
      email: "s@example.com",
      role: "student",
      display_name: "Sam Student",
    });
  });

  it("returns role: null when the profile row is missing", async () => {
    harness.setAuth({
      user: { id: "user-x", email: "x@example.com" },
      profile: null,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBeNull();
    expect(body.display_name).toBeNull();
  });
});
