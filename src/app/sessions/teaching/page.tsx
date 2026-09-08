import { TeachingOverview } from "@/components/instructor/TeachingHub";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function TeachingHubPage() {
  const course = await loadActiveCourse();
  return (
    <TeachingOverview
      rail={courseRail(course)}
      sessionId={course?.sessionId ?? null}
    />
  );
}
