import {
  ProfessorPageHeader,
  ProfessorStubPanel,
} from "@/components/instructor/ProfessorShell";

export default function ProfessorGuidePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Professor Guide"
        subtitle="Course setup, pacing, and facilitation guidance."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          {
            label: "Resources",
            href: "/sessions/professor-resources",
          },
          { label: "Professor Guide" },
        ]}
      />
      <ProfessorStubPanel title="Guide sections (shell)">
        Heading architecture is ready for Cooper&apos;s Professor Guide copy:
        Course Setup, Round Cadence, Decision Module Notes, Debrief Cadence, and
        Assessment Guidance.
      </ProfessorStubPanel>
    </div>
  );
}
