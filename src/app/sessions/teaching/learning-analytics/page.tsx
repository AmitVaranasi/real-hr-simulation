import {
  ProfessorPageHeader,
  ProfessorStubPanel,
} from "@/components/instructor/ProfessorShell";

export default function LearningAnalyticsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Learning Analytics"
        subtitle="Engagement and learning signal shells for the course."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Teaching & Debrief", href: "/sessions/teaching" },
          { label: "Learning Analytics" },
        ]}
      />
      <ProfessorStubPanel title="Analytics shell">
        Learning analytics visualizations are stubbed pending Cooper&apos;s
        preferred metrics and privacy constraints.
      </ProfessorStubPanel>
    </div>
  );
}
