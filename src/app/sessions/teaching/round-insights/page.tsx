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
  // Iteration 5: Top Performing Area and Area to Watch are the highest and
  // lowest class-average perspective, generated from simulation results.
  let topArea: string | null = null;
  let watchArea: string | null = null;
  let excelling: number | null = null;
  let behind: number | null = null;

  if (course?.latestClosed) {
    const { data: outcomes } = await supabase
      .from("outcomes")
      .select(
        "total_score, score_financial, score_employee, score_process, score_learning"
      )
      .eq("round_id", course.latestClosed.id);
    const rows = outcomes ?? [];
    const scores = rows
      .map((o) => (o.total_score != null ? Number(o.total_score) : null))
      .filter((v): v is number => v != null);
    if (scores.length) {
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      classAvg = mean.toFixed(1);
      // "Excelling" and "behind" are relative to the class average.
      excelling = scores.filter((s) => s > mean).length;
      behind = scores.filter((s) => s < mean).length;
    }

    const mean = (key: string) => {
      const vals = rows
        .map((o) => {
          const v = (o as Record<string, unknown>)[key];
          return v != null ? Number(v) : null;
        })
        .filter((v): v is number => v != null);
      return vals.length
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : null;
    };
    const perspectives = [
      { label: "Financial", value: mean("score_financial") },
      { label: "Employee", value: mean("score_employee") },
      { label: "Internal Process", value: mean("score_process") },
      { label: "Learning & Growth", value: mean("score_learning") },
    ].filter((p) => p.value != null) as Array<{ label: string; value: number }>;
    if (perspectives.length) {
      topArea = [...perspectives].sort((a, b) => b.value - a.value)[0].label;
      watchArea = [...perspectives].sort((a, b) => a.value - b.value)[0].label;
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
      topArea={topArea}
      watchArea={watchArea}
      deadline={focus?.decision_deadline ?? null}
      excelling={excelling}
      behind={behind}
    />
  );
}
