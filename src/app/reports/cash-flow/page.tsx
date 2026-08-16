import { CashFlowView } from "@/components/reports/CashFlowView";
import { loadFinancialReportData } from "@/lib/reports/load-report-data";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CashFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/reports/cash-flow");

  const params = await searchParams;
  const data = await loadFinancialReportData(
    "/reports/cash-flow",
    params.round
  );

  return (
      <CashFlowView
        roundNumber={data.roundNumber}
        asOfLabel={data.asOfLabel}
        rounds={data.rounds}
        selectedRoundId={data.selectedRoundId}
        liveRevenue={data.liveRevenue}
        liveCompensation={data.liveCompensation}
      />
  );
}
