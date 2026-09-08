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
  // Iteration 5: "Most Improved requires prior-round data. During the first
  // round, this card should indicate Baseline - Available After Next Round
  // rather than inventing improvement data."
  let mostImproved = "Baseline – Available After Next Round";
  let needingSupport = "—";
  let participation: string | null = null;
  let onTime: string | null = null;
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
      // Teams Needing Support: below half of the 100-point scorecard.
      needingSupport = String(
        scores.filter((v) => v < 50).length
      );
    }

    const closedRounds = course.rounds
      .filter((r) => r.status === "closed")
      .sort((a, b) => a.round_number - b.round_number);
    const priorRound =
      closedRounds.length > 1 ? closedRounds[closedRounds.length - 2] : null;
    if (priorRound) {
      const { data: priorOutcomes } = await supabase
        .from("outcomes")
        .select("team_id, total_score")
        .eq("round_id", priorRound.id);
      const prior = new Map(
        (priorOutcomes ?? []).map((o) => [o.team_id as string, o.total_score])
      );
      let best: { name: string; delta: number } | null = null;
      for (const o of outcomes ?? []) {
        const before = prior.get(o.team_id as string);
        if (before == null || o.total_score == null) continue;
        const delta = Number(o.total_score) - Number(before);
        if (!best || delta > best.delta) {
          best = { name: names.get(o.team_id as string) ?? "Team", delta };
        }
      }
      mostImproved = best
        ? `${best.name} (${best.delta > 0 ? "+" : ""}${best.delta.toFixed(1)})`
        : "—";
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

  // Engagement: submission behaviour is the one participation signal the
  // system actually records (Iteration 5 warns against inventing the others).
  const engagementRound = course?.openRound ?? course?.latestClosed ?? null;
  if (engagementRound && course && course.teamIds.length > 0) {
    const { data: decisions } = await supabase
      .from("decisions")
      .select("team_id, is_submitted, submitted_at")
      .eq("round_id", engagementRound.id)
      .in("team_id", course.teamIds);
    const submitted = (decisions ?? []).filter((d) => d.is_submitted);
    participation = `${Math.round(
      (submitted.length / course.teamIds.length) * 100
    )}%`;
    const deadline = engagementRound.decision_deadline;
    if (deadline && submitted.length > 0) {
      const cutoff = new Date(deadline).getTime();
      const punctual = submitted.filter(
        (d) => d.submitted_at && new Date(d.submitted_at).getTime() <= cutoff
      ).length;
      onTime = `${Math.round((punctual / submitted.length) * 100)}%`;
    }
  }

  return (
    <TeamInsightsView
      rail={courseRail(course)}
      sessionId={course?.sessionId ?? null}
      teams={rows.length}
      classAvg={classAvg}
      topPerformer={topPerformer}
      rows={rows}
      perspectives={perspectives}
      mostImproved={mostImproved}
      needingSupport={needingSupport}
      participation={participation}
      onTime={onTime}
    />
  );
}
