import { DecisionAnalysisHub } from "@/components/instructor/DecisionAnalysisHub";
import { loadClassPerformanceBundle } from "@/lib/instructor/load-class-performance";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function DecisionAnalysisPage() {
  const course = await loadActiveCourse();
  const bundle = course
    ? await loadClassPerformanceBundle(course.sessionId)
    : { teams: [], rounds: [], scores: [], spends: [] };

  return (
    <DecisionAnalysisHub
      sessionId={course?.sessionId ?? ""}
      rail={courseRail(course)}
      teams={bundle.teams}
      rounds={bundle.rounds}
      scores={bundle.scores}
      spends={bundle.spends}
    />
  );
}
