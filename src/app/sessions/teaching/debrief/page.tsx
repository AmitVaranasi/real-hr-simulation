import { DebriefView } from "@/components/instructor/TeachingHub";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function DebriefPage() {
  const course = await loadActiveCourse();
  return (
    <DebriefView
      rail={courseRail(course)}
      sessionId={course?.sessionId ?? null}
    />
  );
}
