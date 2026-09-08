import { DownloadsView } from "@/components/instructor/ResourcesHub";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function ProfessorDownloadsPage() {
  const course = await loadActiveCourse();
  return (
    <DownloadsView
      rail={courseRail(course)}
      exports={[
        {
          name: "Team roster export",
          body: "Export the current team list and join codes from Teams & Enrollment.",
          category: "Templates",
          type: "CSV",
          href: course
            ? `/sessions/${course.sessionId}/teams`
            : "/sessions/manage",
        },
        {
          name: "Performance export",
          body: "Industry Results remains the live export path for processed outcomes.",
          category: "Reference",
          type: "CSV",
          href: course ? `/sessions/${course.sessionId}/reports` : "/sessions",
        },
        {
          name: "Configuration export",
          body: "Simulation Lab exports configuration and scenario files without creating a second engine.",
          category: "Guides",
          type: "JSON",
          href: "/sessions/config/export",
        },
      ]}
    />
  );
}
