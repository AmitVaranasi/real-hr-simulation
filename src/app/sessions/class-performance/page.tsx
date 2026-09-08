import { ClassPerformanceOverview } from "@/components/instructor/ClassPerformanceHub";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function ClassPerformancePage() {
  const course = await loadActiveCourse();
  return (
    <ClassPerformanceOverview
      sessionId={course?.sessionId ?? null}
      rail={courseRail(course)}
      currentRoundLabel={course?.currentRoundLabel ?? null}
      teamCount={course?.teamsCreated ?? 0}
      completedRounds={course?.roundsCompleted ?? 0}
      totalRounds={
        course ? course.practiceRounds + course.competitiveRounds : 0
      }
      resultsAvailable={course?.resultsAvailable ?? false}
    />
  );
}
