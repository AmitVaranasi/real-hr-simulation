import { TeamInsightsView } from "@/components/instructor/TeachingHub";
import {
  courseRail,
  loadActiveCourse,
  requireInstructor,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

const LABELS = {
  financial: "Financial",
  employee: "Employee",
  process: "Internal Process",
  learning: "Learning & Growth",
} as const;

export default async function TeamInsightsPage() {
  const course = await loadActiveCourse();
  const { supabase } = await requireInstructor();
  const rows: Array<{
    name: string;
    score: string;
    strength: string;
    opportunity: string;
    dims: Record<keyof typeof LABELS, number | null>;
  }> = [];
  let classAvg = "—";
  let topPerformer = "—";
  // Each BSC perspective is capped at its weight (25 by default), so a
  // perspective percentage is score / 25 — this is what the Figma donuts show.
  const perspectiveTotals: Record<keyof typeof LABELS, number[]> = {
    financial: [],
    employee: [],
    process: [],
    learning: [],
  };

  if (course?.latestClosed && course.teamIds.length > 0) {
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", course.teamIds);
    const { data: outcomes } = await supabase
      .from("outcomes")
      .select(
        "team_id, total_score, score_financial, score_employee, score_process, score_learning"
      )
      .eq("round_id", course.latestClosed.id);
    const names = new Map(
      (teams ?? []).map((t) => [t.id as string, t.name as string])
    );
    const scores: number[] = [];
    for (const o of outcomes ?? []) {
      const dims = {
        financial: o.score_financial != null ? Number(o.score_financial) : null,
        employee: o.score_employee != null ? Number(o.score_employee) : null,
        process: o.score_process != null ? Number(o.score_process) : null,
        learning: o.score_learning != null ? Number(o.score_learning) : null,
      };
      const present = (Object.entries(dims) as Array<
        [keyof typeof LABELS, number | null]
      >).filter((entry): entry is [keyof typeof LABELS, number] => entry[1] != null);
      const strength = present.length
        ? LABELS[[...present].sort((a, b) => b[1] - a[1])[0][0]]
        : "—";
      const opportunity = present.length
        ? LABELS[[...present].sort((a, b) => a[1] - b[1])[0][0]]
        : "—";
      const total = o.total_score != null ? Number(o.total_score) : null;
      if (total != null) scores.push(total);
      for (const [key, value] of present) perspectiveTotals[key].push(value);
      rows.push({
        name: names.get(o.team_id as string) ?? "Team",
        score: total == null ? "—" : total.toFixed(1),
        strength,
        opportunity,
        dims,
      });
    }
    rows.sort((a, b) => {
      const av = a.score === "—" ? -1 : Number(a.score);
      const bv = b.score === "—" ? -1 : Number(b.score);
      return bv - av;
    });
    if (scores.length) {
      classAvg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      topPerformer = rows[0]?.name ?? "—";
    }
  }

  const perspectives = (
    Object.keys(LABELS) as Array<keyof typeof LABELS>
  ).map((key) => {
    const values = perspectiveTotals[key];
    return {
      key,
      label: LABELS[key],
      pct: values.length
        ? Math.round(
            (values.reduce((a, b) => a + b, 0) / values.length / 25) * 100
          )
        : null,
    };
  });

  return (
    <TeamInsightsView
      rail={courseRail(course)}
      sessionId={course?.sessionId ?? null}
      teams={rows.length}
      classAvg={classAvg}
      topPerformer={topPerformer}
      rows={rows}
      perspectives={perspectives}
    />
  );
}
