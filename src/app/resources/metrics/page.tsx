import {
  PlaceholderPanel,
  StudentPageHeader,
} from "@/components/student/shell/StudentShell";

const METRICS = [
  "Cost per Hire",
  "Time to Fill",
  "Hiring Quality",
  "Turnover Rate",
  "Employee Satisfaction",
  "Engagement",
  "Training ROI",
  "Productivity Index",
  "Compensation Ratio",
  "Budget Adherence",
  "DEI Score",
  "HR Tech Score",
];

export default function MetricsReferencePage() {
  return (
    <div>
      <StudentPageHeader
        title="HR Metrics Reference"
        subtitle="Definitions for metrics used across The Workforce Brief and Decision Impact Preview."
      />
      <PlaceholderPanel title="Metric catalog">
        <p className="mb-3">
          Detailed metric pages will expand as instructional content is finalized.
          Current validated metric names used in the simulation include:
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {METRICS.map((m) => (
            <li
              key={m}
              className="rounded-lg border border-[#f0f1f3] bg-[#f8f9fb] px-3 py-2 text-sm text-[#1f2937]"
            >
              {m}
            </li>
          ))}
        </ul>
      </PlaceholderPanel>
    </div>
  );
}
