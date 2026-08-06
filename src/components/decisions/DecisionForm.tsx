"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BudgetTracker } from "@/components/dashboard/BudgetTracker";
import { Button } from "@/components/ui/button";
import { formInputClassName, formSelectClassName } from "@/components/ui/form-controls";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "@/lib/engine/config";
import { createDefaultDecision } from "@/lib/engine/defaults";
import { runSimulation } from "@/lib/engine/engine";
import { computeBudgetBreakdown, computeRecruitmentCost } from "@/lib/engine/budget";
import { computeCostPerHire, computeTimeToFill } from "@/lib/engine/metrics";
import { generateWarnings } from "@/lib/engine/validation";
import {
  CHANGE_MGMT_COST,
  COLLABORATION_COST,
  CONFLICT_CONFIG,
  DEI_LEVEL_COST,
  DEVELOPMENTAL_PROGRAMS,
  INVESTMENT_LEVELS,
  PROGRAM_COSTS,
} from "@/lib/engine/programs";
import { getRoleById, ROLE_GROUPS } from "@/lib/engine/roles";
import type {
  CollaborationEnablement,
  ConflictApproach,
  Decision,
  DevelopmentalProgram,
  EconomyCondition,
  Industry,
  InvestmentLevel,
  OrganizationalStructure,
  PositionToFill,
  ProcessFocus,
  SalaryBand,
  Strategy,
} from "@/lib/engine/types";
import { CompensationBreakdown } from "@/components/decisions/CompensationBreakdown";
import { DecisionGuidance } from "@/components/decisions/DecisionGuidance";
import { IndustryGuidance } from "@/components/decisions/IndustryGuidance";
import { MetricPreview } from "@/components/decisions/MetricPreview";
import { ScaffoldingText } from "@/components/decisions/ScaffoldingText";
import { BSCScorecard } from "@/components/results/BSCScorecard";
import { budgetModuleShares } from "@/lib/engine/budget-shares";
import { MODULE_TAB_GUIDANCE } from "@/lib/engine/industry-norms";
import { deriveTrainingBudgetPerEe } from "@/lib/engine/training";
import { useSimulationConfig } from "@/hooks/useSimulationConfig";
import { formatCurrency } from "@/lib/utils";

const MODULES = [
  "Recruitment",
  "Performance",
  "Training",
  "Relations",
  "Compensation",
  "Org Design",
  "DEI",
] as const;

const MODULE_LABELS: Record<(typeof MODULES)[number], string> = {
  Recruitment: "Recruitment & Selection",
  Performance: "Performance Management",
  Training: "Training & Development",
  Relations: "Employee Relations",
  Compensation: "Compensation & Benefits",
  "Org Design": "Org Design & Change",
  DEI: "DEI Initiatives",
};

const SHRM_BADGES: Record<string, string> = {
  Recruitment: "Talent Acquisition",
  Performance: "Performance Management",
  Training: "Learning & Development",
  Relations: "Employee & Labor Relations",
  Compensation: "Total Rewards",
  "Org Design": "Organization",
  DEI: "Diversity, Equity & Inclusion",
};

const ORG_STRUCTURES: OrganizationalStructure[] = [
  "Functional",
  "Divisional",
  "Matrix",
  "Team-Based",
  "Flat",
];

const PROCESS_FOCUS_OPTIONS: ProcessFocus[] = [
  "Efficiency",
  "Quality",
  "Innovation",
  "Customer Responsiveness",
  "Agility",
];

const COLLABORATION_OPTIONS: CollaborationEnablement[] = [
  "Limited",
  "Standard",
  "Enhanced",
  "Highly Integrated",
];

const STRUCTURE_CUES: Record<OrganizationalStructure, string> = {
  Functional:
    "Functional structures can support efficiency and specialization but may reduce cross-functional coordination.",
  Divisional:
    "Divisional structures can improve market or product accountability but may duplicate functions.",
  Matrix:
    "Matrix structures can strengthen cross-functional integration but may introduce role ambiguity.",
  "Team-Based":
    "Team-based structures can increase collaboration and adaptability but may reduce clear hierarchical accountability.",
  Flat: "Flat structures can speed decisions and empower employees but may stretch managerial capacity.",
};

const SALARY_BAND_OPTIONS: { value: SalaryBand; label: string }[] = [
  { value: -20, label: "20% below market" },
  { value: -10, label: "10% below market" },
  { value: 0, label: "At market" },
  { value: 10, label: "10% above market" },
  { value: 20, label: "20% above market" },
];

