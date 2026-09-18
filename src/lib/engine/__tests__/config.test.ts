import { afterEach, describe, expect, it } from "vitest";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
  INDUSTRY_CONFIGS,
  STRATEGY_CONFIGS,
} from "../config";
import { setRuntimeSimulationConfig } from "../simulation-config";
import type { IndustryConfig, StrategyConfig } from "../types";

// getIndustryConfig/getStrategyConfig delegate to simulation-config's resolved
// getters, which read a module-level `runtimeOverrides` variable. That state
// leaks across tests unless explicitly cleared, so every test here resets it.
afterEach(() => {
  setRuntimeSimulationConfig(null);
});

describe("getIndustryConfig", () => {
  it("returns the unmodified base config when no runtime override exists", () => {
    expect(getIndustryConfig("Manufacturing")).toEqual(
      INDUSTRY_CONFIGS.Manufacturing
    );
  });

  it("deep-merges module_multipliers instead of replacing the whole object", () => {
    // Only `recruitment` is overridden; every other multiplier must survive
    // untouched. This exercises the `{ ...base.module_multipliers, ...patch.module_multipliers }`
    // merge in simulation-config.ts getIndustryConfigResolved.
    setRuntimeSimulationConfig({
      industries: {
        Manufacturing: {
          module_multipliers: { recruitment: 2 } as IndustryConfig["module_multipliers"],
        },
      },
    });
    const resolved = getIndustryConfig("Manufacturing");
    expect(resolved.module_multipliers.recruitment).toBe(2);
    expect(resolved.module_multipliers.performance).toBe(
      INDUSTRY_CONFIGS.Manufacturing.module_multipliers.performance
    );
    expect(resolved.module_multipliers.training).toBe(
      INDUSTRY_CONFIGS.Manufacturing.module_multipliers.training
    );
  });

  it("replaces constraints wholesale rather than merging the array", () => {
    // getIndustryConfigResolved uses `patch.constraints ?? base.constraints` —
    // an explicit patch.constraints array fully replaces the base list, it
    // does not concatenate with it.
    const overrideConstraints = [
      { condition: "custom", effect: "custom_penalty", value: 99 },
    ];
    setRuntimeSimulationConfig({
      industries: {
        Manufacturing: { constraints: overrideConstraints },
      },
    });
    const resolved = getIndustryConfig("Manufacturing");
    expect(resolved.constraints).toEqual(overrideConstraints);
    expect(resolved.constraints).toHaveLength(1);
  });

  it("overrides top-level scalar fields such as base_headcount", () => {
    setRuntimeSimulationConfig({
      industries: { Retail: { base_headcount: 999 } },
    });
    expect(getIndustryConfig("Retail").base_headcount).toBe(999);
    // Unrelated industries are unaffected by a patch scoped to Retail.
    expect(getIndustryConfig("Banking")).toEqual(INDUSTRY_CONFIGS.Banking);
  });
});

describe("getStrategyConfig", () => {
  it("returns the unmodified base config when no runtime override exists", () => {
    expect(getStrategyConfig("Innovation")).toEqual(
      STRATEGY_CONFIGS.Innovation
    );
  });

  it("deep-merges bsc_weights instead of replacing the whole object", () => {
    setRuntimeSimulationConfig({
      strategies: {
        Innovation: {
          bsc_weights: { financial: 50 } as StrategyConfig["bsc_weights"],
        },
      },
    });
    const resolved = getStrategyConfig("Innovation");
    expect(resolved.bsc_weights.financial).toBe(50);
    expect(resolved.bsc_weights.employee).toBe(
      STRATEGY_CONFIGS.Innovation.bsc_weights.employee
    );
    expect(resolved.bsc_weights.learning).toBe(
      STRATEGY_CONFIGS.Innovation.bsc_weights.learning
    );
  });

  it("replaces bonus_conditions wholesale rather than merging the array", () => {
    const overrideConditions = [
      { condition: "custom == 1", perspective: "process" as const, points: 9 },
    ];
    setRuntimeSimulationConfig({
      strategies: { Focus: { bonus_conditions: overrideConditions } },
    });
    const resolved = getStrategyConfig("Focus");
    expect(resolved.bonus_conditions).toEqual(overrideConditions);
  });
});

describe("priorStateFromIndustry", () => {
  it("derives prior state fields straight from the industry's base_* values", () => {
    const prior = priorStateFromIndustry("High-Tech");
    const cfg = INDUSTRY_CONFIGS["High-Tech"];
    expect(prior).toEqual({
      headcount: cfg.base_headcount,
      revenue: cfg.base_revenue,
      stock_price: cfg.base_stock_price,
      market_share: cfg.base_market_share,
      profit_margin: cfg.base_profit_margin,
      satisfaction: cfg.base_satisfaction,
      engagement: cfg.base_engagement,
      turnover_rate: cfg.base_turnover,
    });
  });

  it("lets explicit overrides win over the derived industry defaults", () => {
    const prior = priorStateFromIndustry("High-Tech", { headcount: 12345 });
    expect(prior.headcount).toBe(12345);
    // Non-overridden fields still come from the industry base.
    expect(prior.revenue).toBe(INDUSTRY_CONFIGS["High-Tech"].base_revenue);
  });

  it("ignores runtime industry overrides — it reads the static INDUSTRY_CONFIGS, not the resolved config", () => {
    // NOTE: priorStateFromIndustry indexes INDUSTRY_CONFIGS directly (config.ts:221),
    // unlike getIndustryConfig which goes through getIndustryConfigResolved. A
    // runtime override to base_headcount is therefore invisible here. This may
    // be intentional (prior state is meant to be industry-baseline, immutable
    // by admin config) but it is an inconsistency worth flagging since
    // getIndustryConfig() for the same industry WOULD reflect the override.
    setRuntimeSimulationConfig({
      industries: { Retail: { base_headcount: 999 } },
    });
    const prior = priorStateFromIndustry("Retail");
    expect(prior.headcount).toBe(INDUSTRY_CONFIGS.Retail.base_headcount);
    expect(prior.headcount).not.toBe(999);
  });
});
