import {
  ProfessorPageHeader,
  ProfessorStubPanel,
} from "@/components/instructor/ProfessorShell";

export default function DebriefPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Discussion & Debrief"
        subtitle="Facilitation outline for in-class debrief sessions."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Teaching & Debrief", href: "/sessions/teaching" },
          { label: "Discussion & Debrief" },
        ]}
      />
      <ProfessorStubPanel title="Facilitation shell">
        Agenda blocks, discussion questions, and board prompts will be added as
        Cooper finalizes Teaching &amp; Debrief materials.
      </ProfessorStubPanel>
    </div>
  );
}
