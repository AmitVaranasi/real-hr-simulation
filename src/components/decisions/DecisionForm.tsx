"use client";

import { useMemo, useState } from "react";
import { BudgetTracker } from "@/components/dashboard/BudgetTracker";
import { Button } from "@/components/ui/button";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "@/lib/engine/config";
import { createDefaultDecision } from "@/lib/engine/defaults";
import { runSimulation } from "@/lib/engine/engine";
import { computeBudgetBreakdown } from "@/lib/engine/budget";
import { generateWarnings } from "@/lib/engine/validation";
import type {
  Decision,
  EconomyCondition,
  Industry,
  Strategy,
  TrainingFocus,
} from "@/lib/engine/types";
import { BSCScorecard } from "@/components/results/BSCScorecard";
import { formInputClassName } from "@/components/ui/form-controls";
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

const SHRM_BADGES: Record<string, string> = {
  Recruitment: "Talent Acquisition",
  Performance: "Performance Management",
  Training: "Learning & Development",
  Relations: "Employee & Labor Relations",
  Compensation: "Total Rewards",
  "Org Design": "Structure of the HR Function",
  DEI: "Diversity, Equity & Inclusion",
};

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
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass = formInputClassName;

export function DecisionForm({
  industry,
  strategy,
  economy = "normal",
  controlledDecision,
  onDecisionChange,
  hideRunButton = false,
}: DecisionFormProps) {
  const [activeTab, setActiveTab] = useState(0);
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
        industryConfig.base_market_salary
      ),
    [decision, prior.headcount, industryConfig.base_market_salary]
  );

  const warnings = useMemo(
    () =>
      generateWarnings(
        decision,
        prior.headcount,
        industryConfig.base_market_salary
      ),
    [decision, prior.headcount, industryConfig.base_market_salary]
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 text-sm text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-1">
          Industry: {industry}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          Strategy: {strategy}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          Economy: {economy}
        </span>
      </div>

      <BudgetTracker budget={budget} />

      {warnings.length > 0 && (
        <ul className="space-y-2">
          {warnings.map((w, i) => (
            <li
              key={i}
              className={`rounded-lg px-3 py-2 text-sm ${
                w.severity === "critical"
                  ? "bg-red-50 text-red-800"
                  : w.severity === "warning"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-blue-50 text-blue-800"
              }`}
            >
              <strong>{w.module}:</strong> {w.message}
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-x-auto border-b border-slate-200 pb-2 [-webkit-overflow-scrolling:touch]">
        <div className="flex w-max min-w-full gap-1">
          {MODULES.map((mod, i) => (
            <button
              key={mod}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === i
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-indigo-600">
        SHRM BASK: {SHRM_BADGES[MODULES[activeTab]]}
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {activeTab === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Recruitment budget per hire">
              <input
                type="number"
                className={inputClass}
                value={decision.recruitment_budget_per_hire}
                onChange={(e) =>
                  update("recruitment_budget_per_hire", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Positions to fill">
              <input
                type="number"
                className={inputClass}
                value={decision.positions_to_fill}
                onChange={(e) =>
                  update("positions_to_fill", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Screening rigor (1–3)">
              <select
                className={inputClass}
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
            <Field label="Diversity goal %">
              <input
                type="number"
                className={inputClass}
                value={decision.diversity_goal_pct}
                onChange={(e) =>
                  update("diversity_goal_pct", Number(e.target.value))
                }
              />
            </Field>
          </div>
        )}

        {activeTab === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Review frequency">
              <select
                className={inputClass}
                value={decision.review_frequency}
                onChange={(e) =>
                  update(
                    "review_frequency",
                    Number(e.target.value) as 1 | 2 | 4
                  )
                }
              >
                <option value={1}>Annual</option>
                <option value={2}>Semi-annual</option>
                <option value={4}>Quarterly</option>
              </select>
            </Field>
            <Field label="KPI investment">
              <input
                type="number"
                className={inputClass}
                value={decision.kpi_investment}
                onChange={(e) =>
                  update("kpi_investment", Number(e.target.value))
                }
              />
            </Field>
            <Field label="360 feedback">
              <input
                type="checkbox"
                checked={decision.feedback_360}
                onChange={(e) => update("feedback_360", e.target.checked)}
                className="mr-2"
              />
              Enable 360-degree feedback
            </Field>
            <Field label="PIP investment">
              <input
                type="number"
                className={inputClass}
                value={decision.pip_investment}
                onChange={(e) =>
                  update("pip_investment", Number(e.target.value))
                }
              />
            </Field>
          </div>
        )}

        {activeTab === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Training budget per employee">
              <input
                type="number"
                className={inputClass}
                value={decision.training_budget_per_ee}
                onChange={(e) =>
                  update("training_budget_per_ee", Number(e.target.value))
                }
              />
            </Field>
            <Field label="% employees trained">
              <input
                type="number"
                className={inputClass}
                value={decision.pct_employees_trained}
                onChange={(e) =>
                  update("pct_employees_trained", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Training focus">
              <select
                className={inputClass}
                value={decision.training_focus}
                onChange={(e) =>
                  update("training_focus", e.target.value as TrainingFocus)
                }
              >
                <option>Technical</option>
                <option>Leadership</option>
                <option>Soft Skills</option>
                <option>Compliance</option>
              </select>
            </Field>
            <Field label="Succession investment">
              <input
                type="number"
                className={inputClass}
                value={decision.succession_investment}
                onChange={(e) =>
                  update("succession_investment", Number(e.target.value))
                }
              />
            </Field>
          </div>
        )}

        {activeTab === 3 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Engagement investment">
              <input
                type="number"
                className={inputClass}
                value={decision.engagement_investment}
                onChange={(e) =>
                  update("engagement_investment", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Conflict resolution budget">
              <input
                type="number"
                className={inputClass}
                value={decision.conflict_budget}
                onChange={(e) =>
                  update("conflict_budget", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Flexibility level">
              <select
                className={inputClass}
                value={decision.flexibility_level}
                onChange={(e) =>
                  update(
                    "flexibility_level",
                    Number(e.target.value) as 0 | 1 | 2
                  )
                }
              >
                <option value={0}>None</option>
                <option value={1}>Hybrid</option>
                <option value={2}>Full flexibility</option>
              </select>
            </Field>
          </div>
        )}

        {activeTab === 4 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Salary vs market %">
              <input
                type="number"
                className={inputClass}
                value={decision.salary_vs_market_pct}
                onChange={(e) =>
                  update("salary_vs_market_pct", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Benefits per employee">
              <input
                type="number"
                className={inputClass}
                value={decision.benefits_per_ee}
                onChange={(e) =>
                  update("benefits_per_ee", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Bonus pool %">
              <input
                type="number"
                className={inputClass}
                value={decision.bonus_pool_pct}
                onChange={(e) =>
                  update("bonus_pool_pct", Number(e.target.value))
                }
              />
            </Field>
          </div>
        )}

        {activeTab === 5 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="HR tech level">
              <select
                className={inputClass}
                value={decision.hr_tech_level}
                onChange={(e) =>
                  update("hr_tech_level", Number(e.target.value) as 0 | 1 | 2)
                }
              >
                <option value={0}>Basic</option>
                <option value={1}>HRIS</option>
                <option value={2}>HRIS + Analytics</option>
              </select>
            </Field>
            <Field label="Restructuring investment">
              <input
                type="number"
                className={inputClass}
                value={decision.restructuring_investment}
                onChange={(e) =>
                  update("restructuring_investment", Number(e.target.value))
                }
              />
            </Field>
          </div>
        )}

        {activeTab === 6 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="DEI training per employee">
              <input
                type="number"
                className={inputClass}
                value={decision.dei_training_per_ee}
                onChange={(e) =>
                  update("dei_training_per_ee", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Inclusive hiring investment">
              <input
                type="number"
                className={inputClass}
                value={decision.inclusive_hiring_investment}
                onChange={(e) =>
                  update("inclusive_hiring_investment", Number(e.target.value))
                }
              />
            </Field>
            <Field label="ERG budget">
              <input
                type="number"
                className={inputClass}
                value={decision.erg_budget}
                onChange={(e) =>
                  update("erg_budget", Number(e.target.value))
                }
              />
            </Field>
          </div>
        )}
      </div>

      {!hideRunButton && (
        <div className="flex gap-3">
          <Button onClick={() => setShowResults(true)}>
            Run simulation
          </Button>
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
        <div className="space-y-6 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-semibold text-slate-900">Round results</h2>
          <BSCScorecard scores={outcome.bsc_scores} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Revenue"
              value={formatCurrency(outcome.financial_metrics.revenue)}
            />
            <MetricCard
              label="Profit"
              value={formatCurrency(outcome.financial_metrics.profit)}
            />
            <MetricCard
              label="Stock price"
              value={`$${outcome.financial_metrics.stock_price.toFixed(2)}`}
            />
            <MetricCard
              label="Headcount"
              value={outcome.financial_metrics.headcount.toString()}
            />
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">HR Metric</th>
                  <th className="px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(outcome.hr_metrics).map(([key, val]) => (
                  <tr key={key} className="border-t border-slate-100">
                    <td className="px-4 py-2 capitalize text-slate-700">
                      {key.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {typeof val === "number" ? val.toFixed(2) : val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
