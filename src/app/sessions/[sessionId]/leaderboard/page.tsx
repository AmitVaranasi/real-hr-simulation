import { IndustryScoringHub } from "@/components/instructor/IndustryScoringHub";
import { LeaderboardRelease } from "@/components/instructor/LeaderboardRelease";
import { loadClassPerformanceBundle } from "@/lib/instructor/load-class-performance";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InstructorLeaderboardPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("sessions")
    .select("id, instructor_id, rounds(id, round_number, status, leaderboard_released)")
    .eq("id", sessionId)
    .eq("instructor_id", user.id)
    .single();
  if (!session) notFound();

  const [course, bundle] = await Promise.all([
    loadActiveCourse(sessionId),
    loadClassPerformanceBundle(sessionId),
  ]);

  const rounds = (session.rounds ?? []) as Array<{
    id: string;
    round_number: number;
    status: string;
    leaderboard_released: boolean;
  }>;

  return (
    <IndustryScoringHub
      sessionId={sessionId}
      rail={courseRail(course)}
      teams={bundle.teams}
      rounds={bundle.rounds}
      scores={bundle.scores}
    >
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-[var(--portal-title)]">
          Release to students
        </h2>
        <p className="mt-1 text-sm text-[var(--portal-muted)]">
          Student leaderboard visibility is separate from this scoring view.
        </p>
        <div className="mt-3">
          <LeaderboardRelease sessionId={sessionId} rounds={rounds} />
        </div>
      </section>
    </IndustryScoringHub>
  );
}
