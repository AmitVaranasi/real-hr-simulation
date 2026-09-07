import { HelpCenterHub } from "@/components/instructor/HelpCenterHub";
import { plural } from "@/components/instructor/ProfessorChrome";
import {
  courseRail,
  loadActiveCourse,
  roundLabel,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function ProfessorHelpPage() {
  const course = await loadActiveCourse();
  const title = course
    ? [course.courseCode, course.name].filter(Boolean).join(" ")
    : "—";
  return (
    <HelpCenterHub
      rail={courseRail(course)}
      sessionId={course?.sessionId ?? null}
      courseTitle={course ? `${title}${course.semester ? ` – ${course.semester}` : ""}` : "—"}
      engineStatus="Operational"
      roundStatus={
        course?.openRound
          ? `${roundLabel(course.openRound)} Open`
          : course?.latestClosed
            ? `${roundLabel(course.latestClosed)} Closed`
            : "—"
      }
      teamsLabel={
        course?.teamsCreated ? plural(course.teamsCreated, "team") : "—"
      }
    />
  );
}
