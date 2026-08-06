"use client";

import { useState } from "react";
import { formInputClassName, formSelectClassName } from "@/components/ui/form-controls";
import { ECONOMY_MULTIPLIERS, INDUSTRY_CONFIGS, STRATEGY_CONFIGS } from "@/lib/engine/config";
import { SCORING_BENCHMARKS } from "@/lib/engine/benchmarks";
import type { BenchmarkOverride } from "@/lib/engine/benchmarks";
import {
  DEFAULT_INDUSTRY_NORMS,
  type BudgetModuleKey,
  type ModuleNormRange,
} from "@/lib/engine/industry-norms";
import type { SimulationConfigOverrides } from "@/lib/engine/simulation-config";
import type { EconomyCondition, Industry, Strategy } from "@/lib/engine/types";

const INDUSTRIES = Object.keys(INDUSTRY_CONFIGS) as Industry[];
const STRATEGIES = Object.keys(STRATEGY_CONFIGS) as Strategy[];
const ECONOMIES = Object.keys(ECONOMY_MULTIPLIERS) as EconomyCondition[];
const MODULE_KEYS = [
  "recruitment",
  "performance",
  "training",
  "relations",
  "compensation",
  "org_design",
  "dei",
] as const;

type Props = {
  overrides: SimulationConfigOverrides;
  onChange: (next: SimulationConfigOverrides) => void;
  discretionaryBudget: number;
  onBudgetChange: (n: number) => void;
};

function patchIndustry(
  overrides: SimulationConfigOverrides,
  industry: Industry,
  patch: Record<string, unknown>
): SimulationConfigOverrides {
  return {
    ...overrides,
    industries: {
      ...overrides.industries,
      [industry]: {
        ...overrides.industries?.[industry],
        ...patch,
      },
    },
  };
}

function patchModuleMult(
  overrides: SimulationConfigOverrides,
  industry: Industry,
  module: (typeof MODULE_KEYS)[number],
  value: number
): SimulationConfigOverrides {
  const current = overrides.industries?.[industry];
  const base = INDUSTRY_CONFIGS[industry].module_multipliers;
  return patchIndustry(overrides, industry, {
    module_multipliers: {
      ...base,
      ...current?.module_multipliers,
      [module]: value,
    },
  });
}

