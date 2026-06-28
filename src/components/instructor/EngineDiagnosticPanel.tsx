"use client";

import { SCORING_BENCHMARKS } from "@/lib/engine/benchmarks";
import { ECONOMY_MULTIPLIERS, INDUSTRY_CONFIGS } from "@/lib/engine/config";
import { DISCRETIONARY_BUDGET } from "@/lib/engine/defaults";
import type { SimulationTrace } from "@/lib/engine/types";

interface EngineDiagnosticPanelProps {
  effective?: {
    discretionary_budget: number;
    economy_multipliers: typeof ECONOMY_MULTIPLIERS;
    industries: typeof INDUSTRY_CONFIGS;
  } | null;
  scenarioTrace?: SimulationTrace | null;
  scenarioLabel?: string;
}

export function EngineDiagnosticPanel({
  effective,
  scenarioTrace,
  scenarioLabel,
}: EngineDiagnosticPanelProps) {
  const budget = effective?.discretionary_budget ?? DISCRETIONARY_BUDGET;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Active engine parameters</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <dt className="text-slate-500">Discretionary budget</dt>
          <dd className="font-medium">${budget.toLocaleString()}</dd>
          <dt className="text-slate-500">Industries configured</dt>
          <dd>{Object.keys(INDUSTRY_CONFIGS).length}</dd>
          <dt className="text-slate-500">BSC benchmarks</dt>
          <dd>{SCORING_BENCHMARKS.length} metrics</dd>
        </dl>
        {effective?.economy_multipliers && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-700">Economy multipliers</h3>
            <pre className="mt-1 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(effective.economy_multipliers, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {scenarioTrace && (
        <section className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
          <h2 className="font-semibold text-indigo-900">
            Scenario trace {scenarioLabel ? `— ${scenarioLabel}` : ""}
          </h2>
          <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            <dt>Total BSC</dt>
            <dd>{scenarioTrace.bsc_scores.total_score.toFixed(1)}</dd>
            <dt>Productivity</dt>
            <dd>{(scenarioTrace.industry_adjusted_metrics.productivity * 100).toFixed(1)}%</dd>
            <dt>Turnover</dt>
            <dd>{scenarioTrace.industry_adjusted_metrics.turnover_rate.toFixed(1)}%</dd>
            <dt>Profit</dt>
            <dd>${scenarioTrace.financial_cascade.profit.toLocaleString()}</dd>
            <dt>Budget adherence</dt>
            <dd>{scenarioTrace.budget_breakdown.adherence_pct.toFixed(1)}%</dd>
          </dl>
          <h3 className="mt-4 text-sm font-medium">Normalized metrics</h3>
          <pre className="mt-1 max-h-48 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
            {JSON.stringify(scenarioTrace.normalized_metrics, null, 2)}
          </pre>
          <h3 className="mt-4 text-sm font-medium">Carry-forward note</h3>
          <p className="text-sm text-slate-600">
            Up to 20% of unspent discretionary budget carries to the next round after
            compute. Team headcount, revenue, and satisfaction update from financial and
            HR metrics.
          </p>
        </section>
      )}

      {!scenarioTrace && (
        <p className="text-sm text-slate-500">
          Run a scenario test to see intermediate calculations and normalized metrics.
        </p>
      )}
    </div>
  );
}
