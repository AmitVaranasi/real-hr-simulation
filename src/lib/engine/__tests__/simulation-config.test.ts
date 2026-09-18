import { afterEach, describe, expect, it } from "vitest";
import { DISCRETIONARY_BUDGET } from "../defaults";
import {
  buildEffectiveConfigSnapshot,
  defaultSimulationConfig,
  getBenchmarkOverrides,
  getDiscretionaryBudget,
  getEconomyMultipliers,
  getIndustryConfigResolved,
  getIndustryNormsResolved,
  getRuntimeSimulationConfig,
  getStrategyConfigResolved,
  mergeSimulationConfig,
  setRuntimeSimulationConfig,
} from "../simulation-config";

// runtimeOverrides is module-level mutable state shared by every getter in
// this file. Reset it after each test so ordering within the suite (and
// across other suites importing this module) can never change results.
afterEach(() => {
  setRuntimeSimulationConfig(null);
});

describe("setRuntimeSimulationConfig / getRuntimeSimulationConfig", () => {
  it("defaults to an empty overrides object", () => {
    expect(getRuntimeSimulationConfig()).toEqual({});
  });

  it("accepts a bare overrides object directly", () => {
    setRuntimeSimulationConfig({ discretionary_budget: 100 });
    expect(getRuntimeSimulationConfig()).toEqual({ discretionary_budget: 100 });
  });

  it("unwraps a full SimulationConfigDocument via its 'overrides' key", () => {
    setRuntimeSimulationConfig({
      version: 3,
      overrides: { discretionary_budget: 200 },
    });
    expect(getRuntimeSimulationConfig()).toEqual({ discretionary_budget: 200 });
  });

  it("null clears back to empty overrides", () => {
    setRuntimeSimulationConfig({ discretionary_budget: 100 });
    setRuntimeSimulationConfig(null);
    expect(getRuntimeSimulationConfig()).toEqual({});
  });
});

describe("getDiscretionaryBudget", () => {
  it("falls back to the module default when unset", () => {
    expect(getDiscretionaryBudget()).toBe(DISCRETIONARY_BUDGET);
  });

  it("uses the override when set", () => {
    setRuntimeSimulationConfig({ discretionary_budget: 750_000 });
    expect(getDiscretionaryBudget()).toBe(750_000);
  });
});

describe("getEconomyMultipliers", () => {
  it("returns the base table untouched when there is no override", () => {
    expect(getEconomyMultipliers().boom).toEqual({ revenue: 1.1, expense: 1.03 });
  });

  it("merges a partial override into one condition without touching the others", () => {
    setRuntimeSimulationConfig({
      economy_multipliers: { boom: { revenue: 1.5, expense: 1.03 } },
    });
    const multipliers = getEconomyMultipliers();
    expect(multipliers.boom.revenue).toBe(1.5);
    // normal/recession must be unaffected by a boom-only override.
    expect(multipliers.normal).toEqual({ revenue: 1.0, expense: 1.0 });
    expect(multipliers.recession).toEqual({ revenue: 0.9, expense: 1.05 });
  });
});

describe("getIndustryConfigResolved", () => {
  it("returns the base config unchanged when there is no patch", () => {
    const base = getIndustryConfigResolved("Manufacturing");
    expect(base.module_multipliers.training).toBe(1.3);
  });

  it("deep-merges module_multipliers so unpatched keys survive", () => {
    setRuntimeSimulationConfig({
      industries: {
        Manufacturing: { module_multipliers: { training: 2.0 } as never },
      },
    });
    const resolved = getIndustryConfigResolved("Manufacturing");
    expect(resolved.module_multipliers.training).toBe(2.0);
    // recruitment wasn't in the patch — must still come from the base config.
    expect(resolved.module_multipliers.recruitment).toBe(1.05);
  });

  it("constraints is replaced wholesale by the patch, not merged element-wise", () => {
    const patchedConstraints = [
      { condition: "custom", effect: "custom_effect", value: 1 },
    ];
    setRuntimeSimulationConfig({
      industries: { Manufacturing: { constraints: patchedConstraints } },
    });
    expect(getIndustryConfigResolved("Manufacturing").constraints).toEqual(
      patchedConstraints
    );
  });

  it("falls back to base constraints when the patch omits them", () => {
    setRuntimeSimulationConfig({
      industries: { Manufacturing: { module_multipliers: { training: 2.0 } as never } },
    });
    expect(getIndustryConfigResolved("Manufacturing").constraints.length).toBe(1);
    expect(
      getIndustryConfigResolved("Manufacturing").constraints[0]!.condition
    ).toBe("training_effectiveness < 5");
  });
});

