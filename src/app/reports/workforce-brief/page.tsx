import {
  ReportsRoundList,
  ReportsShell,
} from "@/components/student/ReportsShell";
import { PlaceholderPanel } from "@/components/student/shell/StudentShell";

export const dynamic = "force-dynamic";

export default function WorkforceBriefIndexPage() {
  return (
    <ReportsShell
      title="The Workforce Brief"
      subtitle="Post-round learning environment: HR Balance Scorecard → Strategic Performance Metrics → Perspective Feedback → Workforce Performance Metrics → Feedback → HR Coach / Team Reflection."
      activeHref="/reports/workforce-brief"
    >
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <ReportsRoundList />
        <PlaceholderPanel title="Select a finalized round">
          Choose a round from the left to open that round&apos;s Workforce Brief.
          All values come from finalized outcome data — this page does not
          recalculate the engine.
          <p className="mt-3">
            Learning sequence: HR Balance Scorecard → Strategic Performance
            Metrics KPIs → Perspective Feedback → Workforce Performance Metrics →
            Workforce Performance Feedback → HR Coach / Team Reflection.
          </p>
        </PlaceholderPanel>
      </div>
    </ReportsShell>
  );
}
