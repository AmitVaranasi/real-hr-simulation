import {
  ProfessorCardGrid,
  ProfessorPageHeader,
} from "@/components/instructor/ProfessorShell";

export default function TeachingHubPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ProfessorPageHeader
        title="Teaching & Debrief"
        subtitle="Instructional shells for round insights, team coaching, and classroom debrief."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Teaching & Debrief" },
        ]}
      />
      <ProfessorCardGrid
        items={[
          {
            title: "Round Insights",
            body: "Highlight patterns after each processed round.",
            href: "/sessions/teaching/round-insights",
          },
          {
            title: "Team Insights",
            body: "Coach individual company teams with structured prompts.",
            href: "/sessions/teaching/team-insights",
          },
          {
            title: "Discussion & Debrief",
            body: "Facilitation outline for in-class debrief sessions.",
            href: "/sessions/teaching/debrief",
          },
          {
            title: "Learning Analytics",
            body: "Engagement and learning signal shells.",
            href: "/sessions/teaching/learning-analytics",
          },
        ]}
      />
    </div>
  );
}