export function ConfigParametersPanel({
  overrides,
  onChange,
  discretionaryBudget,
  onBudgetChange,
}: Props) {
  return (
    <div className="space-y-6">
      <label className="block text-sm">
        <span className="font-medium text-[var(--portal-ink)]">Discretionary HR budget</span>
        <input
          type="number"
          step={10000}
          className={`mt-1 w-full max-w-xs ${formInputClassName}`}
          value={discretionaryBudget}
          onChange={(e) => onBudgetChange(Number(e.target.value))}
        />
      </label>

      <div>
        <h3 className="font-medium text-slate-800">Economy multipliers</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {ECONOMIES.map((econ) => (
            <div key={econ} className="rounded-lg border border-[var(--portal-sidebar-border)] p-3 text-sm">
              <p className="font-medium capitalize">{econ}</p>
              <label className="mt-2 block">
                Revenue mult.
                <input
                  type="number"
                  step={0.01}
                  className={`mt-1 w-full ${formInputClassName}`}
                  value={
                    overrides.economy_multipliers?.[econ]?.revenue ??
                    ECONOMY_MULTIPLIERS[econ].revenue
                  }
                  onChange={(ev) =>
                    onChange({
                      ...overrides,
                      economy_multipliers: {
                        ...overrides.economy_multipliers,
                        [econ]: {
                          revenue: Number(ev.target.value),
                          expense:
                            overrides.economy_multipliers?.[econ]?.expense ??
                            ECONOMY_MULTIPLIERS[econ].expense,
                        },
                      },
                    })
                  }
                />
              </label>
              <label className="mt-2 block">
                Expense mult.
                <input
                  type="number"
                  step={0.01}
                  className={`mt-1 w-full ${formInputClassName}`}
                  value={
                    overrides.economy_multipliers?.[econ]?.expense ??
                    ECONOMY_MULTIPLIERS[econ].expense
                  }
                  onChange={(ev) =>
                    onChange({
                      ...overrides,
                      economy_multipliers: {
                        ...overrides.economy_multipliers,
                        [econ]: {
                          revenue:
                            overrides.economy_multipliers?.[econ]?.revenue ??
                            ECONOMY_MULTIPLIERS[econ].revenue,
                          expense: Number(ev.target.value),
                        },
                      },
                    })
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ConfigIndustryPanel({
  overrides,
  onChange,
}: Pick<Props, "overrides" | "onChange">) {
  const [selected, setSelected] = useState<Industry>("Manufacturing");
  const base = INDUSTRY_CONFIGS[selected];
  const patch = overrides.industries?.[selected] ?? {};

  return (
    <div className="space-y-4">
      <select
        className={formSelectClassName}
        value={selected}
        onChange={(e) => setSelected(e.target.value as Industry)}
      >
        {INDUSTRIES.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["base_market_salary", "Market salary"],
            ["base_headcount", "Headcount"],
            ["base_turnover", "Base turnover %"],
            ["base_profit_margin", "Profit margin %"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              type="number"
              className={`mt-1 w-full ${formInputClassName}`}
              value={Number(patch[key] ?? base[key])}
              onChange={(e) =>
                onChange(
                  patchIndustry(overrides, selected, {
                    [key]: Number(e.target.value),
                  })
                )
              }
            />
          </label>
        ))}
      </div>

      <div>
        <h4 className="text-sm font-medium text-[var(--portal-ink)]">Module multipliers</h4>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {MODULE_KEYS.map((mod) => (
            <label key={mod} className="text-sm capitalize">
              {mod.replace("_", " ")}
              <input
                type="number"
                step={0.05}
                className={`mt-1 w-full ${formInputClassName}`}
                value={
                  patch.module_multipliers?.[mod] ??
                  base.module_multipliers[mod]
                }
                onChange={(e) =>
                  onChange(
                    patchModuleMult(
                      overrides,
                      selected,
                      mod,
                      Number(e.target.value)
                    )
                  )
                }
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ConfigStrategyPanel({
  overrides,
  onChange,
}: Pick<Props, "overrides" | "onChange">) {
  const [selected, setSelected] = useState<Strategy>("Focus");
  const base = STRATEGY_CONFIGS[selected];
  const weights = {
    ...base.bsc_weights,
    ...overrides.strategies?.[selected]?.bsc_weights,
  };

  return (
    <div className="space-y-4">
      <select
        className={formSelectClassName}
        value={selected}
        onChange={(e) => setSelected(e.target.value as Strategy)}
      >
        {STRATEGIES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["financial", "Financial max"],
            ["employee", "Employee max"],
            ["process", "Process max"],
            ["learning", "Learning max"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              type="number"
              className={`mt-1 w-full ${formInputClassName}`}
              value={weights[key]}
              onChange={(e) =>
                onChange({
                  ...overrides,
                  strategies: {
                    ...overrides.strategies,
                    [selected]: {
                      ...overrides.strategies?.[selected],
                      bsc_weights: {
                        ...weights,
                        [key]: Number(e.target.value),
                      },
                    },
                  },
                })
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export function ConfigBenchmarkPanel({
  overrides,
  onChange,
}: Pick<Props, "overrides" | "onChange">) {
  const benchOverrides = overrides.benchmarks ?? {};

  function updateBench(id: string, field: keyof BenchmarkOverride, value: number) {
    onChange({
      ...overrides,
      benchmarks: {
        ...benchOverrides,
        [id]: {
          ...benchOverrides[id],
          [field]: value,
        },
      },
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-[var(--portal-page)] text-left text-[var(--portal-muted)]">
          <tr>
            <th className="px-2 py-2">Metric</th>
            <th className="px-2 py-2">Perspective</th>
            <th className="px-2 py-2">Excellent</th>
            <th className="px-2 py-2">Moderate</th>
            <th className="px-2 py-2">Poor</th>
          </tr>
        </thead>
        <tbody>
          {SCORING_BENCHMARKS.map((b) => {
            const o = benchOverrides[b.id] ?? {};
            return (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="px-2 py-2 font-medium">{b.label}</td>
                <td className="px-2 py-2 capitalize">{b.perspective}</td>
                {(["excellent", "moderate", "poor"] as const).map((field) => (
                  <td key={field} className="px-2 py-2">
                    <input
                      type="number"
                      step={0.1}
                      className={`w-24 ${formInputClassName}`}
                      value={o[field] ?? b[field]}
                      onChange={(e) =>
                        updateBench(b.id, field, Number(e.target.value))
                      }
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const NORM_MODULES: BudgetModuleKey[] = [
  "recruitment",
  "performance",
  "training",
  "relations",
  "compensation",
  "org_design",
];

function patchIndustryNorm(
  overrides: SimulationConfigOverrides,
  industry: Industry,
  module: BudgetModuleKey,
  patch: Partial<ModuleNormRange>
): SimulationConfigOverrides {
  const current = overrides.industry_norms?.[industry] ?? {};
  const baseModule = DEFAULT_INDUSTRY_NORMS[industry][module];
  return {
    ...overrides,
    industry_norms: {
      ...overrides.industry_norms,
      [industry]: {
        ...current,
        [module]: {
          ...baseModule,
          ...current[module],
          ...patch,
          suggested:
            patch.suggested ??
            current[module]?.suggested ??
            baseModule?.suggested,
        },
      },
    },
  };
}

function patchBenefitsNorm(
  overrides: SimulationConfigOverrides,
  industry: Industry,
  field: "min" | "max",
  value: number
): SimulationConfigOverrides {
  const current = overrides.industry_norms?.[industry] ?? {};
  const base = DEFAULT_INDUSTRY_NORMS[industry].benefits_pct_of_comp ?? {
    min: 20,
    max: 40,
  };
  return {
    ...overrides,
    industry_norms: {
      ...overrides.industry_norms,
      [industry]: {
        ...current,
        benefits_pct_of_comp: {
          ...base,
          ...current.benefits_pct_of_comp,
          [field]: value,
        },
      },
    },
  };
}

export function ConfigIndustryNormsPanel({
  overrides,
  onChange,
}: Pick<Props, "overrides" | "onChange">) {
  const [selected, setSelected] = useState<Industry>("Manufacturing");
  const defaults = DEFAULT_INDUSTRY_NORMS[selected];
  const patch = overrides.industry_norms?.[selected] ?? {};

  function resolvedModule(module: BudgetModuleKey): ModuleNormRange {
    const base = defaults[module];
    const custom = patch[module];
    if (!base && !custom) {
      return { label: module, min: 0, max: 100 };
    }
    return {
      label: custom?.label ?? base?.label ?? module,
      min: custom?.min ?? base?.min,
      max: custom?.max ?? base?.max,
      suggested: custom?.suggested ?? base?.suggested,
    };
  }

  const benefits = {
    min:
      patch.benefits_pct_of_comp?.min ??
      defaults.benefits_pct_of_comp?.min ??
      20,
    max:
      patch.benefits_pct_of_comp?.max ??
      defaults.benefits_pct_of_comp?.max ??
      40,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--portal-muted)]">
        Suggested HR budget allocation ranges shown to students as industry guidance
        and validation warnings.
      </p>
      <select
        className={formSelectClassName}
        value={selected}
        onChange={(e) => setSelected(e.target.value as Industry)}
      >
        {INDUSTRIES.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-[var(--portal-page)] text-left text-[var(--portal-muted)]">
            <tr>
              <th className="px-2 py-2">Module</th>
              <th className="px-2 py-2">Min %</th>
              <th className="px-2 py-2">Max %</th>
              <th className="px-2 py-2">Suggested low</th>
              <th className="px-2 py-2">Suggested high</th>
            </tr>
          </thead>
          <tbody>
            {NORM_MODULES.map((mod) => {
              const norm = resolvedModule(mod);
              if (!defaults[mod] && !patch[mod]) return null;
              return (
                <tr key={mod} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-medium capitalize">
                    {mod.replace("_", " ")}
                  </td>
                  {(["min", "max"] as const).map((field) => (
                    <td key={field} className="px-2 py-2">
                      <input
                        type="number"
                        step={0.5}
                        className={`w-20 ${formInputClassName}`}
                        value={norm[field] ?? ""}
                        placeholder="—"
                        onChange={(e) => {
                          const v =
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value);
                          onChange(
                            patchIndustryNorm(overrides, selected, mod, {
                              [field]: v,
                            })
                          );
                        }}
                      />
                    </td>
                  ))}
                  {[0, 1].map((idx) => (
                    <td key={idx} className="px-2 py-2">
                      <input
                        type="number"
                        step={0.5}
                        className={`w-20 ${formInputClassName}`}
                        value={norm.suggested?.[idx] ?? ""}
                        placeholder="—"
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const suggested: [number, number] = [
                            idx === 0
                              ? v
                              : (norm.suggested?.[0] ?? v),
                            idx === 1
                              ? v
                              : (norm.suggested?.[1] ?? v),
                          ];
                          onChange(
                            patchIndustryNorm(overrides, selected, mod, {
                              suggested,
                            })
                          );
                        }}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Benefits min (% of comp)
          <input
            type="number"
            className={`mt-1 w-full ${formInputClassName}`}
            value={benefits.min}
            onChange={(e) =>
              onChange(
                patchBenefitsNorm(
                  overrides,
                  selected,
                  "min",
                  Number(e.target.value)
                )
              )
            }
          />
        </label>
        <label className="text-sm">
          Benefits max (% of comp)
          <input
            type="number"
            className={`mt-1 w-full ${formInputClassName}`}
            value={benefits.max}
            onChange={(e) =>
              onChange(
                patchBenefitsNorm(
                  overrides,
                  selected,
                  "max",
                  Number(e.target.value)
                )
              )
            }
          />
        </label>
      </div>
    </div>
  );
}