describe("getStrategyConfigResolved", () => {
  it("deep-merges bsc_weights and falls back on bonus_conditions", () => {
    setRuntimeSimulationConfig({
      strategies: { Focus: { bsc_weights: { financial: 99 } as never } },
    });
    const resolved = getStrategyConfigResolved("Focus");
    expect(resolved.bsc_weights.financial).toBe(99);
    // Other perspective weights are untouched by a financial-only patch.
    expect(resolved.bsc_weights.employee).toBeGreaterThan(0);
  });
});

describe("getIndustryNormsResolved / mergeIndustryNormProfile", () => {
  it("returns unpatched defaults for every industry when there is no override", () => {
    const norms = getIndustryNormsResolved();
    expect(norms.Manufacturing.training).toEqual({
      min: 3,
      max: 8,
      suggested: [5, 8],
      label: "Training",
    });
  });

  it("patches one module of one industry without touching siblings", () => {
    setRuntimeSimulationConfig({
      industry_norms: {
        Manufacturing: { training: { min: 1, max: 2, label: "Training" } },
      },
    });
    const norms = getIndustryNormsResolved();
    expect(norms.Manufacturing.training).toMatchObject({ min: 1, max: 2 });
    // recruitment untouched, and other industries untouched entirely.
    expect(norms.Manufacturing.recruitment).toEqual({
      min: 15,
      max: 26,
      suggested: [15, 22],
      label: "Recruitment",
    });
    expect(norms.Service.training).toEqual({
      min: 3,
      max: 8,
      suggested: [5, 7],
      label: "Training",
    });
  });

  it("carries forward the base 'suggested' tuple when the patch omits it", () => {
    setRuntimeSimulationConfig({
      industry_norms: {
        Retail: { compensation: { min: 61, max: 79, label: "Compensation" } },
      },
    });
    const norms = getIndustryNormsResolved();
    // Base Retail compensation.suggested is [60, 70] — a patch that only
    // changes min/max should not silently null out the suggested range.
    expect(norms.Retail.compensation!.suggested).toEqual([60, 70]);
  });

  it("defaults missing benefits_pct_of_comp bounds to 20/40 when patched partially", () => {
    setRuntimeSimulationConfig({
      industry_norms: {
        Banking: { benefits_pct_of_comp: { min: 25 } as { min: number; max: number } },
      },
    });
    const norms = getIndustryNormsResolved();
    expect(norms.Banking.benefits_pct_of_comp).toEqual({ min: 25, max: 40 });
  });
});

describe("getBenchmarkOverrides", () => {
  it("is empty when unset", () => {
    expect(getBenchmarkOverrides()).toEqual({});
  });

  it("surfaces the raw benchmarks override map", () => {
    setRuntimeSimulationConfig({
      benchmarks: { training_roi: { excellent: 30 } },
    });
    expect(getBenchmarkOverrides()).toEqual({
      training_roi: { excellent: 30 },
    });
  });
});

describe("buildEffectiveConfigSnapshot", () => {
  it("assembles resolved config for every industry and strategy key", () => {
    const snapshot = buildEffectiveConfigSnapshot();
    expect(Object.keys(snapshot.industries)).toEqual([
      "Manufacturing",
      "Service",
      "High-Tech",
      "Banking",
      "Retail",
    ]);
    expect(Object.keys(snapshot.strategies)).toContain("Focus");
    expect(snapshot.discretionary_budget).toBe(DISCRETIONARY_BUDGET);
  });
});

describe("mergeSimulationConfig", () => {
  it("returns the default document when stored config is null", () => {
    expect(mergeSimulationConfig(null)).toEqual(defaultSimulationConfig());
  });

  it("returns the default document when stored has no 'overrides' key", () => {
    expect(mergeSimulationConfig({} as never)).toEqual(defaultSimulationConfig());
  });

  it("layers stored overrides on top of the (empty) defaults, forcing version 3", () => {
    const merged = mergeSimulationConfig({
      version: 3,
      overrides: { discretionary_budget: 999 },
    });
    expect(merged.version).toBe(3);
    expect(merged.overrides.discretionary_budget).toBe(999);
  });

  it("merges nested override maps rather than replacing them wholesale", () => {
    const merged = mergeSimulationConfig({
      version: 3,
      overrides: {
        economy_multipliers: { boom: { revenue: 2, expense: 1 } },
        industries: { Retail: { module_multipliers: { training: 5 } as never } },
      },
    });
    // Because base.overrides.economy_multipliers is undefined, the spread
    // still yields just the stored value here — this pins that the merge is
    // a shallow key-merge one level down, not a deep merge of every field.
    expect(merged.overrides.economy_multipliers).toEqual({
      boom: { revenue: 2, expense: 1 },
    });
    expect(merged.overrides.industries).toEqual({
      Retail: { module_multipliers: { training: 5 } },
    });
  });
});
