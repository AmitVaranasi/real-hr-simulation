"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Info,
  MoveRight,
  RefreshCw,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
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

/* Section structure, copy and controls transcribed from
   professor_budget_economy_configuration_editable. */
const ECONOMY_CARDS = [
  {
    id: "boom" as const,
    label: "Boom",
    body: "Strong economy with high growth.",
    tone: "text-emerald-600",
    Icon: TrendingUp,
  },
  {
    id: "normal" as const,
    label: "Normal",
    body: "Stable economy with balanced growth.",
    tone: "text-[var(--portal-title)]",
    Icon: MoveRight,
  },
  {
    id: "recession" as const,
    label: "Recession",
    body: "Weak economy with low growth.",
    tone: "text-[var(--portal-brand)]",
    Icon: TrendingDown,
  },
];

const BUDGET_GUIDELINES = [
  "This budget funds all HR decisions.",
  "Students allocate across active decision modules.",
  "Budget ranges can be adjusted in Industry Norms.",
  "Unspent funds do not roll forward.",
];

const ADVANCED_SETTINGS = [
  { label: "Inflation Rate (Annual)", suffix: "%" },
  { label: "Interest Rate (Annual)", suffix: "%" },
  { label: "Market Demand" },
  { label: "Labor Market Conditions" },
  { label: "Economic Volatility" },
];

function ConfigStep({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--portal-accent-blue)] text-[0.8125rem] font-bold text-white">
        {n}
      </span>
      <div>
        <h3 className="text-lg font-bold text-[var(--portal-title)]">{title}</h3>
        <p className="mt-0.5 text-sm text-[var(--portal-muted)]">{body}</p>
      </div>
    </div>
  );
}

