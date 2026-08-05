import {
  ReportsRoundList,
  ReportsShell,
} from "@/components/student/ReportsShell";
import { PlaceholderPanel } from "@/components/student/shell/StudentShell";

export const dynamic = "force-dynamic";

export default function CashFlowPage() {
  return (
    <ReportsShell
      title="Cash Flow Statement"
      subtitle="Architecture shell for round-based cash flow views of finalized simulation state."
      activeHref="/reports/cash-flow"
    >
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <ReportsRoundList />
        <PlaceholderPanel title="Cash Flow — pending financial mapping">
          Operating, investing, and financing sections will display values from the
          same finalized round dataset used by The Workforce Brief. Unsupported
          lines show as — rather than invented figures.
        </PlaceholderPanel>
      </div>
    </ReportsShell>
  );
}
