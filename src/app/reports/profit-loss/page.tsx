import { ProfitLossView } from "@/components/reports/ProfitLossView";
import { loadFinancialReportData } from "@/lib/reports/load-report-data";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/reports/profit-loss");

  const params = await searchParams;
  const data = await loadFinancialReportData(
    "/reports/profit-loss",
    params.round
  );

  return (
      <ProfitLossView
        roundNumber={data.roundNumber}
        asOfLabel={data.asOfLabel}
        rounds={data.rounds}
        selectedRoundId={data.selectedRoundId}
        liveRevenue={data.liveRevenue}
        liveProfit={data.liveProfit}
        liveCompensation={data.liveCompensation}
        liveTurnover={data.liveTurnover}
        liveHeadcount={data.liveHeadcount}
      />
  );
}
