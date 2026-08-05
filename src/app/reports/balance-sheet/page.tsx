import {
  ReportsRoundList,
  ReportsShell,
} from "@/components/student/ReportsShell";
import { PlaceholderPanel } from "@/components/student/shell/StudentShell";

export const dynamic = "force-dynamic";

function FinancialShell({
  title,
  activeHref,
  note,
}: {
  title: string;
  activeHref: string;
  note: string;
}) {
  return (
    <ReportsShell
      title={title}
      subtitle="View of the same finalized organizational/financial state produced by the simulation engine — not an independent calculation engine."
      activeHref={activeHref}
    >
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <ReportsRoundList />
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Total Assets", "Total Liabilities", "Total Equity", "Working Capital"].map(
              (label) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#dde1e6] bg-white p-4 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-wide text-[#6b7280]">
                    {label}
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#0f172a]">—</p>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    Pending validated financial statement mapping
                  </p>
                </div>
              )
            )}
          </div>
          <PlaceholderPanel title="Iteration #4 boundary">
            {note} Revenue, profit, stock, and other existing outcome fields remain
            available in The Workforce Brief. Full statement line items will map
            from the same finalized round dataset once the financial model is
            validated — they will not be invented here.
          </PlaceholderPanel>
        </div>
      </div>
    </ReportsShell>
  );
}

export default function BalanceSheetPage() {
  return (
    <FinancialShell
      title="Balance Sheet"
      activeHref="/reports/balance-sheet"
      note="Balance Sheet shells are established for navigation and round selection."
    />
  );
}
