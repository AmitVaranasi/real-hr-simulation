import { ResourcesSectionPage } from "@/components/student/ResourcesOverview";

const GROUPS = [
  {
    title: "Talent Acquisition",
    metrics: ["Cost per Hire", "Time to Fill", "Hiring Quality"],
  },
  {
    title: "Workforce & Employee Experience",
    metrics: [
      "Turnover Rate",
      "Turnover Cost",
      "Employee Satisfaction",
      "Engagement",
      "Absenteeism",
    ],
  },
  {
    title: "Learning & Talent Development",
    metrics: [
      "Training ROI",
      "Training Effectiveness",
      "Succession Pipeline",
    ],
  },
  {
    title: "Performance Management",
    metrics: ["Review Coverage"],
  },
  {
    title: "Compensation & HR Financials",
    metrics: ["Compensation Ratio", "Budget Adherence", "Productivity Index"],
  },
  {
    title: "Workforce Inclusion",
    metrics: ["DEI Score"],
  },
  {
    title: "HR Technology & Capability",
    metrics: ["HR Tech Score"],
  },
];

export default function MetricsReferencePage() {
  return (
    <ResourcesSectionPage
      title="HR Metrics Reference"
      subtitle="Metric groups used in The Workforce Brief and related analytics views."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((g) => (
          <section
            key={g.title}
            className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold text-[var(--portal-title)]">{g.title}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-[var(--portal-ink)]">
              {g.metrics.map((m) => (
                <li key={m} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  {m}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ResourcesSectionPage>
  );
}
