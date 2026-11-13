import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkforceBriefClient } from "@/components/results/WorkforceBriefClient";
import {
  outcomeToBriefData,
  outcomesToRoundList,
} from "@/lib/results/workforce-brief-data";

export const dynamic = "force-dynamic";

export default async function WorkforceBriefIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/reports/workforce-brief");
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select(
      "team_id, teams(id, name, industry, strategy, headcount, session_id, sessions(name, rounds_total, practice_rounds))"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const team = membership?.teams as unknown as {
    id: string;
    name: string;
    industry: string;
    strategy: string;
    headcount: number;
    session_id: string;
    sessions: {
      name: string;
      rounds_total: number | null;
      practice_rounds: number | null;
    } | null;
  } | null;

  if (!team) redirect("/dashboard");

  const { data: fetched } = await supabase
    .from("outcomes")
    .select("*, rounds(id, round_number, status, closed_at)")
    .eq("team_id", team.id);

  // Latest by round, not by computed_at: re-processing an earlier round must
  // not make it the "latest" brief.
  const roundNumberOf = (o: Record<string, unknown>) =>
    Number((o.rounds as { round_number?: number } | null)?.round_number ?? 0);
  const outcomes = [...(fetched ?? [])].sort(
    (a, b) => roundNumberOf(b) - roundNumberOf(a)
  );

  const latest = outcomes[0] ?? null;

  // Without a scored round there is nothing to report.
  if (!latest) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">No results yet</h1>
        <p className="mt-2 text-[var(--portal-muted)]">
          Your Workforce Brief appears after your instructor closes a round in
          which your team submitted decisions.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-[var(--portal-primary)]">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { data: reflection } = await supabase
    .from("reflections")
    .select("content")
    .eq("team_id", team.id)
    .eq("round_id", latest.round_id)
    .maybeSingle();

  const teamInfo = {
    name: team.name,
    industry: team.industry,
    strategy: team.strategy,
  };

  return (
    <WorkforceBriefClient
      data={{
        ...outcomeToBriefData(teamInfo, latest, roundNumberOf(latest)),
        rounds: outcomesToRoundList(
          outcomes,
          (roundId) => `/round/${roundId}/results`
        ),
        // rounds_total counts competitive rounds only.
        roundsTotal:
          (team.sessions?.rounds_total ?? 0) +
            (team.sessions?.practice_rounds ?? 0) || undefined,
        selectedRoundId: latest.round_id as string,
        reflectionContent: reflection?.content ?? null,
      }}
      teamId={team.id}
      roundId={latest.round_id as string}
      sessionName={team.sessions?.name ?? "Session"}
      team={teamInfo}
      outcome={latest}
    />
  );
}
