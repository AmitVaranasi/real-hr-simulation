import { ResourceArticle } from "@/components/instructor/ResourcesHub";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function ProfessorGuidePage() {
  const course = await loadActiveCourse();
  return (
    <ResourceArticle
      title="Professor Guide"
      crumb="Professor Guide"
      intro="Course setup, pacing, and facilitation guidance using the live product paths."
      rail={courseRail(course)}
      sections={[
        {
          heading: "Course Setup",
          body: "Create a session, set practice and competitive round counts, then create teams with industry and strategy. Students join with a team code.",
          href: "/sessions/manage",
          link: "Open Course Management",
        },
        {
          heading: "Round Cadence",
          body: "Open one round at a time. Closing a round processes results through the existing engine. Do not create a second scoring path.",
          href: course ? `/sessions/${course.sessionId}/rounds` : "/sessions/manage",
          link: "Open Round Management",
        },
        {
          heading: "Decision Module Notes",
          body: "Students complete the same seven HR modules each open round. Configuration and formulas live in Simulation Lab.",
          href: "/sessions/lab",
          link: "Open Simulation Lab",
        },
        {
          heading: "Debrief Cadence",
          body: "After a processed round, use Class Performance and Teaching & Debrief. Empty fields stay as — until results exist.",
          href: "/sessions/teaching",
          link: "Open Teaching & Debrief",
        },
        {
          heading: "Assessment Guidance",
          body: "Leaderboard release and industry results are the live assessment surfaces. Overrides are recorded on outcomes, not a second gradebook.",
          href: course ? `/sessions/${course.sessionId}/reports` : "/sessions",
          link: "Open Industry Results",
        },
      ]}
    />
  );
}
