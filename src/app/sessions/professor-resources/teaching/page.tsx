import { ResourceLibrary } from "@/components/instructor/ResourceLibrary";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

export default async function ProfessorTeachingResourcesPage() {
  const course = await loadActiveCourse();
  return (
    <ResourceLibrary
      title="Teaching Resources"
      crumb="Teaching Resources"
      subtitle="Slides, case ideas, discussion prompts, activities, and other materials to support your teaching."
      searchPlaceholder="Search teaching resources..."
      rail={courseRail(course)}
      cards={[
        {
          title: "Professor Guide",
          body: "Step-by-step guides for setting up and running your course.",
          href: "/sessions/professor-resources/guide",
          action: "View Guide",
          countLabel: "Linked pages only",
        },
        {
          title: "Teaching Resources",
          body: "Classroom activities and debrief prompts.",
          href: "/sessions/professor-resources/teaching",
          action: "View Resources",
          countLabel: "Linked pages only",
        },
        {
          title: "Simulation Reference",
          body: "Metrics, scoring, and mechanics.",
          href: "/sessions/professor-resources/reference",
          action: "View Reference",
          countLabel: "Linked pages only",
        },
        {
          title: "Downloads",
          body: "Export live course data from existing tools.",
          href: "/sessions/professor-resources/downloads",
          action: "View Downloads",
          countLabel: "No hosted files",
        },
      ]}
      items={[
        {
          title: "Round Insights prompts",
          body: "Discussion starters after a processed round.",
          href: "/sessions/teaching/round-insights",
          category: "Discussion & Debrief",
        },
        {
          title: "Team Insights coaching",
          body: "Strengths and opportunities from live scores.",
          href: "/sessions/teaching/team-insights",
          category: "Teaching",
        },
        {
          title: "Discussion & Debrief agenda",
          body: "Facilitation outline.",
          href: "/sessions/teaching/debrief",
          category: "Discussion & Debrief",
        },
      ]}
    />
  );
}
