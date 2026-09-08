import { ResourceLibrary } from "@/components/instructor/ResourceLibrary";
import {
  courseRail,
  loadActiveCourse,
} from "@/lib/instructor/load-course-context";

export const dynamic = "force-dynamic";

const REF_CARDS = [
  {
    title: "Metrics Reference",
    body: "How metrics are defined and used.",
    href: "/sessions/professor-resources/reference/metrics",
    action: "View Metrics",
    countLabel: "Engine fields",
  },
  {
    title: "Scoring & Formulas",
    body: "Where professor trust is built.",
    href: "/sessions/professor-resources/reference/formulas",
    action: "View Formulas",
    countLabel: "Formula Inspect",
  },
  {
    title: "Simulation Mechanics",
    body: "Set up → decisions → process → results.",
    href: "/sessions/professor-resources/reference/mechanics",
    action: "View Mechanics",
    countLabel: "8 topics",
  },
  {
    title: "Industry & Strategy",
    body: "Industry profiles and strategy alignment.",
    href: "/sessions/professor-resources/reference/industry",
    action: "View Reference",
    countLabel: "5 industries",
  },
];

export default async function ProfessorReferencePage() {
  const course = await loadActiveCourse();
  return (
    <ResourceLibrary
      title="Simulation Reference"
      crumb="Simulation Reference"
      subtitle="Detailed references for metrics, scoring, formulas, and simulation mechanics."
      searchPlaceholder="Search simulation reference..."
      rail={courseRail(course)}
      cards={REF_CARDS}
      items={[
        {
          title: "Simulation Mechanics",
          body: "How a round moves from setup to results.",
          href: "/sessions/professor-resources/reference/mechanics",
          category: "Mechanics",
        },
        {
          title: "Scoring & Formulas",
          body: "Trace calculations in Formula Inspect.",
          href: "/sessions/professor-resources/reference/formulas",
          category: "Scoring",
        },
        {
          title: "Metrics Reference",
          body: "Outcome fields produced by the engine.",
          href: "/sessions/professor-resources/reference/metrics",
          category: "Metrics",
        },
        {
          title: "Industry & Strategy",
          body: "The five industries and five strategies in the engine.",
          href: "/sessions/professor-resources/reference/industry",
          category: "Industry",
        },
      ]}
    />
  );
}
