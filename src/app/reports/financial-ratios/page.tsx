import {
  ReportsRoundList,
  ReportsShell,
} from "@/components/student/ReportsShell";
import { PlaceholderPanel } from "@/components/student/shell/StudentShell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FinancialRatiosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/reports/financial-ratios");

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: latest } = membership
    ? await supabase
        .from("outcomes")
        .select("profit_margin, market_share, budget_adherence, compensation_ratio")
        .eq("team_id", membership.team_id)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <ReportsShell
      title="Financial Ratios"
      subtitle="Ratios derived from finalized outcome fields already produced by the simulation."
      activeHref="/reports/financial-ratios"
    >
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <ReportsRoundList />
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "Profit Margin",
                value:
                  latest?.profit_margin != null
                    ? formatPercent(Number(latest.profit_margin))
                    : "—",
              },
              {
                label: "Market Share",
                value:
                  latest?.market_share != null
                    ? formatPercent(Number(latest.market_share))
                    : "—",
              },
              {
                label: "Budget Adherence",
                value:
                  latest?.budget_adherence != null
                    ? formatPercent(Number(latest.budget_adherence))
                    : "—",
              },
              {
                label: "Compensation Ratio",
                value:
                  latest?.compensation_ratio != null
                    ? formatPercent(Number(latest.compensation_ratio))
                    : "—",
              },
            ].map((r) => (
              <div
                key={r.label}
                className="rounded-xl border border-[#dde1e6] bg-white p-4 shadow-sm"
              >
                <p className="text-xs uppercase tracking-wide text-[#6b7280]">
                  {r.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-[#0f172a]">{r.value}</p>
              </div>
            ))}
          </div>
          <PlaceholderPanel title="Additional ratios">
            Liquidity, leverage, and other classic ratios remain — until the
            underlying financial statement mapping is validated.
          </PlaceholderPanel>
        </div>
      </div>
    </ReportsShell>
  );
}
