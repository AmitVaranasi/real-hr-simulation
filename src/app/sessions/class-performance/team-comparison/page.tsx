import {
  ProfessorCardGrid,
  ProfessorPageHeader,
  ProfessorStubPanel,
} from "@/components/instructor/ProfessorShell";

export default function ClassPerformanceTeamComparisonPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Team Comparison"
        subtitle="Compare team HR decisions and outcomes across the class."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Class Performance" },
          { label: "Team Comparison" },
        ]}
      />
      <ProfessorStubPanel title="Architecture shell">
        Team comparison charts and decision differentials will populate here once
        Cooper finalizes Class Performance analytics views. Use Industry Results
        and Leaderboard for live data today.
      </ProfessorStubPanel>
      <div className="mt-4">
        <ProfessorCardGrid
          items={[
            {
              title: "Industry Results",
              body: "Open reports for your active session.",
              href: "/sessions",
            },
            {
              title: "Decision Analysis",
              body: "Module-level decision patterns across teams.",
              href: "/sessions/class-performance/decision-analysis",
            },
          ]}
        />
      </div>
    </div>
  );
}
