import { SimulationLabHub } from "@/components/instructor/SimulationLabHub";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function SimulationLabPage() {
  const course = await loadActiveCourse();
  const title = course
    ? [course.courseCode, course.name, course.semester]
        .filter(Boolean)
        .join(" – ")
    : "No course yet";
  return (
    <SimulationLabHub
      rail={courseRail(course)}
      sessionId={course?.sessionId ?? null}
      courseTitle={title}
      status={course?.status ?? "—"}
    />
  );
}
