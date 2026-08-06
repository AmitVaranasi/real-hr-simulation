import {
  ReportsRoundList,
  ReportsShell,
} from "@/components/student/ReportsShell";
import { PlaceholderPanel } from "@/components/student/shell/StudentShell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfitLossPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/reports/profit-loss");

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: latest } = membership
    ? await supabase
        .from("outcomes")
        .select("revenue, profit, total_budget_spent, rounds(round_number)")
        .eq("team_id", membership.team_id)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const round = latest?.rounds as unknown as { round_number: number } | null;

  return (
    <ReportsShell
      title="Profit & Loss Statement"
      subtitle="Same finalized round financials as The Workforce Brief — different presentation."
      activeHref="/reports/profit-loss"
    >
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <ReportsRoundList />
        <div className="space-y-4">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-accent-blue)]">
              Profit &amp; Loss — Round {round?.round_number ?? "—"}
            </h2>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <dt className="text-[var(--portal-muted)]">Revenue</dt>
              <dd className="font-semibold">
                {latest ? formatCurrency(Number(latest.revenue)) : "—"}
              </dd>
              <dt className="text-[var(--portal-muted)]">Profit</dt>
              <dd className="font-semibold">
                {latest ? formatCurrency(Number(latest.profit)) : "—"}
              </dd>
              <dt className="text-[var(--portal-muted)]">Total HR Budget Spent</dt>
              <dd className="font-semibold">
                {latest?.total_budget_spent != null
                  ? formatCurrency(Number(latest.total_budget_spent))
                  : "—"}
              </dd>
              <dt className="text-[var(--portal-muted)]">Other P&amp;L lines</dt>
              <dd className="font-semibold">—</dd>
            </dl>
          </section>
          <PlaceholderPanel title="No independent P&L engine">
            Additional statement lines remain placeholders until mapped from the
            validated financial model. Do not treat dashes as zeros.
          </PlaceholderPanel>
        </div>
      </div>
    </ReportsShell>
  );
}
