import { IndustryResultsHub } from "@/components/instructor/IndustryResultsHub";
import { DISCRETIONARY_BUDGET } from "@/lib/engine/defaults";
import { loadClassPerformanceBundle } from "@/lib/instructor/load-class-performance";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SessionReportsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const [course, bundle] = await Promise.all([
    loadActiveCourse(sessionId),
    loadClassPerformanceBundle(sessionId),
  ]);

  return (
    <IndustryResultsHub
      sessionId={sessionId}
      rail={courseRail(course)}
      teams={bundle.teams}
      rounds={bundle.rounds}
      scores={bundle.scores}
      spends={bundle.spends}
      completedRounds={course?.roundsCompleted ?? 0}
      practiceRounds={course?.practiceRounds ?? 0}
      competitiveRounds={course?.competitiveRounds ?? 0}
      budgetLabel={formatCurrency(DISCRETIONARY_BUDGET)}
    />
  );
}
