import {
  ECONOMY_MULTIPLIERS,
  INDUSTRY_CONFIGS,
  STRATEGY_CONFIGS,
} from "./config";
import { DISCRETIONARY_BUDGET } from "./defaults";
import { DEFAULT_INDUSTRY_NORMS } from "./industry-norms";
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
  industry_norms?: typeof DEFAULT_INDUSTRY_NORMS;
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

export function getIndustryNormsResolved(): typeof DEFAULT_INDUSTRY_NORMS {
  return {
    ...DEFAULT_INDUSTRY_NORMS,
    ...(runtimeOverrides.industry_norms ?? {}),
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
        ...DEFAULT_INDUSTRY_NORMS,
        ...stored.overrides.industry_norms,
      },
    },
  };
}
