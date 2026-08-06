import { ResourcesSectionPage } from "@/components/student/ResourcesOverview";
import { PlaceholderPanel } from "@/components/student/shell/StudentShell";

const TOPICS = [
  {
    title: "Understanding the HR Balanced Scorecard",
    body: "How Financial, Employee, Internal Process, and Learning & Growth perspectives combine into round scores.",
  },
  {
    title: "Understanding Industry Guidance",
    body: "Suggested investment ranges and why they differ by industry context.",
  },
  {
    title: "Understanding Decision Impact Previews",
    body: "How previews help teams anticipate directional effects before submit.",
  },
  {
    title: "Understanding Budgeting & Tradeoffs",
    body: "Discretionary budget, module investment shares, and opportunity cost across HR areas.",
  },
  {
    title: "Understanding Round Results",
    body: "Workforce Brief structure, metric groups, and how to read feedback panels.",
  },
  {
    title: "Understanding Strategy Alignment",
    body: "How industry strategy settings interact with HR decisions and BSC weights.",
  },
];

export default function ReferenceCenterPage() {
  return (
    <ResourcesSectionPage
      title="Simulation Reference Center"
      subtitle="Mechanics and reporting concepts that support stronger HR decisions."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {TOPICS.map((t) => (
          <article
            key={t.title}
            className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold text-[var(--portal-title)]">{t.title}</h2>
            <p className="mt-2 text-sm text-[var(--portal-muted)]">{t.body}</p>
          </article>
        ))}
      </div>
      <PlaceholderPanel title="Expanded articles coming soon">
        Full instructional articles and diagrams will be added as Dr. Cooper
        finalizes Simulation Reference content. Navigation and topic architecture
        match the design specification.
      </PlaceholderPanel>
    </ResourcesSectionPage>
  );
}
