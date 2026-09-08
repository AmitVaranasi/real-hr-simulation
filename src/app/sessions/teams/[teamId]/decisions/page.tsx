import { notFound } from "next/navigation";
import { InstructionalExploration } from "@/components/instructor/InstructionalExploration";
import {
  courseRail,
  loadActiveCourse,
  requireInstructor,
  roundLabel,
} from "@/lib/instructor/load-course-context";
import { rowToDecision } from "@/lib/db/decisions";

export const dynamic = "force-dynamic";

export default async function ProfessorTeamDecisionsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const course = await loadActiveCourse();
  if (!course || !course.teamIds.includes(teamId)) notFound();

  const { supabase } = await requireInstructor();
  const { data: team } = await supabase
    .from("teams")
    .select("id, name, industry, strategy")
    .eq("id", teamId)
    .single();
  if (!team) notFound();

  // Explore against the round the class is actually working in.
  const focus = course.openRound ?? course.latestClosed;
  const { data: decisionRow } = focus
    ? await supabase
        .from("decisions")
        .select("*")
        .eq("team_id", teamId)
        .eq("round_id", focus.id)
        .maybeSingle()
    : { data: null };

  return (
    <InstructionalExploration
      rail={courseRail(course)}
      sessionId={course.sessionId}
      team={{
        id: team.id as string,
        name: team.name as string,
        industry: (team.industry as string) ?? "—",
        strategy: (team.strategy as string) ?? "—",
      }}
      roundId={focus?.id ?? null}
      roundLabel={roundLabel(focus)}
      submitted={Boolean(decisionRow?.is_submitted)}
      decision={decisionRow ? rowToDecision(decisionRow) : null}
      teams={[]}
    />
  );
}
