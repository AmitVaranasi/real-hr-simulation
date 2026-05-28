import type { MetricFeedback } from "@/lib/engine/types";

const STATUS_STYLES = {
  excellent: "bg-emerald-100 text-emerald-800",
  moderate: "bg-amber-100 text-amber-800",
  poor: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export function MetricTable({ metrics }: { metrics: MetricFeedback[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3">Metric</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Benchmark</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.metric_name} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium text-slate-800">
                {m.display_name}
              </td>
              <td className="px-4 py-3">{m.formatted_value}</td>
              <td className="px-4 py-3 text-slate-500">
                Excellent: {m.benchmark_excellent} · Poor: {m.benchmark_poor}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[m.status]}`}
                >
                  {m.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OutcomeMetricTable({
  outcome,
}: {
  outcome: Record<string, unknown>;
}) {
  const rows: Array<[string, unknown, string]> = [
    ["Cost per hire", outcome.cost_per_hire, "$"],
    ["Time to fill (days)", outcome.time_to_fill, ""],
    ["Turnover rate (%)", outcome.turnover_rate, ""],
    ["Employee satisfaction", outcome.employee_satisfaction, "/100"],
    ["Engagement", outcome.engagement_level, "/100"],
    ["Training ROI (%)", outcome.training_roi, ""],
    ["DEI score", outcome.dei_score, "/100"],
    ["Absenteeism (days)", outcome.absenteeism_rate, ""],
    ["Review coverage (%)", outcome.review_coverage, ""],
    ["Training effectiveness (%)", outcome.training_effectiveness, ""],
    ["Succession pipeline (%)", outcome.succession_pipeline, ""],
    ["HR tech score", outcome.hr_tech_score, "/100"],
    ["Compensation ratio (%)", outcome.compensation_ratio, ""],
    ["Budget adherence (%)", outcome.budget_adherence, ""],
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="px-4 py-3">HR Metric</th>
            <th className="px-4 py-3">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, val, suffix]) => (
            <tr key={String(name)} className="border-t border-slate-100">
              <td className="px-4 py-3 text-slate-700">{name}</td>
              <td className="px-4 py-3 font-medium">
                {suffix === "$"
                  ? `$${Number(val).toLocaleString()}`
                  : suffix === "/100"
                    ? `${Number(val).toFixed(1)}/100`
                    : Number(val).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
