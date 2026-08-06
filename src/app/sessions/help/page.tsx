import {
  ProfessorCardGrid,
  ProfessorPageHeader,
  ProfessorStubPanel,
} from "@/components/instructor/ProfessorShell";

export default function ProfessorHelpPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Help Center"
        subtitle="Support paths for course operations, Simulation Lab, and classroom facilitation."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Help Center" },
        ]}
      />
      <ProfessorStubPanel title="Getting oriented">
        Use Course Management for enrollment and rounds, Simulation Lab for engine
        configuration, and Teaching &amp; Debrief for classroom facilitation
        shells.
      </ProfessorStubPanel>
      <div className="mt-4">
        <ProfessorCardGrid
          items={[
            {
              title: "Simulation Lab Configuration",
              body: "Edit engine assumptions without code changes.",
              href: "/sessions/config",
            },
            {
              title: "Testing Center",
              body: "Validate scenarios before applying to live courses.",
              href: "/sessions/testing",
            },
            {
              title: "Professor Guide",
              body: "Course setup and facilitation guidance shell.",
              href: "/sessions/professor-resources/guide",
            },
            {
              title: "Course Management",
              body: "Sessions, teams, announcements, and rounds.",
              href: "/sessions/manage",
            },
          ]}
        />
      </div>
    </div>
  );
}
