import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  LineChart,
  Users,
} from "lucide-react";
import {
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  dash,
  type CourseRailState,
  plural,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";

export function ClassPerformanceOverview({
  sessionId,
  rail,
  currentRoundLabel,
  teamCount,
  completedRounds,
  totalRounds,
  resultsAvailable,
}: {
  sessionId: string | null;
  rail: CourseRailState;
  currentRoundLabel: string | null;
  teamCount: number;
  completedRounds: number;
  totalRounds: number;
  resultsAvailable: boolean;
}) {
  const reportsHref = sessionId ? `/sessions/${sessionId}/reports` : "/sessions";
  const inspectHref = sessionId ? `/sessions/${sessionId}/inspect` : "/sessions/config";
  const cards = [
    {
      title: "Industry Results",
      body: "Understand overall class and workforce performance for a selected simulation round.",
      detail: "Review class-level results, Balanced Scorecard outcomes, and overall team performance.",
      action: "View Industry Results",
      href: reportsHref,
      color: "text-emerald-700 border-emerald-400",
      iconWrap: "bg-emerald-50 text-emerald-700",
      icon: BarChart3,
    },
    {
      title: "Team Comparison",
      body: "Compare how teams performed across the major Balanced Scorecard perspectives.",
      detail: "Identify performance differences, relative strengths, and areas where teams diverged.",
      action: "Compare Teams",
      href: "/sessions/class-performance/team-comparison",
      color: "text-[var(--portal-accent-blue)] border-[var(--portal-accent-blue)]",
      iconWrap:
        "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
      icon: Users,
    },
    {
      title: "Decision Analysis",
      body: "Investigate what teams decided and how their resource allocations differed.",
      detail: "Examine HR spending, decision patterns, and relationships between decisions and outcomes.",
      action: "Analyze Decisions",
      href: "/sessions/class-performance/decision-analysis",
      color: "text-violet-700 border-violet-400",
      iconWrap: "bg-violet-50 text-violet-700",
      icon: ClipboardList,
    },
    {
      title: "Performance Trends",
      body: "Examine how class and team performance develops across simulation rounds.",
      detail: "Identify improvement, consistency, emerging patterns, and areas requiring instructional attention.",
      action: "View Performance Trends",
      href: "/sessions/class-performance/analytics",
      color: "text-[var(--portal-brand)] border-orange-400",
      iconWrap: "bg-orange-50 text-[var(--portal-brand)]",
      icon: LineChart,
    },
  ];

  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Performance Tools"
          course={rail}
          tools={[
            {
              title: "Team Reports",
              icon: <Users className="h-4 w-4" strokeWidth={1.75} />,
              body: "View detailed reports for individual teams.",
              action: "View Reports",
              href: reportsHref,
            },
            {
              title: "Download Data",
              icon: <Download className="h-4 w-4" strokeWidth={1.75} />,
              body: "Export performance data for analysis.",
              action: "Export Data",
              href: reportsHref,
            },
            {
              title: "Rubric & Scoring",
              icon: <FileText className="h-4 w-4" strokeWidth={1.75} />,
              body: "Review scoring models and evaluation rubrics.",
              action: "View Rubrics",
              href: inspectHref,
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title="Class Performance"
        subtitle="Understand class performance, compare teams, examine decision patterns, and identify performance trends across the simulation."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Class Performance" },
          { label: "Overview" },
        ]}
      />

      <section className="rounded-xl border border-[#d7e4ff] bg-[#eef4ff] px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--portal-accent-blue)] text-[0.6875rem] font-bold text-white">
            i
          </span>
          <h2 className="text-sm font-bold text-[var(--portal-title)]">
            Current Analysis Context
          </h2>
        </div>
        <div className="grid grid-cols-2 divide-x-0 gap-4 lg:grid-cols-4 lg:divide-x lg:divide-[var(--portal-sidebar-border)]">
          {[
            {
              label: "Current Round",
              value: dash(currentRoundLabel),
              icon: CalendarDays,
            },
            {
              label: "Teams",
              value: teamCount ? plural(teamCount, "Team") : "—",
              icon: Users,
            },
            {
              label: "Completed Rounds",
              value:
                totalRounds > 0
                  ? `${completedRounds} of ${totalRounds}`
                  : "—",
              icon: CheckCircle2,
            },
            {
              label: "Results Status",
              value: resultsAvailable ? "Available" : "—",
              icon: FileText,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-2 lg:px-3 first:lg:pl-0">
                <Icon className="mt-0.5 h-4 w-4 text-[var(--portal-title)]" />
                <div>
                  <p className="text-[0.625rem] text-[var(--portal-muted)]">
                    {item.label}
                  </p>
                  <p className="text-sm font-bold text-[var(--portal-title)]">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span
                  className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${card.iconWrap}`}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[var(--portal-title)]">
                    {card.title}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--portal-muted)]">
                    {card.body}
                  </p>
                  <p className="mt-3 text-sm text-[var(--portal-muted)]">
                    {card.detail}
                  </p>
                </div>
              </div>
              <Link
                href={card.href}
                className={`mt-5 inline-flex w-full items-center justify-center gap-1 rounded-md border bg-white px-3 py-2 text-sm font-semibold ${card.color}`}
              >
                {card.action} →
              </Link>
            </article>
          );
        })}
      </div>

      <ProfessorHelpBanner
        title="Using Performance Data for Teaching"
        body="Class Performance provides multiple analytical lenses. Begin with Industry Results for the overall picture, compare teams when performance differences require investigation, examine decisions to understand possible causes, and use trends to determine whether patterns persist across rounds."
        href="/sessions/teaching"
        action="Go to Teaching & Debrief"
      />
    </ProfessorPageGrid>
  );
}
