import { DebriefView } from "@/components/instructor/TeachingHub";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DebriefPage() {
  const course = await loadActiveCourse();

  // Iteration 5: the debrief-readiness tiles answer "am I ready to conduct the
  // debrief?", so every one of them comes from real course records.
  let reflections: Array<{
    teamName: string;
    content: string;
    submittedAt: string | null;
  }> = [];
  let reflectionCount: number | null = null;
  let teamCount: number | null = null;
  let participation: string | null = null;

  if (course) {
    const supabase = await createClient();
    const focus = course.openRound ?? course.latestClosed;
    teamCount = course.teamIds.length || null;

    if (focus && course.teamIds.length > 0) {
      const { data: rows } = await supabase
        .from("reflections")
        .select("team_id, content, submitted_at, teams(name)")
        .eq("round_id", focus.id)
        .in("team_id", course.teamIds)
        .order("submitted_at", { ascending: false });
      const list = (rows ?? []) as Array<{
        team_id: string;
        content: string;
        submitted_at: string | null;
        teams?: { name?: string } | { name?: string }[] | null;
      }>;
      reflectionCount = list.length;
      reflections = list.slice(0, 3).map((r) => {
        const team = Array.isArray(r.teams) ? r.teams[0] : r.teams;
        return {
          teamName: team?.name ?? "Team",
          content: r.content,
          submittedAt: r.submitted_at,
        };
      });

      // Participation = share of teams that submitted decisions this round.
      const { data: decisions } = await supabase
        .from("decisions")
        .select("team_id, is_submitted")
        .eq("round_id", focus.id)
        .in("team_id", course.teamIds);
      const submitted = (decisions ?? []).filter((d) => d.is_submitted).length;
      participation = course.teamIds.length
        ? `${Math.round((submitted / course.teamIds.length) * 100)}%`
        : null;
    }
  }

  return (
    <DebriefView
      rail={courseRail(course)}
      sessionId={course?.sessionId ?? null}
      deadline={(course?.openRound ?? course?.latestClosed)?.decision_deadline ?? null}
      reflections={reflections}
      reflectionCount={reflectionCount}
      teamCount={teamCount}
      participation={participation}
    />
  );
}
