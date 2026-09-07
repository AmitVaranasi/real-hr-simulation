import { TeamComparisonHub } from "@/components/instructor/TeamComparisonHub";
import {
  courseRail,
  loadActiveCourse,
  requireInstructor,
  roundLabel,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function ClassPerformanceTeamComparisonPage() {
  const course = await loadActiveCourse();
  const { supabase } = await requireInstructor();

  let rows: Array<{
    teamId: string;
    name: string;
    overall: number | null;
    financial: number | null;
    employee: number | null;
    process: number | null;
    learning: number | null;
  }> = [];

  if (course && course.teamIds.length > 0) {
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", course.teamIds);
    const byId = new Map(
      (teams ?? []).map((t) => [t.id as string, t.name as string])
    );
    rows = course.teamIds.map((id) => ({
      teamId: id,
      name: byId.get(id) ?? "Team",
      overall: null,
      financial: null,
      employee: null,
      process: null,
      learning: null,
    }));

    if (course.latestClosed) {
      const { data: outcomes } = await supabase
        .from("outcomes")
        .select(
          "team_id, total_score, score_financial, score_employee, score_process, score_learning"
        )
        .eq("round_id", course.latestClosed.id);
      const scores = new Map(
        (outcomes ?? []).map((o) => [o.team_id as string, o])
      );
      rows = rows.map((row) => {
        const o = scores.get(row.teamId);
        return {
          ...row,
          overall: o?.total_score != null ? Number(o.total_score) : null,
          financial: o?.score_financial != null ? Number(o.score_financial) : null,
          employee: o?.score_employee != null ? Number(o.score_employee) : null,
          process: o?.score_process != null ? Number(o.score_process) : null,
          learning: o?.score_learning != null ? Number(o.score_learning) : null,
        };
      });
    }
  }

  return (
    <TeamComparisonHub
      sessionId={course?.sessionId ?? null}
      roundLabel={roundLabel(course?.latestClosed ?? course?.openRound)}
      rows={rows}
      rail={courseRail(course)}
    />
  );
}
