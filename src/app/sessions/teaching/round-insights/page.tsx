import {
  ProfessorPageHeader,
  ProfessorStubPanel,
} from "@/components/instructor/ProfessorShell";

export default function RoundInsightsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Round Insights"
        subtitle="Structured prompts for post-round classroom discussion."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Teaching & Debrief", href: "/sessions/teaching" },
          { label: "Round Insights" },
        ]}
      />
      <ProfessorStubPanel title="Content pending">
        Cooper&apos;s Round Insights materials will populate this shell. Until then,
        use Industry Results and Formula Inspect for evidence-based debrief.
      </ProfessorStubPanel>
    </div>
  );
}
