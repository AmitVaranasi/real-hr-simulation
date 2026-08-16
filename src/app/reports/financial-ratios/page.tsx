import { FinancialRatiosView } from "@/components/reports/FinancialRatiosView";
import { loadFinancialReportData } from "@/lib/reports/load-report-data";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FinancialRatiosPage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/reports/financial-ratios");

  const params = await searchParams;
  const data = await loadFinancialReportData(
    "/reports/financial-ratios",
    params.round
  );

  return (
      <FinancialRatiosView
        roundNumber={data.roundNumber}
        asOfLabel={data.asOfLabel}
        rounds={data.rounds}
        selectedRoundId={data.selectedRoundId}
        liveRevenue={data.liveRevenue}
        liveProfit={data.liveProfit}
        liveProfitMargin={data.liveProfitMargin}
        liveHeadcount={data.liveHeadcount}
      />
  );
}
