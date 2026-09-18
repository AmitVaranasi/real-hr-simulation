import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getRuntimeSimulationConfig,
  setRuntimeSimulationConfig,
} from "@/lib/engine/simulation-config";

// Fake Supabase query builder covering only the chain simulation-config.ts
// actually uses: .from().select().eq().maybeSingle() for reads, and
// .from().upsert() / .from().insert() for writes.
const maybeSingle = vi.fn();
const insert = vi.fn().mockResolvedValue({ data: null, error: null });
const upsert = vi.fn().mockResolvedValue({ data: null, error: null });

function makeFromChain() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle })),
    })),
    upsert,
    insert,
  };
}

const from = vi.fn(() => makeFromChain());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from }),
}));

// Import after the mock is registered.
const {
  loadSimulationConfigFromDb,
  saveSimulationConfigToDb,
  withSimulationConfig,
} = await import("@/lib/db/simulation-config");

describe("simulation-config db layer", () => {
  beforeEach(() => {
    // The engine module keeps a single module-level `runtimeOverrides` object;
    // reset it explicitly so test order/isolation never leaks state between cases.
    setRuntimeSimulationConfig(null);
    maybeSingle.mockReset();
    insert.mockClear();
    upsert.mockClear();
    from.mockClear();
  });

  afterEach(() => {
    setRuntimeSimulationConfig(null);
  });

  it("returns the default config when no row exists", async () => {
    maybeSingle.mockResolvedValue({ data: null });
    const config = await loadSimulationConfigFromDb();
    expect(config).toEqual({ version: 3, overrides: {} });
  });

  it("returns the default config when the query throws (e.g. missing env/table)", async () => {
    maybeSingle.mockRejectedValue(new Error("boom"));
    const config = await loadSimulationConfigFromDb();
    expect(config).toEqual({ version: 3, overrides: {} });
  });

  it("merges a stored row's overrides on top of the defaults, preferring stored values", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        config_json: {
          version: 3,
          overrides: { discretionary_budget: 750_000 },
        },
      },
    });
    const config = await loadSimulationConfigFromDb();
    expect(config.overrides.discretionary_budget).toBe(750_000);
  });

  it("writes config_json via upsert and, unless skipRevision is set, also inserts a revision row", async () => {
    const doc = { version: 3 as const, overrides: { discretionary_budget: 1 } };
    await saveSimulationConfigToDb(doc, "user-1", { note: "tweak" });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "global",
        config_json: doc,
        updated_by: "user-1",
      })
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ config_json: doc, note: "tweak", created_by: "user-1" })
    );
  });

  it("skips the revision insert when skipRevision is true", async () => {
    const doc = { version: 3 as const, overrides: {} };
    await saveSimulationConfigToDb(doc, "user-1", { skipRevision: true });
    expect(upsert).toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("swallows a revision-insert failure so save still resolves (revisions table may not exist yet)", async () => {
    insert.mockRejectedValueOnce(new Error("no such table"));
    const doc = { version: 3 as const, overrides: {} };
    await expect(
      saveSimulationConfigToDb(doc, "user-1")
    ).resolves.toBeUndefined();
  });

  it("withSimulationConfig loads the doc, exposes it as the runtime overrides during fn, then clears it after", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        config_json: { version: 3, overrides: { discretionary_budget: 42 } },
      },
    });

    expect(getRuntimeSimulationConfig().discretionary_budget).toBeUndefined();

    let seenDuringRun: number | undefined;
    await withSimulationConfig(() => {
      seenDuringRun = getRuntimeSimulationConfig().discretionary_budget;
    });

    expect(seenDuringRun).toBe(42);
    expect(getRuntimeSimulationConfig().discretionary_budget).toBeUndefined();
  });

  it("withSimulationConfig clears the runtime override even if fn throws", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        config_json: { version: 3, overrides: { discretionary_budget: 99 } },
      },
    });

    await expect(
      withSimulationConfig(() => {
        throw new Error("fn failed");
      })
    ).rejects.toThrow("fn failed");

    expect(getRuntimeSimulationConfig().discretionary_budget).toBeUndefined();
  });
});
