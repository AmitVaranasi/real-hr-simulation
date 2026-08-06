import {
  ProfessorPageHeader,
  ProfessorStubPanel,
} from "@/components/instructor/ProfessorShell";

export default function ProfessorDownloadsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Downloads"
        subtitle="Downloadable course files and templates for instructors."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          {
            label: "Resources",
            href: "/sessions/professor-resources",
          },
          { label: "Downloads" },
        ]}
      />
      <ProfessorStubPanel title="Downloads pending">
        File hosting will be connected when Cooper finalizes Professor Downloads
        content. Architecture matches the Resources navigation.
      </ProfessorStubPanel>
    </div>
  );
}
