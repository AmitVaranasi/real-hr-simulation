import { RoundInsightsView } from "@/components/instructor/TeachingHub";
import {
  courseRail,
  loadActiveCourse,
  requireInstructor,
  roundLabel,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function RoundInsightsPage() {
  const course = await loadActiveCourse();
  const { supabase } = await requireInstructor();
  const focus = course?.openRound ?? course?.latestClosed ?? null;
  let submitted = "—";
  let classAvg = "—";

  if (course && focus) {
    const { data: decisions } = await supabase
      .from("decisions")
      .select("team_id, is_submitted")
      .eq("round_id", focus.id)
      .eq("is_submitted", true);
    const count = new Set(
      (decisions ?? []).map((d) => d.team_id).filter(Boolean)
    ).size;
    submitted = `${count} / ${course.teamsCreated}`;
  }
  if (course?.latestClosed) {
    const { data: outcomes } = await supabase
      .from("outcomes")
      .select("total_score")
      .eq("round_id", course.latestClosed.id);
    const scores = (outcomes ?? [])
      .map((o) => (o.total_score != null ? Number(o.total_score) : null))
      .filter((v): v is number => v != null);
    if (scores.length) {
      classAvg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    }
  }

  return (
    <RoundInsightsView
      rail={courseRail(course)}
      sessionId={course?.sessionId ?? null}
      roundLabel={roundLabel(focus)}
      teams={course?.teamsCreated ?? 0}
      submitted={submitted}
      classAvg={classAvg}
      open={Boolean(course?.openRound)}
    />
  );
}
