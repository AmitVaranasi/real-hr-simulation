import { LearningAnalyticsView } from "@/components/instructor/TeachingHub";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function LearningAnalyticsPage() {
  const course = await loadActiveCourse();
  return (
    <LearningAnalyticsView
      rail={courseRail(course)}
      sessionId={course?.sessionId ?? null}
    />
  );
}
