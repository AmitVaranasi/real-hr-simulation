import { LeaderboardRelease } from "@/components/instructor/LeaderboardRelease";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { buildLeaderboard } from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function InstructorLeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ round?: string }>;
}) {
  const { sessionId } = await params;
  const { round: roundId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("sessions")
    .select("*, rounds(*), teams(id, name, industry, strategy)")
    .eq("id", sessionId)
    .eq("instructor_id", user.id)
    .single();

  if (!session) notFound();

  const rounds = (session.rounds ?? []) as Array<{
    id: string;
    round_number: number;
    status: string;
    leaderboard_released: boolean;
  }>;

  const closedRound =
    rounds.find((r) => r.id === roundId && r.status === "closed") ??
    rounds.filter((r) => r.status === "closed").pop();

  let entries: ReturnType<typeof buildLeaderboard> = [];
  if (closedRound) {
    const { data: outcomes } = await supabase
      .from("outcomes")
      .select("team_id, total_score, instructor_override, revenue, stock_price")
      .eq("round_id", closedRound.id);
    entries = buildLeaderboard(session.teams ?? [], outcomes ?? []);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href={`/sessions/${sessionId}`}
        className="text-sm text-[#e67e22] hover:underline"
      >
        ← Session
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Leaderboard control</h1>

      <section className="mt-8">
        <h2 className="font-semibold">Release to students</h2>
        <div className="mt-4">
          <LeaderboardRelease sessionId={sessionId} rounds={rounds} />
        </div>
      </section>

      {closedRound && entries.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-semibold">
            Preview — Round {closedRound.round_number}
          </h2>
          <LeaderboardTable entries={entries} />
        </section>
      )}
    </div>
  );
}
