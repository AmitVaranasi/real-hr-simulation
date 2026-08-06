import {
  ProfessorPageHeader,
  ProfessorStubPanel,
} from "@/components/instructor/ProfessorShell";

export default function ProfessorReferencePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Simulation Reference"
        subtitle="Engine and scoring reference for instructors."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          {
            label: "Resources",
            href: "/sessions/professor-resources",
          },
          { label: "Simulation Reference" },
        ]}
      />
      <ProfessorStubPanel title="Reference shell">
        Use Simulation Lab → Formula Inspect and Configuration for live engine
        details. Narrative reference articles will land here as materials are
        finalized.
      </ProfessorStubPanel>
    </div>
  );
}
