import {
  ProfessorPageHeader,
  ProfessorStubPanel,
} from "@/components/instructor/ProfessorShell";

export default function TeamInsightsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Team Insights"
        subtitle="Coaching frames for individual company teams."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Teaching & Debrief", href: "/sessions/teaching" },
          { label: "Team Insights" },
        ]}
      />
      <ProfessorStubPanel title="Content pending">
        Team Insights coaching cards will appear here when instructional copy is
        delivered. Live team outcomes remain available via Class Performance.
      </ProfessorStubPanel>
    </div>
  );
}