export function ConfigParametersPanel({
  overrides,
  onChange,
  discretionaryBudget,
  onBudgetChange,
}: Props) {
  const activeEconomy =
    (overrides as { active_economy?: string }).active_economy ?? "normal";

  return (
    <div className="space-y-8">
      <section>
        <ConfigStep
          n={1}
          title="HR Budget"
          body="Set the discretionary HR budget available to each team each round."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--portal-sidebar-border)] p-4">
            <label className="block text-sm">
              <span className="font-semibold text-[var(--portal-ink)]">
                Discretionary HR Budget (per team, per round)
              </span>
              <span className="relative mt-1.5 block">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--portal-muted)]">
                  $
                </span>
                <input
                  type="number"
                  step={10000}
                  className={`w-full pl-7 ${formInputClassName}`}
                  value={discretionaryBudget}
                  onChange={(e) => onBudgetChange(Number(e.target.value))}
                />
              </span>
            </label>
            <label className="mt-4 block text-sm">
              <span className="font-semibold text-[var(--portal-ink)]">
                Currency
              </span>
              <select
                className={`mt-1.5 w-full ${formSelectClassName}`}
                defaultValue="USD"
              >
                <option value="USD">USD - US Dollar</option>
              </select>
              <span className="mt-1 block text-[0.75rem] text-[var(--portal-muted)]">
                Only USD is stored today.
              </span>
            </label>
          </div>
          <aside className="rounded-xl border border-[#d7e4ff] bg-[#f5f9ff] p-4">
            <p className="flex items-center gap-2 font-bold text-[var(--portal-accent-blue)]">
              <Info className="h-4 w-4" strokeWidth={2} />
              Budget Guidelines
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-[var(--portal-ink)]">
              {BUDGET_GUIDELINES.map((g) => (
                <li key={g} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    strokeWidth={2}
                  />
                  <span className="leading-snug">{g}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/sessions/professor-resources/reference/mechanics"
              className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View Budget Guidelines
            </Link>
          </aside>
        </div>
      </section>

      <section>
        <ConfigStep
          n={2}
          title="Economic Environment"
          body="Select the economic scenario that influences revenues, expenses, and market conditions."
        />
        <div className="mt-4 grid gap-4">
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ECONOMY_CARDS.map(({ id, label, body, tone, Icon }) => {
                const selected = activeEconomy === id;
                return (
                  <div
                    key={id}
                    className={`rounded-xl border p-4 ${
                      selected
                        ? "border-emerald-500"
                        : "border-[var(--portal-sidebar-border)]"
                    }`}
                  >
                    <p className={`flex items-center gap-2 font-bold ${tone}`}>
                      <Icon className="h-5 w-5" strokeWidth={2} />
                      {label}
                    </p>
                    <p className="mt-2 text-[0.8125rem] leading-snug text-[var(--portal-muted)]">
                      {body}
                    </p>
                    <label className="mt-3 block text-[0.8125rem]">
                      <span className="font-semibold text-[var(--portal-ink)]">
                        Revenue Multiplier
                      </span>
                      <input
                        type="number"
                        step={0.01}
                        className={`mt-1 w-full ${formInputClassName}`}
                        value={
                          overrides.economy_multipliers?.[id]?.revenue ??
                          ECONOMY_MULTIPLIERS[id].revenue
                        }
                        onChange={(ev) =>
                          onChange({
                            ...overrides,
                            economy_multipliers: {
                              ...overrides.economy_multipliers,
                              [id]: {
                                revenue: Number(ev.target.value),
                                expense:
                                  overrides.economy_multipliers?.[id]?.expense ??
                                  ECONOMY_MULTIPLIERS[id].expense,
                              },
                            },
                          })
                        }
                      />
                    </label>
                    <label className="mt-2.5 block text-[0.8125rem]">
                      <span className="font-semibold text-[var(--portal-ink)]">
                        Expense Multiplier
                      </span>
                      <input
                        type="number"
                        step={0.01}
                        className={`mt-1 w-full ${formInputClassName}`}
                        value={
                          overrides.economy_multipliers?.[id]?.expense ??
                          ECONOMY_MULTIPLIERS[id].expense
                        }
                        onChange={(ev) =>
                          onChange({
                            ...overrides,
                            economy_multipliers: {
                              ...overrides.economy_multipliers,
                              [id]: {
                                revenue:
                                  overrides.economy_multipliers?.[id]?.revenue ??
                                  ECONOMY_MULTIPLIERS[id].revenue,
                                expense: Number(ev.target.value),
                              },
                            },
                          })
                        }
                      />
                    </label>
                    <p className="mt-3 flex items-center gap-2 text-[0.8125rem]">
                      {selected ? (
                        <>
                          <CheckCircle2
                            className="h-4 w-4 text-emerald-600"
                            strokeWidth={2}
                          />
                          <span className="font-semibold text-emerald-700">
                            Active
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="inline-block h-4 w-4 rounded-full border-2 border-[#c9ced6]" />
                          <span className="text-[var(--portal-muted)]">
                            Set per round
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                );
              })}
              {/* Custom scenario is not a stored concept yet. */}
              <div className="rounded-xl border border-dashed border-[var(--portal-sidebar-border)] p-4">
                <p className="flex items-center gap-2 font-bold text-[var(--portal-title)]">
                  <Settings className="h-5 w-5" strokeWidth={2} />
                  Custom
                </p>
                <p className="mt-2 text-[0.8125rem] leading-snug text-[var(--portal-muted)]">
                  Define your own economic multipliers.
                </p>
                <p className="mt-3 rounded-md border border-violet-200 px-3 py-2 text-center text-[0.8125rem] font-semibold text-violet-500">
                  Not stored yet
                </p>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Multipliers adjust budget, revenues, and expenses used by the
              simulation engine. The active scenario is chosen when a round is
              opened.
            </p>
          </div>

          {/* Advanced economic settings have no stored fields yet. */}
          <aside className="rounded-xl border border-[var(--portal-sidebar-border)] p-4">
            <h4 className="font-bold text-[var(--portal-title)]">
              Advanced Economic Settings
            </h4>
            <p className="text-[0.8125rem] text-[var(--portal-muted)]">
              (Optional)
            </p>
            <dl className="mt-3 space-y-3">
              {ADVANCED_SETTINGS.map(({ label, suffix }) => (
                <div key={label}>
                  <dt className="text-[0.8125rem] font-semibold text-[var(--portal-ink)]">
                    {label}
                  </dt>
                  <dd className="mt-1 flex items-center justify-between rounded-md border border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-3 py-2 text-sm text-[var(--portal-muted)]">
                    <span>—</span>
                    {suffix ? <span>{suffix}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[0.75rem] text-[var(--portal-muted)]">
              These are not stored by the engine yet.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}

/* Section structure, copy and the module-multiplier table follow
   industry_configuration_editable. */
const MODULE_META: Record<
  string,
  { label: string; body: string; tone: string }
> = {
  recruitment: { label: "Recruitment & Selection", body: "Cost and effectiveness of attracting and hiring talent.", tone: "#7c3aed" },
  performance: { label: "Performance Management", body: "Effectiveness of performance systems and evaluations.", tone: "#2F6FED" },
  training: { label: "Training & Development", body: "Training effectiveness and knowledge transfer.", tone: "#16a34a" },
  relations: { label: "Employee Relations", body: "Impact of relations, engagement, and culture initiatives.", tone: "#f97316" },
  compensation: { label: "Compensation & Benefits", body: "Cost and competitiveness of compensation decisions.", tone: "#16a34a" },
  org_design: { label: "Org Design & Change", body: "Effectiveness of structure, change and process redesign.", tone: "#16a34a" },
  dei: { label: "DEI Initiatives", body: "Impact of diversity, equity, and inclusion programs.", tone: "#7c3aed" },
};

function impactGuide(value: number) {
  if (value >= 1.3) return "Significantly higher impact";
  if (value >= 1.15) return "Higher impact in this industry";
  if (value > 1.0) return "Slightly higher cost / impact";
  if (value === 1.0) return "Baseline impact";
  return "Lower cost / impact";
}

export function ConfigIndustryPanel({
  overrides,
  onChange,
}: Pick<Props, "overrides" | "onChange">) {
  const [selected, setSelected] = useState<Industry>("Manufacturing");
  const base = INDUSTRY_CONFIGS[selected];
  const patch = overrides.industries?.[selected] ?? {};
  const val = <K extends keyof typeof base>(key: K) =>
    Number((patch as Record<string, unknown>)[key as string] ?? base[key]);

  return (
    <div className="space-y-8">
      <section>
        <ConfigStep
          n={1}
          title="Select Industry"
          body="Choose the industry for your course. All assumptions below apply to this industry."
        />
        <div className="mt-4 grid gap-4">
          <label className="block text-sm">
            <span className="font-semibold text-[var(--portal-ink)]">
              Industry
            </span>
            <select
              className={`${formSelectClassName} mt-1.5 w-full`}
              value={selected}
              onChange={(e) => setSelected(e.target.value as Industry)}
            >
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
          <aside className="rounded-xl border border-[#d7e4ff] bg-[#f5f9ff] p-4">
            <p className="font-bold text-[var(--portal-accent-blue)]">
              About This Industry
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-[var(--portal-ink)]">
              {[
                `Starting headcount ${base.base_headcount.toLocaleString()} at a ${base.base_market_salary.toLocaleString()} market salary.`,
                `Baseline turnover ${base.base_turnover}% with ${base.base_satisfaction} satisfaction.`,
                `Module multipliers weight each HR area for this industry.`,
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    strokeWidth={2}
                  />
                  <span className="leading-snug">{line}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/sessions/professor-resources/reference/industry"
              className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View Industry Descriptions
            </Link>
          </aside>
        </div>
      </section>

      <section>
        <ConfigStep
          n={2}
          title="Industry Assumptions"
          body="Set the baseline conditions and industry multipliers used by the simulation engine."
        />
        <div className="mt-4 grid gap-4">
          <div className="rounded-xl border border-[var(--portal-sidebar-border)] p-4">
            <p className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
              A. Workforce &amp; Business Baseline
            </p>
            <div className="mt-3 grid gap-3 grid-cols-2">
              {(
                [
                  ["base_market_salary", "Market Salary", "(Annual)"],
                  ["base_headcount", "Headcount", "(Starting)"],
                  ["base_turnover", "Base Turnover Rate", "(% per year)"],
                  ["base_profit_margin", "Profit Margin", "(Annual)"],
                ] as const
              ).map(([key, label, hint]) => (
                <label key={key} className="block text-sm">
                  <span className="block font-semibold leading-tight text-[var(--portal-ink)]">
                    {label}
                  </span>
                  <span className="block text-[0.6875rem] leading-tight text-[var(--portal-muted)]">
                    {hint}
                  </span>
                  <input
                    type="number"
                    className={`mt-1.5 w-full ${formInputClassName}`}
                    value={val(key)}
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
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              These baseline values represent the starting conditions before any
              team decisions.
            </p>
          </div>

          <aside className="rounded-xl border border-[var(--portal-sidebar-border)] p-4">
            <p className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
              B. Industry Profile Summary
            </p>
            <dl className="mt-3 divide-y divide-[var(--portal-sidebar-border)] text-sm">
              {[
                ["Industry", selected],
                ["Starting Headcount", val("base_headcount").toLocaleString()],
                ["Base Revenue", `$${(val("base_revenue") / 1_000_000).toFixed(1)}M`],
                ["Base Turnover", `${val("base_turnover")}%`],
                ["Base Satisfaction", String(val("base_satisfaction"))],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-2">
                  <dt className="text-[var(--portal-muted)]">{k}</dt>
                  <dd className="font-semibold text-[var(--portal-title)]">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href="/sessions/professor-resources/reference/industry"
              className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View Full Industry Profile
            </Link>
          </aside>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--portal-sidebar-border)] p-4">
          <p className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
            C. Module Multipliers
          </p>
          <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
            These multipliers adjust the impact and cost of decisions within each
            HR module for this industry.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                <tr>
                  <th className="py-2 pr-4 whitespace-nowrap">HR Module</th>
                  <th className="py-2 pr-4 whitespace-nowrap">Description</th>
                  <th className="py-2 pr-4 whitespace-nowrap">Multiplier</th>
                  <th className="py-2 whitespace-nowrap">Impact Guide</th>
                </tr>
              </thead>
              <tbody>
                {MODULE_KEYS.map((mod) => {
                  const meta = MODULE_META[mod] ?? {
                    label: mod,
                    body: "",
                    tone: "#2F6FED",
                  };
                  const current = Number(
                    patch.module_multipliers?.[mod] ??
                      base.module_multipliers[mod]
                  );
                  return (
                    <tr
                      key={mod}
                      className="border-t border-[var(--portal-sidebar-border)]"
                    >
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2.5 whitespace-nowrap font-semibold text-[var(--portal-title)]">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: meta.tone }}
                          />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[var(--portal-muted)]">
                        {meta.body}
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          step={0.05}
                          className={`w-28 ${formInputClassName}`}
                          value={current}
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
                      </td>
                      <td className="py-3 whitespace-nowrap text-[var(--portal-muted)]">
                        {impactGuide(current)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Multipliers adjust both the cost and effectiveness of decisions
            relative to the baseline industry.
          </p>
        </div>
      </section>
    </div>
  );
}


const STRATEGY_DOT: Record<string, string> = {
  "Cost Leadership": "#16a34a",
  Differentiation: "#7c3aed",
  Innovation: "#2F6FED",
  "Customer Intimacy": "#e11d48",
  Focus: "#f97316",
};

const STRATEGY_BLURB: Record<string, string> = {
  "Cost Leadership": "Deliver standard quality at the lowest total cost.",
  Differentiation: "Offer unique value and premium quality.",
  Innovation: "Invest in new capabilities and growth.",
  "Customer Intimacy": "Build deep, lasting customer relationships.",
  Focus: "Excel in key areas and deliver superior results.",
};

const NORM_GUIDANCE: Record<string, string> = {
  recruitment: "Stay aligned with market needs.",
  performance: "Invest in performance systems.",
  training: "Build skills and capabilities.",
  relations: "Support engagement & culture.",
  compensation: "Align pay with market & strategy.",
  org_design: "Enable structure & change.",
  dei: "Promote inclusion & equity.",
};

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

export function ConfigStrategyPanel({
  overrides,
  onChange,
}: Pick<Props, "overrides" | "onChange">) {
  const [selected, setSelected] = useState<Strategy>("Focus");

  const weightsFor = (s: Strategy) => ({
    ...STRATEGY_CONFIGS[s].bsc_weights,
    ...overrides.strategies?.[s]?.bsc_weights,
  });
  const selectedWeights = weightsFor(selected);
  const donutTotal =
    selectedWeights.financial +
    selectedWeights.employee +
    selectedWeights.process +
    selectedWeights.learning;

  const PERSPECTIVES = [
    { key: "financial", label: "Financial", color: "#0f9d76" },
    { key: "employee", label: "Employee", color: "#2F6FED" },
    { key: "process", label: "Internal Process", color: "#f97316" },
    { key: "learning", label: "Learning & Growth", color: "#7c3aed" },
  ] as const;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-start justify-between gap-3">
          <ConfigStep
            n={1}
            title="Available Strategies"
            body="Choose the strategies students can select during the simulation."
          />
          <button
            type="button"
            onClick={() => onChange({ ...overrides, strategies: undefined })}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            Use Recommended Defaults
          </button>
        </div>
        <div className="mt-4 grid gap-4">
          <div className="overflow-x-auto rounded-xl border border-[var(--portal-sidebar-border)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                <tr>
                  <th className="px-2 py-2.5 whitespace-nowrap">Strategy</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Description</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Available</th>
                  <th className="px-3 py-2.5">Default to Students</th>
                </tr>
              </thead>
              <tbody>
                {STRATEGIES.map((s) => (
                  <tr
                    key={s}
                    className="border-t border-[var(--portal-sidebar-border)]"
                  >
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => setSelected(s)}
                        className={`flex items-center gap-2.5 whitespace-nowrap font-semibold ${
                          s === selected
                            ? "text-[var(--portal-accent-blue)]"
                            : "text-[var(--portal-title)]"
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            background:
                              STRATEGY_DOT[s] ?? "var(--portal-accent-blue)",
                          }}
                        />
                        {s}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-[var(--portal-muted)]">
                      {STRATEGY_BLURB[s] ?? "—"}
                    </td>
                    <td className="px-2 py-3">
                      {/* Every configured strategy is selectable; availability
                          is not a stored flag. */}
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                        Available
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[var(--portal-muted)]">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="flex items-start gap-2 border-t border-[var(--portal-sidebar-border)] bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Students can pick any configured strategy. A stored per-course
              default is not a field yet.
            </p>
          </div>

          <aside className="rounded-xl border border-[#d7e4ff] bg-[#f5f9ff] p-4">
            <p className="font-bold text-[var(--portal-accent-blue)]">
              About Strategies
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-[var(--portal-ink)]">
              {[
                "Strategies define how success is measured.",
                "Each strategy has a different emphasis across the BSC perspectives.",
                "Multipliers adjust the impact of decisions to reflect strategy focus.",
                "Students' strategy choices drive different paths to success.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    strokeWidth={2}
                  />
                  <span className="leading-snug">{line}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/sessions/professor-resources/reference/industry"
              className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              Learn more about Strategies
            </Link>
          </aside>
        </div>
      </section>

      <section>
        <ConfigStep
          n={2}
          title="BSC Perspective Weights by Strategy"
          body="Set the emphasis each strategy places on the four BSC perspectives. Percentages must total 100%."
        />
        <div className="mt-4 grid gap-4">
          <div className="overflow-x-auto rounded-xl border border-[var(--portal-sidebar-border)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                <tr>
                  <th className="px-2 py-2.5 whitespace-nowrap">Strategy</th>
                  {PERSPECTIVES.map((p) => (
                    <th key={p.key} className="px-2 py-2.5 whitespace-nowrap">
                      {p.label}
                    </th>
                  ))}
                  <th className="px-2 py-2.5 whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody>
                {STRATEGIES.map((s) => {
                  const w = weightsFor(s);
                  const total =
                    w.financial + w.employee + w.process + w.learning;
                  return (
                    <tr
                      key={s}
                      className="border-t border-[var(--portal-sidebar-border)]"
                    >
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => setSelected(s)}
                          className={`flex items-center gap-2.5 whitespace-nowrap font-semibold ${
                            s === selected
                              ? "text-[var(--portal-accent-blue)]"
                              : "text-[var(--portal-title)]"
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              background:
                                STRATEGY_DOT[s] ?? "var(--portal-accent-blue)",
                            }}
                          />
                          {s}
                        </button>
                      </td>
                      {PERSPECTIVES.map((p) => (
                        <td key={p.key} className="px-2 py-3">
                          <span className="flex items-center gap-1">
                            <input
                              type="number"
                              className={`w-16 ${formInputClassName}`}
                              value={w[p.key]}
                              onChange={(e) =>
                                onChange({
                                  ...overrides,
                                  strategies: {
                                    ...overrides.strategies,
                                    [s]: {
                                      ...overrides.strategies?.[s],
                                      bsc_weights: {
                                        ...w,
                                        [p.key]: Number(e.target.value),
                                      },
                                    },
                                  },
                                })
                              }
                            />
                            <span className="text-[var(--portal-muted)]">%</span>
                          </span>
                        </td>
                      ))}
                      <td
                        className={`px-3 py-3 font-semibold ${
                          total === 100 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {total}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="flex items-start gap-2 border-t border-[var(--portal-sidebar-border)] bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              These weights influence scoring and carry-forward effects based on
              the selected strategy.
            </p>
          </div>

          <aside className="rounded-xl border border-[var(--portal-sidebar-border)] p-4 text-center">
            <p className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
              Selected Strategy Preview
            </p>
            <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
              {selected}
            </p>
            <svg viewBox="0 0 120 120" className="mx-auto mt-3 h-40 w-40 -rotate-90">
              {(() => {
                const r = 44;
                const c = 2 * Math.PI * r;
                let offset = 0;
                return PERSPECTIVES.map((p) => {
                  const frac = donutTotal ? selectedWeights[p.key] / donutTotal : 0;
                  const seg = (
                    <circle
                      key={p.key}
                      cx="60"
                      cy="60"
                      r={r}
                      fill="none"
                      stroke={p.color}
                      strokeWidth="22"
                      strokeDasharray={`${frac * c} ${c}`}
                      strokeDashoffset={-offset * c}
                    />
                  );
                  offset += frac;
                  return seg;
                });
              })()}
            </svg>
            <p className="-mt-24 text-lg font-bold text-[var(--portal-title)]">
              {donutTotal}%
            </p>
            <ul className="mt-20 grid grid-cols-2 gap-2 text-left text-[0.75rem]">
              {PERSPECTIVES.map((p) => (
                <li key={p.key} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className="truncate text-[var(--portal-ink)]">
                    {p.label}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section>
        <ConfigStep
          n={3}
          title="Strategy Multipliers"
          body="Adjust how decisions impact results under each strategy."
        />
        <div className="mt-4 grid gap-4">
          <div className="overflow-x-auto rounded-xl border border-[var(--portal-sidebar-border)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                <tr>
                  <th className="px-2 py-2.5 whitespace-nowrap">
                    HR Impact Area
                  </th>
                  {STRATEGIES.map((s) => (
                    <th key={s} className="px-2 py-2.5 whitespace-nowrap">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  "People & Talent (Recruit, Train, Retain)",
                  "Process & Systems (Efficiency)",
                  "Compensation & Costs",
                  "Innovation & Growth",
                ].map((area) => (
                  <tr
                    key={area}
                    className="border-t border-[var(--portal-sidebar-border)]"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-[var(--portal-ink)]">
                      {area}
                    </td>
                    {STRATEGIES.map((s) => (
                      <td
                        key={s}
                        className="px-3 py-3 text-[var(--portal-muted)]"
                      >
                        —
                      </td>
                    ))}
                    <td className="px-3 py-3 whitespace-nowrap text-[var(--portal-muted)]">
                      Higher values increase impact
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="flex items-start gap-2 border-t border-[var(--portal-sidebar-border)] bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Per-strategy HR impact multipliers are not stored by the engine
              yet — strategy emphasis is applied through the BSC weights above.
            </p>
          </div>

          <aside className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
            <p className="flex items-center gap-2 font-bold text-violet-800">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
              Tips
            </p>
            <ul className="mt-3 space-y-2 text-[0.8125rem] text-violet-900">
              {[
                "Higher multipliers amplify the effect of decisions in that area.",
                "Lower multipliers reduce the effect.",
                "Balance your strategy weights to create distinct strategy experiences.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  <span className="leading-snug">{tip}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/sessions/professor-resources/reference/industry"
              className="mt-3 inline-block text-[0.8125rem] font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View Strategy Examples
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}

/* Grouped-by-perspective thresholds table follows
   professor_bsc_benchmarks_configuration_editable. */
const BENCH_GROUPS = [
  { key: "financial", label: "Financial", tone: "text-emerald-600", dot: "#16a34a" },
  { key: "employee", label: "Employee", tone: "text-[var(--portal-accent-blue)]", dot: "#2F6FED" },
  { key: "process", label: "Internal Process", tone: "text-[var(--portal-brand)]", dot: "#f97316" },
  { key: "learning", label: "Learning & Growth", tone: "text-violet-600", dot: "#7c3aed" },
] as const;

/** Units aren't a stored field on the benchmark defs; these are the units the
    engine's own thresholds are expressed in. */
const BENCH_UNIT: Record<string, string> = {
  training_roi: "%",
  cost_per_hire: "USD",
  compensation_ratio: "% of Payroll",
  budget_adherence: "%",
  employee_satisfaction: "Score (0–100)",
  retention: "%",
  engagement: "Score (0–100)",
  dei_score: "Score (0–100)",
  time_to_fill: "Days",
  turnover_rate: "%",
  absenteeism_rate: "%",
  review_coverage: "%",
  training_effectiveness: "% Improvement",
  succession_pipeline: "% of Critical Roles",
  hr_technology_index: "Score (0–100)",
};

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <ConfigStep
          n={1}
          title="Benchmark Thresholds"
          body="Set the numeric thresholds for performance levels for each BSC metric."
        />
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="block font-semibold text-[var(--portal-ink)]">
              Benchmark Set
            </span>
            <select
              className={`${formSelectClassName} mt-1.5 w-56`}
              defaultValue="standard"
            >
              <option value="standard">
                Standard BSC ({SCORING_BENCHMARKS.length} Metrics)
              </option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => onChange({ ...overrides, benchmarks: undefined })}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            Restore Defaults
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="overflow-x-auto rounded-xl border border-[var(--portal-sidebar-border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-2.5 py-2.5 whitespace-nowrap">Metric</th>
                <th className="px-2.5 py-2.5 whitespace-nowrap">Perspective</th>
                <th className="px-2.5 py-2.5 whitespace-nowrap">
                  Excellent
                  <span className="block text-[0.6875rem] font-normal text-emerald-600">
                    Top Performance
                  </span>
                </th>
                <th className="px-2.5 py-2.5 whitespace-nowrap">
                  Moderate
                  <span className="block text-[0.6875rem] font-normal text-amber-600">
                    Average Performance
                  </span>
                </th>
                <th className="px-2.5 py-2.5 whitespace-nowrap">
                  Poor
                  <span className="block text-[0.6875rem] font-normal text-rose-600">
                    Needs Improvement
                  </span>
                </th>
                <th className="px-2.5 py-2.5 whitespace-nowrap">Unit</th>
              </tr>
            </thead>
            <tbody>
              {BENCH_GROUPS.map((group) => {
                const rows = SCORING_BENCHMARKS.filter(
                  (b) => b.perspective === group.key
                );
                if (rows.length === 0) return null;
                return (
                  <Fragment key={group.key}>
                    <tr className="border-t border-[var(--portal-sidebar-border)] bg-[#fbfcfe]">
                      <td colSpan={6} className="px-2.5 py-2.5">
                        <span
                          className={`flex items-center gap-2 font-bold ${group.tone}`}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: group.dot }}
                          />
                          {group.label} ({rows.length} Metrics)
                        </span>
                      </td>
                    </tr>
                    {rows.map((b) => {
                      const o = benchOverrides[b.id] ?? {};
                      return (
                        <tr
                          key={b.id}
                          className="border-t border-[var(--portal-sidebar-border)]"
                        >
                          <td className="px-3 py-2.5 whitespace-nowrap text-[var(--portal-ink)]">
                            {b.label}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap capitalize text-[var(--portal-muted)]">
                            {b.perspective}
                          </td>
                          {(["excellent", "moderate", "poor"] as const).map(
                            (field) => (
                              <td key={field} className="px-2.5 py-2.5">
                                <input
                                  type="number"
                                  step={0.1}
                                  className={`w-20 ${formInputClassName}`}
                                  value={o[field] ?? b[field]}
                                  onChange={(e) =>
                                    updateBench(
                                      b.id,
                                      field,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                            )
                          )}
                          <td className="px-3 py-2.5 whitespace-nowrap text-[var(--portal-muted)]">
                            {BENCH_UNIT[b.id] ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          <p className="flex items-start gap-2 border-t border-[var(--portal-sidebar-border)] bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            These benchmarks drive scoring, performance reports, and
            carry-forward effects. Changes apply to future rounds only.
          </p>
        </div>

        <aside className="rounded-xl border border-[#d7e4ff] bg-[#f5f9ff] p-4">
          <p className="font-bold text-[var(--portal-accent-blue)]">
            About BSC Benchmarks
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--portal-ink)]">
            {[
              "Benchmarks define what constitutes Excellent, Moderate, and Poor performance.",
              "Metrics are grouped by the four BSC perspectives.",
              "Units help ensure consistent measurement across teams.",
              "Use Restore Defaults to return to system baselines.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  strokeWidth={2}
                />
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/sessions/professor-resources/reference/formulas"
            className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            Learn more about BSC Benchmarks
          </Link>
        </aside>
      </div>
    </div>
  );
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
    <div className="space-y-8">
      <section>
        <ConfigStep
          n={1}
          title="Select Industry"
          body="Choose the industry whose allocation norms you want to configure."
        />
        <div className="mt-4 grid gap-4">
          <label className="block text-sm">
            <span className="font-semibold text-[var(--portal-ink)]">
              Industry
            </span>
            <select
              className={`${formSelectClassName} mt-1.5 w-full`}
              value={selected}
              onChange={(e) => setSelected(e.target.value as Industry)}
            >
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
          <aside className="rounded-xl border border-[#d7e4ff] bg-[#f5f9ff] p-4">
            <p className="font-bold text-[var(--portal-accent-blue)]">
              About Industry Norms
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-[var(--portal-ink)]">
              {[
                "Ranges are shown to students as guidance.",
                "Decisions outside ranges are allowed but may impact results.",
                "Suggested ranges represent best-practice guidance.",
                "Benefits ranges apply as % of total compensation.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    strokeWidth={2}
                  />
                  <span className="leading-snug">{line}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/sessions/professor-resources/reference/mechanics"
              className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              Learn more about Industry Norms
            </Link>
          </aside>
        </div>
      </section>

      <section>
        <div className="flex items-start justify-between gap-3">
          <ConfigStep
            n={2}
            title="HR Module Allocation Ranges"
            body="Set minimum, maximum, and suggested allocation ranges (% of total HR budget) for each HR module."
          />
          <button
            type="button"
            onClick={() => {
              const next = { ...(overrides.industry_norms ?? {}) };
              delete next[selected];
              onChange({ ...overrides, industry_norms: next });
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            Use Recommended Defaults
          </button>
        </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#f8f9fb] text-left text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
            <tr>
              <th className="px-1.5 py-2 whitespace-nowrap">HR Module</th>
              <th className="px-1.5 py-2">Minimum %</th>
              <th className="px-1.5 py-2">Maximum %</th>
              <th className="px-1.5 py-2">Suggested Low %</th>
              <th className="px-1.5 py-2">Suggested High %</th>
              <th className="px-1.5 py-2">Guidance to Students</th>
            </tr>
          </thead>
          <tbody>
            {NORM_MODULES.map((mod) => {
              const norm = resolvedModule(mod);
              if (!defaults[mod] && !patch[mod]) return null;
              return (
                <tr key={mod} className="border-t border-slate-100">
                  <td className="px-1.5 py-2">
                    <span className="flex items-center gap-2.5 whitespace-nowrap font-semibold text-[var(--portal-title)]">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: MODULE_META[mod]?.tone ?? "#2F6FED" }}
                      />
                      {MODULE_META[mod]?.label ?? mod.replace("_", " ")}
                    </span>
                  </td>
                  {(["min", "max"] as const).map((field) => (
                    <td key={field} className="px-1.5 py-2">
                      <input
                        type="number"
                        step={0.5}
                        className={`w-14 ${formInputClassName}`}
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
                    <td key={idx} className="px-1.5 py-2">
                      <input
                        type="number"
                        step={0.5}
                        className={`w-14 ${formInputClassName}`}
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
                  <td className="px-2 py-2 whitespace-nowrap text-[var(--portal-muted)]">
                    {NORM_GUIDANCE[mod] ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
        <span className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          All percentages must total 100% of the HR budget.
        </span>
        <span className="font-semibold text-[var(--portal-title)]">
          Total (Max){" "}
          <span className="text-emerald-600">
            {NORM_MODULES.reduce(
              (sum, m) => sum + (resolvedModule(m).max ?? 0),
              0
            )}
            %
          </span>
        </span>
      </p>
      </section>

      <section>
        <ConfigStep
          n={3}
          title="Benefits Allocation Range"
          body="Set the acceptable range for benefits as a percentage of total compensation."
        />
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_22rem]">
        <label className="text-sm">
          <span className="font-semibold text-[var(--portal-ink)]">
            Benefits Minimum (% of Compensation)
          </span>
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
          <span className="font-semibold text-[var(--portal-ink)]">
            Benefits Maximum (% of Compensation)
          </span>
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
        <aside className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
          <p className="font-bold text-violet-800">Benefits Guidance</p>
          <p className="mt-2 text-[0.8125rem] leading-snug text-violet-900">
            Benefits allocation impacts total compensation costs. Keep within
            this range for optimal workforce outcomes.
          </p>
        </aside>
      </div>
      </section>
    </div>
  );
}
