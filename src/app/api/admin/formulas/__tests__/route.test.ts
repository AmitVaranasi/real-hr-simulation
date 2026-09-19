import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHarness, authedContext } from "@/test/harness";
import { FORMULA_CATALOG } from "@/lib/engine/formula-catalog";

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

let GET: typeof import("@/app/api/admin/formulas/route").GET;
let PATCH: typeof import("@/app/api/admin/formulas/route").PATCH;
beforeAll(async () => {
  ({ GET, PATCH } = await import("@/app/api/admin/formulas/route"));
});

beforeEach(() => {
  harness.reset();
});

function patchReq(body: unknown) {
  return new Request("http://localhost/api/admin/formulas", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

const firstFormulaId = FORMULA_CATALOG[0].id;

describe("GET /api/admin/formulas", () => {
  it("401s when unauthenticated", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("403s for instructors", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns the full catalog with null overrides when no notes exist", async () => {
    harness.setAuth(authedContext("admin"));
    harness.adminClient.queue("formula_notes", { data: [], error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.formulas).toHaveLength(FORMULA_CATALOG.length);
    expect(body.formulas[0].expression_override).toBeNull();
  });
});

describe("PATCH /api/admin/formulas", () => {
  it("401s when unauthenticated", async () => {
    const res = await PATCH(patchReq({ formulaId: firstFormulaId }));
    expect(res.status).toBe(401);
  });

  it("403s for instructors", async () => {
    harness.setAuth(authedContext("instructor"));
    const res = await PATCH(patchReq({ formulaId: firstFormulaId }));
    expect(res.status).toBe(403);
  });

  it("400s on invalid JSON", async () => {
    harness.setAuth(authedContext("admin"));
    const res = await PATCH(
      new Request("http://localhost/api/admin/formulas", {
        method: "PATCH",
        body: "not json",
      })
    );
    expect(res.status).toBe(400);
  });

  it("400s for an unknown formulaId", async () => {
    harness.setAuth(authedContext("admin"));
    const res = await PATCH(patchReq({ formulaId: "does-not-exist" }));
    expect(res.status).toBe(400);
  });

  it("upserts the note and returns ok on success", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    harness.adminClient.queue("formula_notes", { data: null, error: null }); // upsert
    const res = await PATCH(
      patchReq({ formulaId: firstFormulaId, expression_override: "x*2", notes: "note" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("500s with a migration hint when formula_notes is missing", async () => {
    harness.setAuth(authedContext("admin", { id: "admin-1" }));
    harness.adminClient.queue("formula_notes", {
      data: null,
      error: { message: 'relation "formula_notes" does not exist' },
    });
    const res = await PATCH(
      patchReq({ formulaId: firstFormulaId, expression_override: "x*2", notes: "note" })
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("migration-v6-full-admin.sql");
  });
});
