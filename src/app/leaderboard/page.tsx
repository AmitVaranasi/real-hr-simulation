import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { buildLeaderboard } from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const { round: roundIdParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(session_id)")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/dashboard");

  const sessionId = (membership.teams as unknown as { session_id: string })
    .session_id;

  const { data: releasedRounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("session_id", sessionId)
    .eq("leaderboard_released", true)
    .order("round_number", { ascending: false });

  if (!releasedRounds?.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-[var(--portal-muted)]">
          Your instructor has not released a leaderboard yet.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-[var(--portal-primary)]">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const round =
    releasedRounds.find((r) => r.id === roundIdParam) ?? releasedRounds[0];

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, industry, strategy")
    .eq("session_id", sessionId);

  const { data: outcomes } = await supabase
    .from("outcomes")
    .select("team_id, total_score, instructor_override, revenue, stock_price")
    .eq("round_id", round.id);

  const entries = buildLeaderboard(teams ?? [], outcomes ?? []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-[var(--portal-primary)] hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[var(--portal-title)]">Leaderboard</h1>
      <p className="text-[var(--portal-muted)]">Round {round.round_number}</p>

      {releasedRounds.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {releasedRounds.map((r) => (
            <Link
              key={r.id}
              href={`/leaderboard?round=${r.id}`}
              className={`rounded-lg px-3 py-1 text-sm ${
                r.id === round.id
                  ? "bg-[var(--portal-primary)] text-white"
                  : "bg-[#f1f3f5] text-[var(--portal-ink)]"
              }`}
            >
              Round {r.round_number}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <LeaderboardTable
          entries={entries}
          highlightTeamId={membership.team_id}
        />
      </div>
    </div>
  );
}
