import {
  ProfessorPageHeader,
  ProfessorStubPanel,
} from "@/components/instructor/ProfessorShell";

export default function ProfessorTeachingResourcesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Teaching Resources"
        subtitle="Slides, worksheets, and classroom activities."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          {
            label: "Resources",
            href: "/sessions/professor-resources",
          },
          { label: "Teaching Resources" },
        ]}
      />
      <ProfessorStubPanel title="Materials pending">
        Teaching packs will be linked here when Cooper delivers final files.
      </ProfessorStubPanel>
    </div>
  );
}
