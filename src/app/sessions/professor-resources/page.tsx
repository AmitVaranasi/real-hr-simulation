import {
  ProfessorCardGrid,
  ProfessorPageHeader,
} from "@/components/instructor/ProfessorShell";

export default function ProfessorResourcesHubPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Professor Resources"
        subtitle="Guides, teaching packs, reference materials, and downloads."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Resources" },
        ]}
      />
      <ProfessorCardGrid
        items={[
          {
            title: "Professor Guide",
            body: "Course setup, pacing, and facilitation guidance.",
            href: "/sessions/professor-resources/guide",
          },
          {
            title: "Teaching Resources",
            body: "Slides, worksheets, and classroom activities.",
            href: "/sessions/professor-resources/teaching",
          },
          {
            title: "Simulation Reference",
            body: "Engine and scoring reference for instructors.",
            href: "/sessions/professor-resources/reference",
          },
          {
            title: "Downloads",
            body: "Downloadable course files and templates.",
            href: "/sessions/professor-resources/downloads",
          },
        ]}
      />
    </div>
  );
}
