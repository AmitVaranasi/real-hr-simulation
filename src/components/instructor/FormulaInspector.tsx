"use client";

import type {
  Decision,
  HRMetrics,
  SimulationTrace,
} from "@/lib/engine/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

export type CarryForwardInfo = {
  prior_round_number: number | null;
  budget_carryover: number;
  prior_metrics: HRMetrics | null;
  prior_financials: {
    revenue: number;
    profit: number;
    stock_price: number;
    total_score: number;
  } | null;
  team_rolling_state: {
    headcount: number | null;
    revenue: number | null;
    stock_price: number | null;
    satisfaction: number | null;
    engagement: number | null;
    turnover_rate: number | null;
  };
};

interface FormulaInspectorProps {
  teamName: string;
  roundLabel: string;
  decision: Decision | null;
  trace: SimulationTrace;
  carryForward?: CarryForwardInfo | null;
}

export function FormulaInspector({
  teamName,
  roundLabel,
  decision,
  trace,
  carryForward,
}: FormulaInspectorProps) {
  const b = trace.budget_breakdown;
  const m = trace.industry_adjusted_metrics;
  const fc = trace.financial_cascade;
  const pc = trace.productivity_components;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Formula inspector</h1>
        <p className="text-slate-600">
          {teamName} · {roundLabel}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Inputs → budget → HR metrics → financials → BSC → final score
        </p>
      </div>

      {carryForward && (
        <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <h2 className="font-semibold text-slate-900">
            0. Carry-forward (prior → current)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {carryForward.prior_round_number != null
              ? `Prior round ${carryForward.prior_round_number} feeds rolling team state and metric momentum.`
              : "First scored round — using industry baseline as prior state."}
          </p>
          <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            <dt className="text-slate-500">Budget carryover into this round</dt>
            <dd className="font-medium">
              {formatCurrency(carryForward.budget_carryover)}
            </dd>
            <dt className="text-slate-500">Rolling headcount</dt>
            <dd>{carryForward.team_rolling_state.headcount ?? "—"}</dd>
            <dt className="text-slate-500">Rolling revenue</dt>
            <dd>
              {carryForward.team_rolling_state.revenue != null
                ? formatCurrency(Number(carryForward.team_rolling_state.revenue))
                : "—"}
            </dd>
            <dt className="text-slate-500">Rolling stock</dt>
            <dd>
              {carryForward.team_rolling_state.stock_price != null
                ? `$${Number(carryForward.team_rolling_state.stock_price).toFixed(2)}`
                : "—"}
            </dd>
          </dl>
          {carryForward.prior_metrics && (
            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
              <p>
                Prior turnover:{" "}
                {(carryForward.prior_metrics.turnover_rate * 100).toFixed(1)}%
              </p>
              <p>
                Prior engagement:{" "}
                {(carryForward.prior_metrics.engagement_level * 100).toFixed(0)}%
              </p>
              <p>
                Prior satisfaction:{" "}
                {(
                  carryForward.prior_metrics.employee_satisfaction * 100
                ).toFixed(0)}
                %
              </p>
            </div>
          )}
          {carryForward.prior_financials && (
            <p className="mt-2 text-sm text-slate-600">
              Prior BSC: {carryForward.prior_financials.total_score.toFixed(1)} ·
              Prior profit:{" "}
              {formatCurrency(carryForward.prior_financials.profit)}
            </p>
          )}
        </section>
      )}

      {decision && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">1. Student decisions</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>
              Positions:{" "}
              {decision.positions_to_fill
                .map((p) => `${p.count} ${p.role_id}`)
                .join(", ") || "none"}
            </li>
            <li>Screening rigor: {decision.screening_rigor}</li>
            <li>Diversity goal: {decision.diversity_goal_pct}%</li>
            <li>Conflict: {decision.conflict_approach}</li>
            <li>Bonus tier: {decision.bonus_tier}%</li>
            <li>Benefits: {decision.benefits_pct}% of salary</li>
            <li>
              Programs: {decision.developmental_programs.join(", ") || "none"}
            </li>
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">2. Budget breakdown</h2>
        <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          <dt>Recruitment</dt>
          <dd>{formatCurrency(b.recruitment_spend)}</dd>
          <dt>Performance</dt>
          <dd>{formatCurrency(b.performance_spend)}</dd>
          <dt>Training</dt>
          <dd>{formatCurrency(b.training_spend)}</dd>
          <dt>Relations</dt>
          <dd>{formatCurrency(b.relations_spend)}</dd>
          <dt>Compensation (discretionary)</dt>
          <dd>{formatCurrency(b.compensation_spend)}</dd>
          <dt>HR technology</dt>
          <dd>{formatCurrency(b.org_design_spend)}</dd>
          <dt className="font-medium text-slate-800">Total</dt>
          <dd className="font-medium">
            {formatCurrency(b.total_spend)} / {formatCurrency(b.available_budget)}{" "}
            ({formatPercent(b.adherence_pct)} adherence)
          </dd>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 overflow-x-auto">
        <h2 className="font-semibold text-slate-900">3. HR metrics</h2>
        <table className="mt-2 w-full min-w-[480px] text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-1">Metric</th>
              <th>Raw</th>
              <th>Normalized</th>
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(trace.normalized_metrics).map((key) => (
              <tr key={key} className="border-t border-slate-100">
                <td className="py-1 capitalize">{key.replace(/_/g, " ")}</td>
                <td>
                  {typeof trace.raw_metrics[key as keyof typeof trace.raw_metrics] ===
                  "number"
                    ? Number(
                        trace.raw_metrics[key as keyof typeof trace.raw_metrics]
                      ).toFixed(2)
                    : "—"}
                </td>
                <td>
                  {(trace.normalized_metrics[key] * 100).toFixed(0)}%
                </td>
                <td>
                  {typeof m[key as keyof typeof m] === "number"
                    ? Number(m[key as keyof typeof m]).toFixed(2)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">4. Productivity engine</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          <li>Training: {(pc.training * 100).toFixed(1)}% weight → {(pc.training * 0.3).toFixed(3)}</li>
          <li>Engagement: {(pc.engagement * 100).toFixed(1)}% → {(pc.engagement * 0.25).toFixed(3)}</li>
          <li>Retention: {(pc.retention * 100).toFixed(1)}% → {(pc.retention * 0.2).toFixed(3)}</li>
          <li>Leadership: {(pc.leadership * 100).toFixed(1)}% → {(pc.leadership * 0.15).toFixed(3)}</li>
          <li>Technology: {(pc.technology * 100).toFixed(1)}% → {(pc.technology * 0.1).toFixed(3)}</li>
          <li className="font-medium text-slate-800">
            Total productivity index: {(pc.total * 100).toFixed(1)}%
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">5. Financial cascade</h2>
        <dl className="mt-2 grid gap-1 text-sm">
          <dt>Revenue</dt>
          <dd>{formatCurrency(fc.revenue)}</dd>
          <dt>Total compensation</dt>
          <dd>{formatCurrency(fc.total_compensation)}</dd>
          <dt>Turnover cost</dt>
          <dd>{formatCurrency(fc.turnover_cost)}</dd>
          <dt>Other HR costs</dt>
          <dd>{formatCurrency(fc.other_hr_costs)}</dd>
          <dt>Non-HR expenses</dt>
          <dd>{formatCurrency(fc.non_hr_expenses)}</dd>
          <dt className="font-medium">Profit</dt>
          <dd className="font-medium">{formatCurrency(fc.profit)}</dd>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">6. BSC scoring</h2>
        <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          <dt>Financial</dt>
          <dd>{trace.bsc_scores.score_financial.toFixed(1)}</dd>
          <dt>Employee</dt>
          <dd>{trace.bsc_scores.score_employee.toFixed(1)}</dd>
          <dt>Process</dt>
          <dd>{trace.bsc_scores.score_process.toFixed(1)}</dd>
          <dt>Learning</dt>
          <dd>{trace.bsc_scores.score_learning.toFixed(1)}</dd>
          <dt>Strategy bonus</dt>
          <dd>+{trace.bsc_scores.strategy_bonus}</dd>
          <dt>Industry penalty</dt>
          <dd>-{trace.bsc_scores.industry_penalty}</dd>
          <dt className="font-medium">Total</dt>
          <dd className="font-medium text-indigo-700">
            {trace.bsc_scores.total_score.toFixed(1)}
          </dd>
        </dl>
      </section>
    </div>
  );
}
