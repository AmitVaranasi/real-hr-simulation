import {
  ProfessorCardGrid,
  ProfessorPageHeader,
  ProfessorStubPanel,
} from "@/components/instructor/ProfessorShell";

export default function ClassAnalyticsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Reports & Analytics"
        subtitle="Class-level analytics shells aligned to the professor information architecture."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Class Performance" },
          { label: "Reports & Analytics" },
        ]}
      />
      <ProfessorStubPanel title="Analytics overview">
        Additional analytics dashboards will land here. Live exports remain under
        each session&apos;s Industry Results page.
      </ProfessorStubPanel>
      <div className="mt-4">
        <ProfessorCardGrid
          items={[
            {
              title: "Team Comparison",
              body: "Side-by-side team performance shell.",
              href: "/sessions/class-performance/team-comparison",
            },
            {
              title: "Decision Analysis",
              body: "Module decision patterns shell.",
              href: "/sessions/class-performance/decision-analysis",
            },
          ]}
        />
      </div>
    </div>
  );
}
