import { ResultsView } from "@/components/results/ResultsView";
import type { RoundListItem } from "@/components/results/WorkforceBriefView";
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
        <p className="mt-2 text-[var(--portal-muted)]">
          Results appear after your instructor closes this round.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-[var(--portal-primary)]">
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
        <p className="mt-2 text-[var(--portal-muted)]">
          Outcomes are being processed. Check back shortly.
        </p>
      </div>
    );
  }

  const { data: allOutcomes } = await supabase
    .from("outcomes")
    .select("*, rounds(id, round_number, closed_at)")
    .eq("team_id", team.id)
    .order("computed_at", { ascending: false });

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

  const rounds: RoundListItem[] = (allOutcomes ?? []).map((o) => {
    const r = o.rounds as unknown as {
      id: string;
      round_number: number;
      closed_at: string | null;
    } | null;
    const dateSource = r?.closed_at ?? (o.computed_at as string | undefined);
    let dateLabel = "—";
    if (dateSource) {
      try {
        dateLabel = new Date(dateSource).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        dateLabel = "—";
      }
    }
    return {
      id: o.id as string,
      roundId: (o.round_id as string) ?? r?.id ?? "",
      roundNumber: r?.round_number ?? 0,
      dateLabel,
      href: `/round/${o.round_id}/results`,
    };
  });

  return (
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
        rounds={rounds}
      />
  );
}
