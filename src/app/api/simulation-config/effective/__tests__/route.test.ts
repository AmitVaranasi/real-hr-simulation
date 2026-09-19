import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHarness } from "@/test/harness";

// This route intentionally has no auth gate (see its own comment: "Public
// read-only effective config for client engine previews (no secrets)"). No
// requireAuth/requireInstructor* is mocked in, since none is called.
const harness = createHarness();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => harness.serverClient,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => harness.adminClient,
}));

let GET: typeof import("@/app/api/simulation-config/effective/route").GET;
beforeAll(async () => {
  ({ GET } = await import("@/app/api/simulation-config/effective/route"));
});

beforeEach(() => {
  harness.reset();
});

describe("GET /api/simulation-config/effective", () => {
  it("200s without any authentication (public by design)", async () => {
    harness.adminClient.queue("simulation_config", { data: null, error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.config).toBeDefined();
    expect(body.effective).toBeDefined();
  });

  it("falls back to the default config when the db load errors", async () => {
    harness.adminClient.queue("simulation_config", {
      data: null,
      error: { message: "connection refused" },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.config.version).toBe(3);
  });
});
