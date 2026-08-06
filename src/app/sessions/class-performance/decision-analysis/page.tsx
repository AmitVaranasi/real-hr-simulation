import {
  ProfessorPageHeader,
  ProfessorStubPanel,
} from "@/components/instructor/ProfessorShell";

export default function DecisionAnalysisPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Decision Analysis"
        subtitle="Module investment patterns and tradeoff analysis across teams."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Class Performance" },
          { label: "Decision Analysis" },
        ]}
      />
      <ProfessorStubPanel title="Shell ready for Cooper content">
        Decision Analysis will surface module-level spend and outcome linkages.
        Existing Formula Inspect and Industry Results remain the live data paths.
      </ProfessorStubPanel>
    </div>
  );
}
