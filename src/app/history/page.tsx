import { TrendChart } from "@/components/results/TrendChart";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(name)")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/dashboard");

  const { data: outcomes } = await supabase
    .from("outcomes")
    .select("*, rounds(id, round_number, round_type, status)")
    .eq("team_id", membership.team_id)
    .order("computed_at");

  const trendData = (outcomes ?? []).map((o) => {
    const r = o.rounds as { round_number: number };
    return {
      round: `R${r.round_number}`,
      total: Number(o.instructor_override ?? o.total_score),
      financial: Number(o.score_financial),
      employee: Number(o.score_employee),
      process: Number(o.score_process),
      learning: Number(o.score_learning),
    };
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Round history</h1>
      <p className="text-slate-600">
        {(membership.teams as unknown as { name: string }).name}
      </p>

      {trendData.length >= 2 && (
        <div className="mt-8">
          <TrendChart data={trendData} />
        </div>
      )}

      <div className="mt-8 space-y-3">
        {(outcomes ?? []).map((o) => {
          const r = o.rounds as {
            round_number: number;
            round_type: string;
            id: string;
            status: string;
          };
          return (
            <Link
              key={o.id as string}
              href={
                r.status === "closed"
                  ? `/round/${r.id}/results`
                  : `/round/${r.id}/decisions`
              }
              className="block rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md"
            >
              <div className="flex justify-between">
                <span className="font-medium">
                  Round {r.round_number} ({r.round_type})
                </span>
                <span className="text-indigo-600 font-semibold">
                  {Number(o.instructor_override ?? o.total_score).toFixed(1)} / 100
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Revenue {formatCurrency(Number(o.revenue))} · Stock $
                {Number(o.stock_price).toFixed(2)}
              </p>
            </Link>
          );
        })}
        {(outcomes ?? []).length === 0 && (
          <p className="text-slate-500">No completed rounds yet.</p>
        )}
      </div>
    </div>
  );
}
