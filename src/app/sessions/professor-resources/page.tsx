import { ResourcesOverview } from "@/components/instructor/ResourcesHub";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function ProfessorResourcesHubPage() {
  const course = await loadActiveCourse();
  return (
    <ResourcesOverview
      rail={courseRail(course)}
      sessionId={course?.sessionId ?? null}
    />
  );
}
