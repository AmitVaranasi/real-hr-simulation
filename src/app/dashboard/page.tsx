import Link from "next/link";
import { CurrentRoundCard } from "@/components/student/CurrentRoundCard";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (profile?.role === "instructor") {
    redirect("/sessions");
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(*, sessions(name))")
    .eq("user_id", user.id)
    .maybeSingle();

  const team = membership?.teams as unknown as {
    id: string;
    name: string;
    industry: string;
    strategy: string;
    join_code: string;
    headcount: number;
    revenue: number;
    stock_price: number;
    session_id: string;
    sessions: { name: string };
  } | null;

  if (!team) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Welcome</h1>
        <p className="mt-2 text-slate-600">
          Join your class team with the code from your instructor. You do not
          need a special link — enter the code here.
        </p>
        <Link href="/join" className="mt-8 inline-block">
          <Button size="lg">Join a team</Button>
        </Link>
        <p className="mt-6 text-sm text-slate-500">
          Already have a link? It will work too — you will land on the same join
          screen.
        </p>
      </div>
    );
  }

  const { data: openRound } = await supabase
    .from("rounds")
    .select("id, round_number, round_type, status, economy_condition")
    .eq("session_id", team.session_id)
    .eq("status", "open")
    .maybeSingle();

  const { data: lastOutcome } = await supabase
    .from("outcomes")
    .select("*")
    .eq("team_id", team.id)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">
        Hello, {profile?.display_name}
      </h1>
      <p className="text-slate-600">{(team.sessions as { name: string })?.name}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">{team.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {team.industry} · {team.strategy}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Headcount</dt>
            <dd>{team.headcount ?? "—"}</dd>
            <dt className="text-slate-500">Revenue</dt>
            <dd>
              {team.revenue ? formatCurrency(Number(team.revenue)) : "—"}
            </dd>
            <dt className="text-slate-500">Stock</dt>
            <dd>
              {team.stock_price
                ? `$${Number(team.stock_price).toFixed(2)}`
                : "—"}
            </dd>
          </dl>
        </div>

        <CurrentRoundCard
          initialOpenRound={
            openRound
              ? {
                  id: openRound.id,
                  round_number: openRound.round_number,
                  round_type: openRound.round_type,
                  status: openRound.status,
                  economy_condition: openRound.economy_condition,
                }
              : null
          }
        />

        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:col-span-2 flex flex-wrap gap-3 items-center">
          <Link href="/history" className="text-sm text-indigo-600 hover:underline">
            Round history →
          </Link>
          <Link href="/leaderboard" className="text-sm text-indigo-600 hover:underline">
            Leaderboard →
          </Link>
        </div>

        {lastOutcome && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:col-span-2">
            <h2 className="font-semibold text-slate-900">Last round score</h2>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {Number(lastOutcome.total_score).toFixed(1)} / 100
            </p>
            <p className="mt-1 text-sm text-slate-500">
              F: {Number(lastOutcome.score_financial).toFixed(0)} · E:{" "}
              {Number(lastOutcome.score_employee).toFixed(0)} · P:{" "}
              {Number(lastOutcome.score_process).toFixed(0)} · L:{" "}
              {Number(lastOutcome.score_learning).toFixed(0)}
            </p>
            {lastOutcome.feedback_json &&
              typeof lastOutcome.feedback_json === "object" &&
              "round_summary" in (lastOutcome.feedback_json as object) &&
              (lastOutcome.feedback_json as { round_summary?: string })
                .round_summary && (
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {
                    (lastOutcome.feedback_json as { round_summary: string })
                      .round_summary
                  }
                </p>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
