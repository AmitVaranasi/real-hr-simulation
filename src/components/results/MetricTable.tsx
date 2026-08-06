import type { MetricFeedback } from "@/lib/engine/types";

const STATUS_STYLES = {
  excellent: "bg-emerald-100 text-emerald-800",
  moderate: "bg-amber-100 text-amber-800",
  poor: "bg-sky-100 text-sky-800",
  critical: "bg-red-100 text-red-800",
};

export function MetricTable({ metrics }: { metrics: MetricFeedback[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--portal-sidebar-border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--portal-page)] text-left text-[var(--portal-muted)]">
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
              <td className="px-4 py-3 text-[var(--portal-muted)]">
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

type MetricRow = [string, unknown, string];

/** Cooper V5 Workforce Performance Metrics — grouped by HR functional category */
const METRIC_CATEGORIES: Array<{ title: string; rows: MetricRow[] }> = [
  {
    title: "Talent Acquisition",
    rows: [
      ["Cost per hire", "cost_per_hire", "$"],
      ["Time to fill (days)", "time_to_fill", ""],
      ["Hiring quality", "hiring_quality", "/100"],
    ],
  },
  {
    title: "Workforce & Employee Experience",
    rows: [
      ["Turnover rate (%)", "turnover_rate", ""],
      ["Turnover cost", "turnover_cost", "$"],
      ["Employee satisfaction", "employee_satisfaction", "/100"],
      ["Engagement", "engagement_level", "/100"],
      ["Absenteeism (days)", "absenteeism_rate", ""],
    ],
  },
  {
    title: "Learning & Talent Development",
    rows: [
      ["Training ROI (%)", "training_roi", ""],
      ["Training effectiveness (%)", "training_effectiveness", ""],
      ["Succession pipeline (%)", "succession_pipeline", ""],
    ],
  },
  {
    title: "Performance Management",
    rows: [["Review coverage (%)", "review_coverage", ""]],
  },
  {
    title: "Compensation & HR Financials",
    rows: [
      ["Compensation ratio (%)", "compensation_ratio", ""],
      ["Budget adherence (%)", "budget_adherence", ""],
      ["Productivity index (%)", "productivity", "pct100"],
    ],
  },
  {
    title: "Workforce Inclusion",
    rows: [["DEI score", "dei_score", "/100"]],
  },
  {
    title: "HR Technology & Capability",
    rows: [["HR tech score", "hr_tech_score", "/100"]],
  },
];

function formatMetricValue(
  name: string,
  val: unknown,
  suffix: string
): string {
  if (val == null || Number.isNaN(Number(val))) return "—";
  if (suffix === "$") return `$${Number(val).toLocaleString()}`;
  if (suffix === "/100") return `${Number(val).toFixed(1)}/100`;
  if (suffix === "pct100" || name === "Productivity index (%)") {
    return `${(Number(val) * 100).toFixed(1)}%`;
  }
  return Number(val).toFixed(2);
}

export function OutcomeMetricTable({
  outcome,
}: {
  outcome: Record<string, unknown>;
}) {
  return (
    <div className="space-y-4">
      {METRIC_CATEGORIES.map((category) => {
        const present = category.rows.filter(
          ([, key]) => outcome[key as string] != null
        );
        if (present.length === 0) return null;
        return (
          <div
            key={category.title}
            className="overflow-x-auto rounded-xl border border-[var(--portal-sidebar-border)]"
          >
            <div className="border-b border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-4 py-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--portal-primary)]">
                {category.title}
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[var(--portal-page)] text-left text-[var(--portal-muted)]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">HR Metric</th>
                  <th className="px-4 py-2.5 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {present.map(([name, key, suffix]) => (
                  <tr key={String(name)} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-[var(--portal-ink)]">{name}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatMetricValue(
                        String(name),
                        outcome[key as string],
                        suffix
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
