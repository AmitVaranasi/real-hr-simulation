import { BalanceSheetView } from "@/components/reports/BalanceSheetView";
import { loadFinancialReportData } from "@/lib/reports/load-report-data";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/reports/balance-sheet");

  const params = await searchParams;
  const data = await loadFinancialReportData(
    "/reports/balance-sheet",
    params.round
  );

  return (
      <BalanceSheetView
        roundNumber={data.roundNumber}
        asOfLabel={data.asOfLabel}
        rounds={data.rounds}
        selectedRoundId={data.selectedRoundId}
        liveRevenue={data.liveRevenue}
        liveCompensation={data.liveCompensation}
        liveTurnover={data.liveTurnover}
      />
  );
}