interface DecisionFormProps {
  industry: Industry;
  strategy: Strategy;
  economy?: EconomyCondition;
  controlledDecision?: Decision;
  onDecisionChange?: (d: Decision) => void;
  hideRunButton?: boolean;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-[var(--portal-ink)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function DecisionForm(props: DecisionFormProps) {
  return (
    <Suspense
      fallback={
        <p className="p-4 text-sm text-[var(--portal-muted)]">Loading decision form…</p>
      }
    >
      <DecisionFormInner {...props} />
    </Suspense>
  );
}

function DecisionFormInner({
  industry,
  strategy,
  economy = "normal",
  controlledDecision,
  onDecisionChange,
  hideRunButton = false,
}: DecisionFormProps) {
  const { ready: configReady } = useSimulationConfig();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(0);

  const TAB_KEYS = [
    "recruitment",
    "performance",
    "training",
    "relations",
    "compensation",
    "org-design",
    "dei",
  ] as const;

  // Deep-link from Capsim-style sidebar: ?tab=recruitment|performance|...
  useEffect(() => {
    const tab = searchParams.get("tab");
    const idx = TAB_KEYS.indexOf(tab as (typeof TAB_KEYS)[number]);
    if (idx >= 0) setActiveTab(idx);
  }, [searchParams]);

  function selectTab(i: number) {
    setActiveTab(i);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", TAB_KEYS[i] ?? "recruitment");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }
  const [internalDecision, setInternalDecision] = useState<Decision>(() =>
    createDefaultDecision()
  );
  const [showResults, setShowResults] = useState(false);

  const decision = controlledDecision ?? internalDecision;
  const industryConfig = getIndustryConfig(industry);
  const strategyConfig = getStrategyConfig(strategy);
  const prior = priorStateFromIndustry(industry);

  const budget = useMemo(
    () =>
      computeBudgetBreakdown(
        decision,
        prior.headcount,
        industryConfig.base_market_salary,
        industryConfig
      ),
    [decision, prior.headcount, industryConfig, configReady]
  );

  const warnings = useMemo(
    () =>
      generateWarnings(
        decision,
        prior.headcount,
        industryConfig.base_market_salary,
        industryConfig,
        industry
      ),
    [decision, prior.headcount, industryConfig, industry, configReady]
  );

  const moduleShares = useMemo(() => budgetModuleShares(budget), [budget]);

  const activeModule = MODULES[activeTab];
  const yourInvestmentPct = useMemo(() => {
    const keys = MODULE_TAB_GUIDANCE[activeModule] ?? [];
    const key = keys[0];
    if (!key) return null;
    return moduleShares[key] ?? null;
  }, [activeModule, moduleShares]);

  const derivedTrainingPerEe = useMemo(
    () => deriveTrainingBudgetPerEe(decision),
    [decision]
  );

  const liveMetrics = useMemo(
    () => ({
      costPerHire: computeCostPerHire(decision, industryConfig),
      timeToFill: computeTimeToFill(decision),
      recruitmentCost: computeRecruitmentCost(decision, industryConfig),
    }),
    [decision, industryConfig]
  );

  const outcome = useMemo(() => {
    if (!showResults) return null;
    return runSimulation(
      decision,
      prior,
      industryConfig,
      strategyConfig,
      economy
    );
  }, [showResults, decision, prior, industryConfig, strategyConfig, economy]);

  function update<K extends keyof Decision>(key: K, value: Decision[K]) {
    const next = { ...decision, [key]: value };
    if (onDecisionChange) onDecisionChange(next);
    else setInternalDecision(next);
    setShowResults(false);
  }

  function updatePosition(roleId: string, count: number) {
    const existing = decision.positions_to_fill.find((p) => p.role_id === roleId);
    let next: PositionToFill[];
    if (existing) {
      next = decision.positions_to_fill.map((p) =>
        p.role_id === roleId ? { ...p, count: Math.max(0, count) } : p
      );
    } else {
      next = [...decision.positions_to_fill, { role_id: roleId, count }];
    }
    update("positions_to_fill", next.filter((p) => p.count > 0));
  }

  function positionCount(roleId: string): number {
    return decision.positions_to_fill.find((p) => p.role_id === roleId)?.count ?? 0;
  }

  return (
    <div className="space-y-6">
      {!configReady && (
        <p className="text-xs text-[var(--portal-muted)]">Loading simulation parameters…</p>
      )}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--portal-ink)]">
        <span>Industry: {industry}</span>
        <span className="text-[var(--portal-sidebar-border)]">|</span>
        <span>Strategy: {strategy}</span>
        <span className="text-[var(--portal-sidebar-border)]">|</span>
        <span>Economy: {economy}</span>
        <span className="text-[var(--portal-sidebar-border)]">|</span>
        <span>
          HR Decisions {activeTab + 1} of {MODULES.length}
        </span>
      </div>

      <BudgetTracker budget={budget} />

      <div className="overflow-x-auto border-b border-[var(--portal-sidebar-border)] pb-2">
        <div className="flex w-max min-w-full gap-1">
          {MODULES.map((mod, i) => (
            <button
              key={mod}
              type="button"
              onClick={() => selectTab(i)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                activeTab === i
                  ? "bg-[var(--portal-primary)] text-white"
                  : "bg-[#f1f3f5] text-[var(--portal-ink)] hover:bg-[var(--portal-sidebar-border)]"
              }`}
            >
              {MODULE_LABELS[mod]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--portal-primary)]">
          SHRM BASK · {SHRM_BADGES[MODULES[activeTab]]}
        </p>
        <h2 className="mt-1 text-xl font-bold text-[var(--portal-title)]">
          {MODULE_LABELS[MODULES[activeTab]]}
        </h2>
        <ScaffoldingText module={MODULES[activeTab]} />
        <DecisionGuidance
          industry={industry}
          module={MODULES[activeTab]}
          yourInvestmentPct={yourInvestmentPct}
          warnings={warnings}
        />
        <IndustryGuidance
          industry={industry}
          module={MODULES[activeTab]}
          yourInvestmentPct={yourInvestmentPct}
        />
        <div className="mt-3 rounded-lg border border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-3 py-2 text-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--portal-muted)]">
            Module Investment
          </p>
          <p className="mt-1 font-semibold text-[var(--portal-title)]">
            {formatCurrency(
              activeTab === 0
                ? budget.recruitment_spend
                : activeTab === 1
                  ? budget.performance_spend
                  : activeTab === 2
                    ? budget.training_spend
                    : activeTab === 3
                      ? budget.relations_spend
                      : activeTab === 4
                        ? budget.compensation_spend
                        : activeTab === 5
                          ? budget.org_design_spend
                          : budget.dei_spend
            )}{" "}
            <span className="text-xs font-normal text-[var(--portal-muted)]">
              ({(
                ((activeTab === 0
                  ? budget.recruitment_spend
                  : activeTab === 1
                    ? budget.performance_spend
                    : activeTab === 2
                      ? budget.training_spend
                      : activeTab === 3
                        ? budget.relations_spend
                        : activeTab === 4
                          ? budget.compensation_spend
                          : activeTab === 5
                            ? budget.org_design_spend
                            : budget.dei_spend) /
                  Math.max(1, budget.available_budget)) *
                100
              ).toFixed(1)}
              % of HR Budget)
            </span>
          </p>
        </div>

        {activeTab === 0 && (
          <div className="mt-4 space-y-4">
            <h3 className="font-semibold text-[var(--portal-title)]">Recruitment & Selection</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-left text-[var(--portal-muted)]">
                    <th className="py-2">Role group</th>
                    <th className="py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLE_GROUPS.map((role) => (
                    <tr key={role.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4">
                        <p className="font-medium text-slate-800">{role.label}</p>
                        <p className="text-xs text-[var(--portal-muted)]">{role.description}</p>
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          className={`w-20 ${formInputClassName}`}
                          value={positionCount(role.id)}
                          onChange={(e) =>
                            updatePosition(role.id, Number(e.target.value))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Screening rigor">
                <select
                  className={formSelectClassName}
                  value={decision.screening_rigor}
                  onChange={(e) =>
                    update("screening_rigor", Number(e.target.value) as 1 | 2 | 3)
                  }
                >
                  <option value={1}>Basic</option>
                  <option value={2}>Assessment + Interview</option>
                  <option value={3}>Full Panel</option>
                </select>
              </Field>
              <Field label={`Diversity goal (${decision.diversity_goal_pct}%)`}>
                <input
                  type="range"
                  min={0}
                  max={50}
                  className="w-full"
                  value={decision.diversity_goal_pct}
                  onChange={(e) =>
                    update("diversity_goal_pct", Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Onboarding investment ($/hire)">
                <input
                  type="number"
                  className={formInputClassName}
                  value={decision.onboarding_investment}
                  onChange={(e) =>
                    update("onboarding_investment", Number(e.target.value))
                  }
                />
              </Field>
            </div>
            <MetricPreview
              items={[
                {
                  label: "Recruitment cost",
                  value: formatCurrency(liveMetrics.recruitmentCost),
                },
                {
                  label: "Cost per hire",
                  value: formatCurrency(liveMetrics.costPerHire),
                },
                {
                  label: "Time to fill",
                  value: `${liveMetrics.timeToFill.toFixed(0)} days`,
                },
              ]}
            />
          </div>
        )}

        {activeTab === 1 && (
          <div className="mt-4 space-y-4">
            <h3 className="font-semibold text-[var(--portal-title)]">Performance Management</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Review frequency">
                <select
                  className={formSelectClassName}
                  value={decision.review_frequency}
                  onChange={(e) =>
                    update("review_frequency", Number(e.target.value) as 1 | 2 | 4)
                  }
                >
                  <option value={1}>Annual</option>
                  <option value={2}>Semi-annual</option>
                  <option value={4}>Quarterly</option>
                </select>
              </Field>
              <Field label="360° feedback">
                <label className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    checked={decision.feedback_360}
                    onChange={(e) => update("feedback_360", e.target.checked)}
                  />
                  Enable ($8,000/year)
                </label>
              </Field>
            </div>
            {decision.role_performance.map((rp, idx) => {
              const role = getRoleById(rp.role_id);
              return (
                <div
                  key={rp.role_id}
                  className="rounded-lg border border-slate-100 p-3"
                >
                  <p className="mb-2 font-medium text-slate-800">
                    {role?.label ?? rp.role_id}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(
                      ["productivity", "teamwork", "leadership", "communication"] as const
                    ).map((key) => (
                      <label key={key} className="text-xs text-[var(--portal-muted)]">
                        {key} ({rp[key]})
                        <input
                          type="range"
                          min={1}
                          max={10}
                          className="mt-1 w-full"
                          value={rp[key]}
                          onChange={(e) => {
                            const next = [...decision.role_performance];
                            next[idx] = {
                              ...next[idx],
                              [key]: Number(e.target.value),
                            };
                            update("role_performance", next);
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 2 && (
          <div className="mt-4 space-y-4">
            <h3 className="font-semibold text-[var(--portal-title)]">Training & Development</h3>
            <div className="space-y-2">
              {DEVELOPMENTAL_PROGRAMS.map((prog) => (
                <label key={prog} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={decision.developmental_programs.includes(prog)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...decision.developmental_programs, prog]
                        : decision.developmental_programs.filter((p) => p !== prog);
                      update("developmental_programs", next);
                    }}
                  />
                  {prog} ({formatCurrency(PROGRAM_COSTS[prog])}/participant)
                </label>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`% employees trained (${decision.pct_employees_trained}%)`}>
                <input
                  type="range"
                  min={0}
                  max={50}
                  className="w-full"
                  value={decision.pct_employees_trained}
                  onChange={(e) =>
                    update("pct_employees_trained", Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Derived training budget per employee">
                <p className="mt-2 rounded-lg bg-[var(--portal-page)] px-3 py-2 text-sm font-medium text-slate-800">
                  {formatCurrency(derivedTrainingPerEe)} (calculated from coverage
                  & programs)
                </p>
              </Field>
              <Field label="Succession investment ($)">
                <input
                  type="number"
                  className={formInputClassName}
                  value={decision.succession_investment}
                  onChange={(e) =>
                    update("succession_investment", Number(e.target.value))
                  }
                />
              </Field>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="mt-4 space-y-4">
            <h3 className="font-semibold text-[var(--portal-title)]">Employee Relations</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Engagement investment ($)">
                <input
                  type="number"
                  className={formInputClassName}
                  value={decision.engagement_investment}
                  onChange={(e) =>
                    update("engagement_investment", Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Conflict approach">
                <select
                  className={formSelectClassName}
                  value={decision.conflict_approach}
                  onChange={(e) =>
                    update("conflict_approach", e.target.value as ConflictApproach)
                  }
                >
                  {(Object.keys(CONFLICT_CONFIG) as ConflictApproach[]).map((k) => (
                    <option key={k} value={k}>
                      {k} ({formatCurrency(CONFLICT_CONFIG[k].cost)})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Flexibility">
                <select
                  className={formSelectClassName}
                  value={decision.flexibility_level}
                  onChange={(e) =>
                    update("flexibility_level", Number(e.target.value) as 0 | 1 | 2)
                  }
                >
                  <option value={0}>None</option>
                  <option value={1}>Hybrid</option>
                  <option value={2}>Full flexibility</option>
                </select>
              </Field>
              <Field label="Voice mechanisms">
                <select
                  className={formSelectClassName}
                  value={decision.voice_mechanisms}
                  onChange={(e) =>
                    update("voice_mechanisms", Number(e.target.value) as 0 | 1 | 2)
                  }
                >
                  <option value={0}>None</option>
                  <option value={1}>Basic</option>
                  <option value={2}>Advanced</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div className="mt-4 space-y-4">
            <h3 className="font-semibold text-[var(--portal-title)]">Compensation, Benefits & HR Tech</h3>
            {decision.role_compensation.map((rc, idx) => {
              const role = getRoleById(rc.role_id);
              return (
                <Field key={rc.role_id} label={`${role?.label ?? rc.role_id} salary`}>
                  <select
                    className={formSelectClassName}
                    value={rc.salary_band}
                    onChange={(e) => {
                      const next = [...decision.role_compensation];
                      next[idx] = {
                        ...next[idx],
                        salary_band: Number(e.target.value) as SalaryBand,
                      };
                      update("role_compensation", next);
                    }}
                  >
                    {SALARY_BAND_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
              );
            })}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`Benefits (% of salary, ${decision.benefits_pct}%)`}>
                <input
                  type="range"
                  min={6}
                  max={20}
                  className="w-full"
                  value={decision.benefits_pct}
                  onChange={(e) => update("benefits_pct", Number(e.target.value))}
                />
              </Field>
              <Field label="Bonus tier">
                <select
                  className={formSelectClassName}
                  value={decision.bonus_tier}
                  onChange={(e) =>
                    update("bonus_tier", Number(e.target.value) as Decision["bonus_tier"])
                  }
                >
                  <option value={5}>5% of annual salary</option>
                  <option value={10}>10% of annual salary</option>
                  <option value={15}>15% of annual salary</option>
                </select>
              </Field>
              <Field label="Equity / stock options">
                <select
                  className={formSelectClassName}
                  value={decision.equity_level}
                  onChange={(e) =>
                    update("equity_level", Number(e.target.value) as 0 | 1 | 2)
                  }
                >
                  <option value={0}>None</option>
                  <option value={1}>Basic</option>
                  <option value={2}>Full</option>
                </select>
              </Field>
              <Field label="HR technology">
                <select
                  className={formSelectClassName}
                  value={decision.hr_tech_level}
                  onChange={(e) =>
                    update("hr_tech_level", Number(e.target.value) as 0 | 1 | 2)
                  }
                >
                  <option value={0}>Basic (no cost)</option>
                  <option value={1}>HRIS ($15,000/year)</option>
                  <option value={2}>HRIS + Analytics ($30,000/year)</option>
                </select>
              </Field>
            </div>
            <CompensationBreakdown
              decision={decision}
              budget={budget}
              headcount={prior.headcount}
              marketSalary={industryConfig.base_market_salary}
            />
          </div>
        )}

        {activeTab === 5 && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Organizational Structure">
                <select
                  className={formSelectClassName}
                  value={decision.organizational_structure}
                  onChange={(e) =>
                    update(
                      "organizational_structure",
                      e.target.value as OrganizationalStructure
                    )
                  }
                >
                  {ORG_STRUCTURES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Span of Control (avg direct reports)">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      update(
                        "span_of_control",
                        Math.max(2, decision.span_of_control - 1)
                      )
                    }
                  >
                    −
                  </Button>
                  <span className="min-w-[2rem] text-center text-lg font-semibold">
                    {decision.span_of_control}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      update(
                        "span_of_control",
                        Math.min(20, decision.span_of_control + 1)
                      )
                    }
                  >
                    +
                  </Button>
                </div>
              </Field>
              <Field label="Process Focus">
                <select
                  className={formSelectClassName}
                  value={decision.process_focus}
                  onChange={(e) =>
                    update("process_focus", e.target.value as ProcessFocus)
                  }
                >
                  {PROCESS_FOCUS_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Change Management Capability">
                <select
                  className={formSelectClassName}
                  value={decision.change_management_capability}
                  onChange={(e) =>
                    update(
                      "change_management_capability",
                      e.target.value as InvestmentLevel
                    )
                  }
                >
                  {INVESTMENT_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level} ({formatCurrency(CHANGE_MGMT_COST[level])})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Collaboration Enablement">
                <select
                  className={formSelectClassName}
                  value={decision.collaboration_enablement}
                  onChange={(e) =>
                    update(
                      "collaboration_enablement",
                      e.target.value as CollaborationEnablement
                    )
                  }
                >
                  {COLLABORATION_OPTIONS.map((level) => (
                    <option key={level} value={level}>
                      {level} ({formatCurrency(COLLABORATION_COST[level])})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <p className="rounded-lg bg-[#f8fafc] px-3 py-2 text-sm text-[var(--portal-ink)]">
              {STRUCTURE_CUES[decision.organizational_structure]}
            </p>
            <MetricPreview
              items={[
                {
                  label: "Org Design investment",
                  value: formatCurrency(budget.org_design_spend),
                },
                {
                  label: "Decision Impact Preview",
                  value: "— (pending engine validation)",
                },
              ]}
            />
          </div>
        )}

        {activeTab === 6 && (
          <div className="mt-4 space-y-4">
            {(
              [
                [
                  "dei_diverse_recruitment",
                  "Diverse Recruitment & Talent Pipelines",
                  "Stronger pipelines help attract diverse talent and improve representation over time.",
                ],
                [
                  "dei_equity_practices",
                  "Equity Practices",
                  "Equitable practices build trust, reduce bias, and support employee satisfaction.",
                ],
                [
                  "dei_inclusion_initiatives",
                  "Inclusion Initiatives",
                  "Inclusive environments increase engagement, belonging, and retention.",
                ],
                [
                  "dei_training_education",
                  "Training & Education",
                  "Education builds shared language and capability for inclusive leadership.",
                ],
                [
                  "dei_accessibility_support",
                  "Accessibility & Support",
                  "Accessibility investments expand opportunity and strengthen belonging.",
                ],
              ] as const
            ).map(([key, label, cue]) => (
              <div
                key={key}
                className="rounded-lg border border-[#f0f1f3] bg-[#f8fafc] p-3"
              >
                <Field label={label}>
                  <select
                    className={formSelectClassName}
                    value={decision[key]}
                    onChange={(e) =>
                      update(key, e.target.value as InvestmentLevel)
                    }
                  >
                    {INVESTMENT_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level} ({formatCurrency(DEI_LEVEL_COST[level])})
                      </option>
                    ))}
                  </select>
                </Field>
                <p className="mt-2 text-xs text-[var(--portal-muted)]">{cue}</p>
              </div>
            ))}
            <MetricPreview
              items={[
                {
                  label: "DEI Module Investment",
                  value: formatCurrency(budget.dei_spend),
                },
                {
                  label: "Decision Impact Preview",
                  value: "— (pending engine validation)",
                },
              ]}
            />
          </div>
        )}
      </div>

      {!hideRunButton && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowResults(true)}>Run simulation</Button>
          <Button
            variant="outline"
            onClick={() => {
              const defaults = createDefaultDecision();
              if (onDecisionChange) onDecisionChange(defaults);
              else setInternalDecision(defaults);
            }}
          >
            Reset defaults
          </Button>
        </div>
      )}

      {outcome && (
        <div className="space-y-6 border-t border-[var(--portal-sidebar-border)] pt-8">
          <h2 className="text-xl font-semibold text-[var(--portal-title)]">Round results</h2>
          <BSCScorecard
            scores={outcome.bsc_scores}
            bscWeights={strategyConfig.bsc_weights}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Revenue" value={formatCurrency(outcome.financial_metrics.revenue)} />
            <MetricCard label="Profit" value={formatCurrency(outcome.financial_metrics.profit)} />
            <MetricCard
              label="Productivity"
              value={(outcome.hr_metrics.productivity * 100).toFixed(1) + "%"}
            />
            <MetricCard
              label="Hiring quality"
              value={outcome.hr_metrics.hiring_quality.toFixed(0) + "/100"}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white p-4">
      <p className="text-xs text-[var(--portal-muted)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--portal-title)]">{value}</p>
    </div>
  );
}
