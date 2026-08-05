import {
  PlaceholderPanel,
  StudentPageHeader,
} from "@/components/student/shell/StudentShell";

export default function ReferenceCenterPage() {
  return (
    <div>
      <StudentPageHeader
        title="Simulation Reference Center"
        subtitle="Orientation and navigation support for the Real HR Simulation."
      />
      <div className="space-y-4">
        <PlaceholderPanel title="Understanding The Workforce Brief">
          After each round closes, The Workforce Brief walks you from the HR Balance
          Scorecard through strategic KPIs, perspective feedback, workforce metrics,
          and team reflection. Detailed article pages will expand here.
        </PlaceholderPanel>
        <PlaceholderPanel title="Decision-learning cycle">
          UNDERSTAND → DECIDE → RESULTS → REFLECT → ADJUST → NEXT ROUND
        </PlaceholderPanel>
      </div>
    </div>
  );
}
