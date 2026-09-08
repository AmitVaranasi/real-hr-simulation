import { ReportsAnalyticsHub } from "@/components/instructor/ReportsAnalyticsHub";
import { loadClassPerformanceBundle } from "@/lib/instructor/load-class-performance";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function ClassAnalyticsPage() {
  const course = await loadActiveCourse();
  const bundle = course
    ? await loadClassPerformanceBundle(course.sessionId)
    : { teams: [], rounds: [], scores: [], spends: [] };

  return (
    <ReportsAnalyticsHub
      sessionId={course?.sessionId ?? ""}
      rail={courseRail(course)}
      teams={bundle.teams}
      rounds={bundle.rounds}
      scores={bundle.scores}
    />
  );
}
