import {
  ECONOMY_MULTIPLIERS,
  INDUSTRY_CONFIGS,
  STRATEGY_CONFIGS,
} from "./config";
import { DISCRETIONARY_BUDGET } from "./defaults";
import {
  DEFAULT_INDUSTRY_NORMS,
  type BudgetModuleKey,
  type IndustryNormProfile,
} from "./industry-norms";
import type { BenchmarkOverride } from "./benchmarks";
import type {
  EconomyCondition,
  Industry,
  IndustryConfig,
  Strategy,
  StrategyConfig,
} from "./types";

export interface SimulationConfigOverrides {
  discretionary_budget?: number;
  economy_multipliers?: Partial<
    Record<EconomyCondition, { revenue: number; expense: number }>
  >;
  industries?: Partial<Record<Industry, Partial<IndustryConfig>>>;
  strategies?: Partial<Record<Strategy, Partial<StrategyConfig>>>;
  industry_norms?: Partial<Record<Industry, Partial<IndustryNormProfile>>>;
  benchmarks?: Record<string, BenchmarkOverride>;
}

export interface SimulationConfigDocument {
  version: 3;
  overrides: SimulationConfigOverrides;
}

let runtimeOverrides: SimulationConfigOverrides = {};

export function defaultSimulationConfig(): SimulationConfigDocument {
  return { version: 3, overrides: {} };
}

export function setRuntimeSimulationConfig(
  doc: SimulationConfigDocument | SimulationConfigOverrides | null
): void {
  if (!doc) {
    runtimeOverrides = {};
    return;
  }
  runtimeOverrides =
    "overrides" in doc ? doc.overrides : doc;
}

export function getRuntimeSimulationConfig(): SimulationConfigOverrides {
  return runtimeOverrides;
}

export function getDiscretionaryBudget(): number {
  return runtimeOverrides.discretionary_budget ?? DISCRETIONARY_BUDGET;
}

export function getEconomyMultipliers(): typeof ECONOMY_MULTIPLIERS {
  const base = { ...ECONOMY_MULTIPLIERS };
  const custom = runtimeOverrides.economy_multipliers ?? {};
  for (const key of Object.keys(custom) as EconomyCondition[]) {
    if (custom[key]) {
      base[key] = { ...base[key], ...custom[key] };
    }
  }
  return base;
}

export function getIndustryConfigResolved(industry: Industry): IndustryConfig {
  const base = INDUSTRY_CONFIGS[industry];
  const patch = runtimeOverrides.industries?.[industry];
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    module_multipliers: {
      ...base.module_multipliers,
      ...patch.module_multipliers,
    },
    constraints: patch.constraints ?? base.constraints,
  };
}

export function getStrategyConfigResolved(strategy: Strategy): StrategyConfig {
  const base = STRATEGY_CONFIGS[strategy];
  const patch = runtimeOverrides.strategies?.[strategy];
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    bsc_weights: { ...base.bsc_weights, ...patch.bsc_weights },
    bonus_conditions: patch.bonus_conditions ?? base.bonus_conditions,
  };
}

function mergeIndustryNormProfile(
  base: IndustryNormProfile,
  patch?: Partial<IndustryNormProfile>
): IndustryNormProfile {
  if (!patch) return base;
  const merged: IndustryNormProfile = { ...base };
  if (patch.benefits_pct_of_comp) {
    merged.benefits_pct_of_comp = {
      min: patch.benefits_pct_of_comp.min ?? base.benefits_pct_of_comp?.min ?? 20,
      max: patch.benefits_pct_of_comp.max ?? base.benefits_pct_of_comp?.max ?? 40,
    };
  }
  for (const key of Object.keys(patch) as BudgetModuleKey[]) {
    const value = patch[key];
    if (value == null) continue;
    merged[key] = {
      ...base[key],
      ...value,
      suggested: value.suggested ?? base[key]?.suggested,
    };
  }
  return merged;
}

export function getIndustryNormsResolved(): typeof DEFAULT_INDUSTRY_NORMS {
  const custom = runtimeOverrides.industry_norms ?? {};
  return (Object.keys(DEFAULT_INDUSTRY_NORMS) as Industry[]).reduce(
    (acc, industry) => {
      acc[industry] = mergeIndustryNormProfile(
        DEFAULT_INDUSTRY_NORMS[industry],
        custom[industry]
      );
      return acc;
    },
    {} as typeof DEFAULT_INDUSTRY_NORMS
  );
}

export function getBenchmarkOverrides(): Record<string, BenchmarkOverride> {
  return runtimeOverrides.benchmarks ?? {};
}

export function buildEffectiveConfigSnapshot() {
  const industries = (Object.keys(INDUSTRY_CONFIGS) as Industry[]).reduce(
    (acc, key) => {
      acc[key] = getIndustryConfigResolved(key);
      return acc;
    },
    {} as Record<Industry, IndustryConfig>
  );

  const strategies = (Object.keys(STRATEGY_CONFIGS) as Strategy[]).reduce(
    (acc, key) => {
      acc[key] = getStrategyConfigResolved(key);
      return acc;
    },
    {} as Record<Strategy, StrategyConfig>
  );

  return {
    discretionary_budget: getDiscretionaryBudget(),
    economy_multipliers: getEconomyMultipliers(),
    industries,
    strategies,
    industry_norms: getIndustryNormsResolved(),
    benchmarks: getBenchmarkOverrides(),
  };
}

export function mergeSimulationConfig(
  stored: Partial<SimulationConfigDocument> | null
): SimulationConfigDocument {
  const base = defaultSimulationConfig();
  if (!stored?.overrides) return base;
  return {
    version: 3,
    overrides: {
      ...base.overrides,
      ...stored.overrides,
      economy_multipliers: {
        ...base.overrides.economy_multipliers,
        ...stored.overrides.economy_multipliers,
      },
      industries: { ...base.overrides.industries, ...stored.overrides.industries },
      strategies: { ...base.overrides.strategies, ...stored.overrides.strategies },
      industry_norms: {
        ...base.overrides.industry_norms,
        ...stored.overrides.industry_norms,
      },
      benchmarks: {
        ...base.overrides.benchmarks,
        ...stored.overrides.benchmarks,
      },
    },
  };
}
