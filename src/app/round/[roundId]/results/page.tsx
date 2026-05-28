import { ResultsView } from "@/components/results/ResultsView";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RoundResultsPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(*, sessions(name))")
    .eq("user_id", user.id)
    .single();

  const team = membership?.teams as unknown as {
    id: string;
    name: string;
    industry: string;
    strategy: string;
    session_id: string;
    sessions: { name: string };
  } | null;

  if (!team) redirect("/dashboard");

  const { data: round } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .single();

  if (round?.status !== "closed") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Results not yet available</h1>
        <p className="mt-2 text-slate-600">
          Results appear after your instructor closes this round.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-indigo-600">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { data: outcome } = await supabase
    .from("outcomes")
    .select("*")
    .eq("team_id", team.id)
    .eq("round_id", roundId)
    .maybeSingle();

  if (!outcome) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Computing results</h1>
        <p className="mt-2 text-slate-600">
          Outcomes are being processed. Check back shortly.
        </p>
      </div>
    );
  }

  const { data: allOutcomes } = await supabase
    .from("outcomes")
    .select("*, rounds(id, round_number)")
    .eq("team_id", team.id)
    .order("computed_at");

  const { data: priorList } = await supabase
    .from("outcomes")
    .select("*")
    .eq("team_id", team.id)
    .neq("round_id", roundId)
    .order("computed_at", { ascending: false })
    .limit(1);

  const { data: reflection } = await supabase
    .from("reflections")
    .select("*")
    .eq("team_id", team.id)
    .eq("round_id", roundId)
    .maybeSingle();

  const trendData = (allOutcomes ?? []).map((o) => {
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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Round {round?.round_number} results
      </h1>
      <div className="mt-8">
        <ResultsView
          teamId={team.id}
          roundId={roundId}
          roundNumber={round?.round_number ?? 0}
          sessionName={team.sessions?.name ?? "Session"}
          team={{
            name: team.name,
            industry: team.industry,
            strategy: team.strategy,
          }}
          outcome={outcome}
          priorOutcome={priorList?.[0] ?? null}
          reflection={reflection}
          trendData={trendData}
        />
      </div>
    </div>
  );
}
