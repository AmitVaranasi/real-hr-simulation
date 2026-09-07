import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock,
  LineChart,
  MessageSquare,
  MoreVertical,
  Pencil,
  Scale,
  Sun,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  ProfessorStatRow,
  ProfessorTabBar,
  dash,
  type CourseRailState,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";

const TEACHING_TABS = [
  { id: "hub", label: "Overview", href: "/sessions/teaching" },
  {
    id: "round",
    label: "Round Insights",
    href: "/sessions/teaching/round-insights",
  },
  {
    id: "team",
    label: "Team Insights",
    href: "/sessions/teaching/team-insights",
  },
  {
    id: "debrief",
    label: "Discussion & Debrief",
    href: "/sessions/teaching/debrief",
  },
  {
    id: "learning",
    label: "Learning Analytics",
    href: "/sessions/teaching/learning-analytics",
  },
];

/* Prompts, starters and panel copy transcribed from
   professor_teaching_debrief_round_insights_editable. */
const STARTERS = [
  "What decisions were you most confident in this round? Why?",
  "Where did you make the biggest trade-off? What would you do differently?",
  "How did your strategy influence your HR investments?",
  "What surprised you most about the results so far?",
  "What questions do you have about your results?",
];

const INSIGHT_CARDS = [
  {
    label: "Top Performing Area",
    value: "—",
    body: "Strong performance in operations and efficiency.",
    icon: TrendingUp,
    tone: "text-emerald-600",
  },
  {
    label: "Area to Watch",
    value: "—",
    body: "Investment may be too low in training and development.",
    icon: AlertTriangle,
    tone: "text-amber-500",
  },
  {
    label: "Key Trade-off",
    value: "Cost vs. Capability",
    body: "Teams are balancing cost control with capability building.",
    icon: Scale,
    tone: "text-violet-600",
  },
  {
    label: "Teaching Opportunity",
    value: "Employee Engagement",
    body: "Great opportunity to discuss engagement strategies and their impact.",
    icon: MessageSquare,
    tone: "text-[var(--portal-accent-blue)]",
  },
];

const TEAM_PATTERNS = [
  {
    headline: "teams are excelling",
    body: "High performance across multiple perspectives.",
    icon: ArrowUp,
    wrap: "bg-emerald-50 text-emerald-600",
    href: "/sessions/class-performance/team-comparison",
  },
  {
    headline: "teams are behind",
    body: "Low scores in Learning & Growth.",
    icon: ArrowDown,
    wrap: "bg-amber-50 text-amber-600",
    href: "/sessions/class-performance/team-comparison",
  },
  {
    headline: "Budget variance",
    body: "Teams underspending or overspending.",
    icon: CircleDollarSign,
    wrap: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
    href: "/sessions/class-performance/decision-analysis",
    noCount: true,
  },
];

const TEACHING_PROMPTS = [
  {
    title: "Engagement vs. Efficiency",
    body: "How might your engagement initiatives impact productivity and long-term performance?",
    pill: "Employee Perspective",
    pillClass: "bg-emerald-50 text-emerald-700",
    icon: Users,
    tone: "text-emerald-600",
  },
  {
    title: "Investing in People",
    body: "Is your investment in training aligned with your strategy and future needs?",
    pill: "Learning & Growth",
    pillClass: "bg-emerald-50 text-emerald-700",
    icon: TrendingUp,
    tone: "text-[var(--portal-brand)]",
  },
  {
    title: "Process Improvement",
    body: "What operational changes could create the biggest impact on your financial results?",
    pill: "Internal Process",
    pillClass: "bg-violet-50 text-violet-700",
    icon: Sun,
    tone: "text-violet-600",
  },
];

export function TeachingChrome({
  title,
  subtitle,
  crumb,
  active,
  rail,
  sessionId,
  children,
  tiles,
}: {
  title: string;
  subtitle: string;
  crumb: string;
  active: string;
  rail: CourseRailState;
  sessionId: string | null;
  children: ReactNode;
  tiles?: Array<{ label: string; value: string; hint?: string }>;
}) {
  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Quick Actions"
          course={rail}
          tools={[
            {
              title: "Round Management",
              icon: <CalendarDays className="h-4 w-4" strokeWidth={1.75} />,
              body: "Open, close, and process the current decision window.",
              action: "Go to Round Management",
              primary: true,
              href: sessionId
                ? `/sessions/${sessionId}/rounds`
                : "/sessions/manage",
            },
            {
              title: "Class Performance",
              icon: <LineChart className="h-4 w-4" strokeWidth={1.75} />,
              body: "Review live results before facilitating a debrief.",
              action: "Open Class Performance",
              href: "/sessions/class-performance",
            },
            {
              title: "Professor Guide",
              icon: <BookOpen className="h-4 w-4" strokeWidth={1.75} />,
              body: "Facilitation notes for using insights in class.",
              action: "View Guide",
              href: "/sessions/professor-resources/guide",
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Teaching & Debrief", href: "/sessions/teaching" },
          { label: crumb },
        ]}
      />
      {tiles ? <ProfessorStatRow tiles={tiles} /> : null}
      <ProfessorTabBar tabs={TEACHING_TABS} active={active} />
      {children}
      <ProfessorHelpBanner
        title="Use these insights to guide your debrief"
        body="Spark discussion and help students connect decisions to outcomes. Scores come from processed rounds only."
      />
    </ProfessorPageGrid>
  );
}

export function TeachingOverview({
  rail,
  sessionId,
}: {
  rail: CourseRailState;
  sessionId: string | null;
}) {
  return (
    <TeachingChrome
      title="Teaching & Debrief"
      subtitle="Gain insights, identify teaching moments, and guide meaningful learning conversations."
      crumb="Overview"
      active="hub"
      rail={rail}
      sessionId={sessionId}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {[
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
            body: "Engagement signals when those metrics exist.",
            href: "/sessions/teaching/learning-analytics",
          },
        ].map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm hover:border-[var(--portal-accent-blue)]"
          >
            <h2 className="font-bold text-[var(--portal-title)]">{card.title}</h2>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">{card.body}</p>
          </Link>
        ))}
      </div>
    </TeachingChrome>
  );
}

export function RoundInsightsView({
  rail,
  sessionId,
  roundLabel,
  teams,
  submitted,
  classAvg,
  open,
}: {
  rail: CourseRailState;
  sessionId: string | null;
  roundLabel: string | null;
  teams: number;
  submitted: string;
  classAvg: string;
  open: boolean;
}) {
  return (
    <TeachingChrome
      title="Teaching & Debrief"
      subtitle="Gain insights, identify teaching moments, and guide meaningful learning conversations."
      crumb="Round Insights"
      active="round"
      rail={rail}
      sessionId={sessionId}
      tiles={[
        {
          label: "Round Status",
          value: dash(roundLabel),
          hint: open ? "Decisions in Progress" : "Processed or not started",
        },
        { label: "Teams", value: teams ? String(teams) : "—", hint: "In Session" },
        { label: "Submissions", value: submitted, hint: "Submitted" },
        { label: "Class Avg BSC", value: classAvg, hint: "Overall Average" },
        { label: "Time Remaining", value: "—", hint: "Until Due" },
      ]}
    >
      <div className="grid gap-3 lg:grid-cols-5">
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="font-bold text-[var(--portal-title)]">
            Round Insights Summary
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
            {INSIGHT_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="flex flex-col items-center border-[var(--portal-sidebar-border)] px-1 text-center lg:border-l lg:first:border-l-0"
                >
                  <Icon className={`h-7 w-7 ${card.tone}`} strokeWidth={1.75} />
                  <p className="mt-2.5 text-[0.8125rem] font-semibold text-[var(--portal-title)]">
                    {card.label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[var(--portal-title)]">
                    {card.value}
                  </p>
                  <p className="mt-1.5 text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                    {card.body}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 border-t border-[var(--portal-sidebar-border)] pt-3">
            <Link
              href="/sessions/class-performance"
              className="text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View Full Round Insights
            </Link>
          </div>
        </article>
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-bold text-[var(--portal-title)]">
            Notable Team Patterns
          </h2>
          <ul className="mt-3 divide-y divide-[var(--portal-sidebar-border)]">
            {TEAM_PATTERNS.map((pattern) => {
              const Icon = pattern.icon;
              return (
                <li key={pattern.headline}>
                  <Link
                    href={pattern.href}
                    className="flex items-start gap-3 py-3 hover:bg-[#f8fafc]"
                  >
                    <span
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${pattern.wrap}`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-[var(--portal-title)]">
                        {"noCount" in pattern ? pattern.headline : `— ${pattern.headline}`}
                      </span>
                      <span className="mt-0.5 block text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                        {pattern.body}
                      </span>
                    </span>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--portal-muted)]" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/sessions/class-performance/team-comparison"
            className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View Team Comparison
          </Link>
        </article>
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="font-bold text-[var(--portal-title)]">
            Teaching Moments &amp; Prompts
          </h2>
          <ul className="mt-3 divide-y divide-[var(--portal-sidebar-border)]">
            {TEACHING_PROMPTS.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <li
                  key={prompt.title}
                  className="flex items-start gap-3 py-3.5"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4f7fb]">
                    <Icon className={`h-4 w-4 ${prompt.tone}`} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--portal-title)]">
                      {prompt.title}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                      {prompt.body}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${prompt.pillClass}`}
                  >
                    {prompt.pill}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link
            href="/sessions/professor-resources/teaching"
            className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View All Teaching Prompts
          </Link>
        </article>
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-bold text-[var(--portal-title)]">
            Class Discussion Starters
          </h2>
          <ul className="mt-3 divide-y divide-[var(--portal-sidebar-border)]">
            {STARTERS.map((q) => (
              <li key={q} className="flex items-start gap-3 py-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--portal-accent-blue-soft)]">
                  <MessageSquare
                    className="h-4 w-4 text-[var(--portal-accent-blue)]"
                    strokeWidth={2}
                  />
                </span>
                <span className="min-w-0 flex-1 text-sm text-[var(--portal-ink)]">
                  {q}
                </span>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-muted)]" />
              </li>
            ))}
          </ul>
          <Link
            href="/sessions/teaching/debrief"
            className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View All Starters
          </Link>
        </article>
      </div>
    </TeachingChrome>
  );
}


const BAR_COLORS = [
  "#16a34a",
  "#2563eb",
  "#f97316",
  "#7c3aed",
  "#eab308",
  "#ef4444",
  "#92400e",
];
const DONUT_COLORS = ["#16a34a", "#2563eb", "#f97316", "#7c3aed"];

/** Figma's ring gauge. Renders an empty track with a dash when pct is unknown. */
function Donut({
  pct,
  color,
  suffix,
}: {
  pct: number | null;
  color: string;
  suffix?: string;
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const filled = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <span className="relative inline-flex h-[72px] w-[72px] items-center justify-center">
      <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#eef0f3" strokeWidth="9" />
        {pct == null ? null : (
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${(filled / 100) * c} ${c}`}
          />
        )}
      </svg>
      <span className="absolute text-center text-[0.8125rem] font-bold leading-none text-[var(--portal-title)]">
        {pct == null ? "—" : `${pct}%`}
        {suffix ? (
          <span className="block text-[0.5625rem] font-normal text-[var(--portal-muted)]">
            {suffix}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function TeamInsightsView({
  rail,
  sessionId,
  teams,
  classAvg,
  topPerformer,
  rows,
  perspectives,
}: {
  rail: CourseRailState;
  sessionId: string | null;
  teams: number;
  classAvg: string;
  topPerformer: string;
  rows: Array<{
    name: string;
    score: string;
    strength: string;
    opportunity: string;
    dims: Record<string, number | null>;
  }>;
  perspectives: Array<{ key: string; label: string; pct: number | null }>;
}) {
  const barMax = 100;
  return (
    <TeachingChrome
      title="Team Insights"
      subtitle="Understand your teams—what they did well, where they struggled, and what to focus on next."
      crumb="Team Insights"
      active="team"
      rail={rail}
      sessionId={sessionId}
      tiles={[
        {
          label: "Teams Analyzed",
          value: teams ? String(teams) : "—",
          hint: "With processed results",
        },
        { label: "Class Avg Score", value: classAvg, hint: "Overall Average" },
        { label: "Top Performer", value: topPerformer, hint: "Overall Score" },
        { label: "Most Improved", value: "—", hint: "vs Last Round" },
        { label: "Teams Needing Support", value: "—", hint: "Score < 50" },
      ]}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Team Performance Overview — professor_team_insights_editable. */}
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">
            Team Performance Overview
          </h2>
          <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
            Overall scores by team (higher is better)
          </p>
          {rows.length === 0 ? (
            <p className="mt-6 text-sm text-[var(--portal-muted)]">
              No processed team results yet.
            </p>
          ) : (
            <>
              <ul className="mt-4 space-y-3">
                {rows.map((row, i) => {
                  const value = row.score === "—" ? 0 : Number(row.score);
                  return (
                    <li key={row.name} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 truncate text-[0.8125rem] text-[var(--portal-ink)]">
                        {row.name}
                      </span>
                      <span className="relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#eef0f3]">
                        <span
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${Math.max((value / barMax) * 100, 1)}%`,
                            background: BAR_COLORS[i % BAR_COLORS.length],
                          }}
                        />
                      </span>
                      <span className="w-12 shrink-0 text-right text-[0.8125rem] font-semibold tabular-nums text-[var(--portal-title)]">
                        {row.score}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="ml-[7.75rem] mr-14 mt-3 flex justify-between text-[0.6875rem] text-[var(--portal-muted)]">
                {[0, 20, 40, 60, 80, 100].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </>
          )}
          <Link
            href="/sessions/class-performance/team-comparison"
            className="mt-4 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View Full Team Performance
          </Link>
        </article>

        <div className="space-y-3">
          {/* Performance by Perspective — four donuts. */}
          <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <h2 className="font-bold text-[var(--portal-title)]">
              Performance by Perspective
            </h2>
            <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
              Class average % across teams
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {perspectives.map((p, i) => (
                <div key={p.key} className="flex flex-col items-center">
                  <Donut
                    pct={p.pct}
                    color={DONUT_COLORS[i % DONUT_COLORS.length]}
                  />
                  <p className="mt-2 text-center text-[0.75rem] font-semibold leading-tight text-[var(--portal-title)]">
                    {p.label}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/sessions/class-performance/team-comparison"
              className="mt-4 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View Perspective Details
            </Link>
          </article>

          {/* Decision Quality Overview — quality bands are not stored yet. */}
          <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <h2 className="font-bold text-[var(--portal-title)]">
              Decision Quality Overview
            </h2>
            <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
              Average decision quality score (0–100)
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <Donut pct={null} color="var(--portal-accent-blue)" suffix="/100" />
              <ul className="min-w-0 flex-1 space-y-2 text-[0.8125rem]">
                {[
                  ["High Quality (80–100)", "#16a34a"],
                  ["Medium Quality (60–79)", "#f59e0b"],
                  ["Low Quality (0–59)", "#ef4444"],
                ].map(([label, color]) => (
                  <li
                    key={label}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-2 text-[var(--portal-ink)]">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: color }}
                      />
                      {label}
                    </span>
                    <span className="font-semibold text-[var(--portal-muted)]">
                      —
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/sessions/class-performance/decision-analysis"
              className="mt-4 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View Decision Analysis
            </Link>
          </article>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
          <div className="px-4 py-4">
            <h2 className="font-bold text-[var(--portal-title)]">
              Team Strengths &amp; Opportunities
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Team</th>
                  <th className="px-4 py-3 whitespace-nowrap">Overall</th>
                  <th className="px-4 py-3 whitespace-nowrap">Top Strengths</th>
                  <th className="px-4 py-3 whitespace-nowrap">Top Opportunities</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-[var(--portal-muted)]"
                    >
                      No processed team results yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr
                      key={row.name}
                      className="border-t border-[var(--portal-sidebar-border)]"
                    >
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2.5">
                          {/* Rank badge — Figma numbers each team. */}
                          <span
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold text-white"
                            style={{
                              background: BAR_COLORS[i % BAR_COLORS.length],
                            }}
                          >
                            {i + 1}
                          </span>
                          <span className="font-semibold">{row.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{row.score}</td>
                      <td className="px-4 py-3">{row.strength}</td>
                      <td className="px-4 py-3">{row.opportunity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3">
            <Link
              href="/sessions/class-performance/decision-analysis"
              className="text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View Detailed Opportunities
            </Link>
          </div>
        </section>

        {/* Engagement & Participation — no engagement events are stored yet. */}
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">
            Engagement &amp; Participation
          </h2>
          <ul className="mt-3 divide-y divide-[var(--portal-sidebar-border)]">
            {[
              { label: "Avg. Decision Participation", Icon: UserRound },
              { label: "On-Time Submissions", Icon: Clock },
              { label: "Team Discussion Activity", Icon: MessageSquare },
              { label: "Collaboration Score", Icon: Users },
            ].map(({ label, Icon }) => (
              <li
                key={label}
                className="flex items-center justify-between gap-3 py-3"
              >
                <span className="flex min-w-0 items-center gap-2.5 text-[0.8125rem] text-[var(--portal-ink)]">
                  <Icon
                    className="h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]"
                    strokeWidth={1.75}
                  />
                  <span className="truncate">{label}</span>
                </span>
                <span className="shrink-0 font-semibold text-[var(--portal-muted)]">
                  —
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/sessions/class-performance/analytics"
            className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View Engagement Details
          </Link>
        </article>
      </div>
    </TeachingChrome>
  );
}

/* Prompts, plan steps, themes and activities transcribed from
   professor_discussion_debrief_editable_corrected. */
const DISCUSSION_PROMPTS = [
  {
    q: "What were the most difficult HR decisions your team faced this round? Why?",
    focus: "Decision Making",
    tone: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
  },
  {
    q: "How did your team prioritize investments across the 7 HR areas?",
    focus: "Resource Allocation",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    q: "What trade-offs did your team make? What factors influenced those choices?",
    focus: "Trade-offs",
    tone: "bg-amber-50 text-amber-700",
  },
  {
    q: "Which decisions had the biggest positive or negative impact on your results?",
    focus: "Impact Analysis",
    tone: "bg-violet-50 text-violet-700",
  },
  {
    q: "What would your team do differently next round?",
    focus: "Continuous Improvement",
    tone: "bg-orange-50 text-[var(--portal-brand)]",
  },
];

const DEBRIEF_PLAN = [
  {
    title: "Review Round Insights",
    body: "Examine key patterns and performance data.",
    href: "/sessions/teaching/round-insights",
  },
  {
    title: "Facilitate Discussion",
    body: "Use prompts to guide class conversations.",
    href: "/sessions/teaching/debrief",
  },
  {
    title: "Team Presentations",
    body: "Teams share key decisions and learnings.",
    href: "/sessions/teaching/team-insights",
  },
  {
    title: "Reflection & Takeaways",
    body: "Capture lessons learned and action items.",
    href: "/sessions/teaching/debrief",
  },
];

const DISCUSSION_THEMES = [
  { label: "Employee Engagement", color: "#2F6FED" },
  { label: "Training & Development", color: "#16a34a" },
  { label: "Compensation Strategy", color: "#f97316" },
  { label: "Turnover Management", color: "#7c3aed" },
  { label: "DEI Initiatives", color: "#eab308" },
];

const ACTIVITY_IDEAS = [
  { title: "Think-Pair-Share", body: "Quick reflections in small groups." },
  { title: "Hot Seat", body: "Invite a team to defend their decisions." },
  { title: "Decision Replay", body: "Revisit a key decision and explore alternatives." },
  { title: "Peer Feedback", body: "Teams give feedback to each other." },
];

export function DebriefView({
  rail,
  sessionId,
}: {
  rail: CourseRailState;
  sessionId: string | null;
}) {
  return (
    <TeachingChrome
      title="Discussion & Debrief"
      subtitle="Facilitate meaningful discussions, guide reflections, and help students connect decisions to outcomes."
      crumb="Discussion & Debrief"
      active="debrief"
      rail={rail}
      sessionId={sessionId}
      tiles={[
        { label: "Discussion Prompts", value: String(DISCUSSION_PROMPTS.length), hint: "Active Prompts" },
        { label: "Student Participation", value: "—", hint: "Avg. Participation" },
        { label: "Reflection Submissions", value: "—", hint: "Submitted" },
        { label: "Insights Generated", value: "—", hint: "Key Insights" },
        { label: "Time Remaining", value: "—", hint: "Until Due" },
      ]}
    >
      <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-[var(--portal-title)]">
                Discussion Prompts
              </h2>
              <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
                Use these prompts to guide class discussions and team reflections.
              </p>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-md border border-[var(--portal-accent-blue)] px-3 py-1.5 text-[0.8125rem] font-semibold text-[var(--portal-accent-blue)]">
              + Add Prompt
            </span>
          </div>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="py-2 pr-3 whitespace-nowrap">Prompt</th>
                <th className="py-2 pr-3 whitespace-nowrap">Focus Area</th>
                <th className="py-2 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {DISCUSSION_PROMPTS.map((p, i) => (
                <tr
                  key={p.q}
                  className="border-t border-[var(--portal-sidebar-border)] align-top"
                >
                  <td className="py-3 pr-3">
                    <span className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--portal-accent-blue)] text-[0.625rem] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="leading-snug">{p.q}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${p.tone}`}
                    >
                      {p.focus}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="flex items-center gap-2 text-[var(--portal-muted)]">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      <MoreVertical className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link
            href="/sessions/professor-resources/teaching"
            className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View All Prompts
          </Link>
        </article>

        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-[var(--portal-title)]">
                Recent Student Reflections
              </h2>
              <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
                Latest reflections submitted by teams.
              </p>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-md border border-[var(--portal-accent-blue)] px-3 py-1.5 text-[0.8125rem] font-semibold text-[var(--portal-accent-blue)]">
              View All
            </span>
          </div>
          {/* Student reflections are not stored as a first-class record yet. */}
          <p className="mt-8 text-center text-sm text-[var(--portal-muted)]">
            —
            <span className="mt-1 block text-[0.8125rem]">
              No student reflections are recorded yet.
            </span>
          </p>
          <Link
            href="/sessions/teaching/team-insights"
            className="mt-8 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View All Reflections
          </Link>
        </article>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">Debrief Plan</h2>
          <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
            Build your debrief plan for this round.
          </p>
          <ol className="mt-4 space-y-4">
            {DEBRIEF_PLAN.map((step, i) => (
              <li key={step.title} className="flex items-start gap-3">
                <span className="relative flex flex-col items-center">
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold ${
                      i === 0
                        ? "bg-emerald-500 text-white"
                        : i === 1
                          ? "bg-[var(--portal-accent-blue)] text-white"
                          : "bg-[#e6e9ee] text-[var(--portal-muted)]"
                    }`}
                  >
                    {i === 0 ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  {i < DEBRIEF_PLAN.length - 1 ? (
                    <span className="mt-1 h-6 w-px bg-[var(--portal-sidebar-border)]" />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.8125rem] font-bold text-[var(--portal-title)]">
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <Link
            href="/sessions/professor-resources/guide"
            className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            Open Debrief Planner
          </Link>
        </article>

        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">
            Key Discussion Themes
          </h2>
          <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
            Top themes emerging from team reflections.
          </p>
          {/* Theme weighting needs reflection text, which is not stored. */}
          <ul className="mt-4 space-y-3.5">
            {DISCUSSION_THEMES.map((theme) => (
              <li key={theme.label}>
                <span className="flex items-center justify-between gap-3 text-[0.8125rem]">
                  <span className="flex min-w-0 items-center gap-2 font-semibold text-[var(--portal-title)]">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: theme.color }}
                    />
                    <span className="truncate">{theme.label}</span>
                  </span>
                  <span className="shrink-0 text-[var(--portal-muted)]">—</span>
                </span>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#eef1f4]" />
              </li>
            ))}
          </ul>
          <Link
            href="/sessions/teaching/round-insights"
            className="mt-4 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View Theme Details
          </Link>
        </article>

        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">
            Class Activity Ideas
          </h2>
          <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
            Suggested activities to deepen learning.
          </p>
          <ul className="mt-4 divide-y divide-[var(--portal-sidebar-border)]">
            {ACTIVITY_IDEAS.map((a) => (
              <li key={a.title} className="flex items-start gap-3 py-3">
                <Users
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]"
                  strokeWidth={2}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.8125rem] font-bold text-[var(--portal-title)]">
                    {a.title}
                  </span>
                  <span className="mt-0.5 block text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                    {a.body}
                  </span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--portal-muted)]" />
              </li>
            ))}
          </ul>
          <Link
            href="/sessions/professor-resources/teaching"
            className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View All Activities
          </Link>
        </article>
      </div>
    </TeachingChrome>
  );
}

/* Structure and copy transcribed from
   professor_learning_analytics_editable_corrected. Engagement, confidence and
   learning-gain signals are not stored, so every value renders as —. */
const LA_KPIS = [
  "Class Engagement",
  "Decision Confidence",
  "Learning Gain",
  "Strategy Alignment",
  "Simulation Mastery",
];

const LA_TABS = [
  "Engagement Analytics",
  "Learning Progress",
  "Decision Patterns",
  "Team Insights",
];

const LEARNING_TOPICS = [
  "People & Culture",
  "Compensation",
  "Talent Management",
  "Org Design",
  "DEI",
];

const HEATMAP_ROWS = [
  "Recruitment",
  "Performance",
  "Training",
  "Compensation",
  "Org Design",
];

const LEARNING_RESOURCES = [
  { label: "Simulation Guide", href: "/sessions/professor-resources/guide" },
  { label: "HR Strategy Readings", href: "/sessions/professor-resources/teaching" },
  { label: "Debrief Templates", href: "/sessions/teaching/debrief" },
  { label: "Learning Framework", href: "/sessions/professor-resources/reference" },
];

export function LearningAnalyticsView({
  rail,
  sessionId,
}: {
  rail: CourseRailState;
  sessionId: string | null;
}) {
  return (
    <TeachingChrome
      title="Learning Analytics"
      subtitle="Real-time insights into student learning, decision patterns, and class-level outcomes."
      crumb="Learning Analytics"
      active="learning"
      rail={rail}
      sessionId={sessionId}
    >
      {/* KPI row */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {LA_KPIS.map((label) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-3.5 shadow-sm"
          >
            <p className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
              {label}
            </p>
            <p className="mt-1.5 text-2xl font-bold leading-none text-[var(--portal-title)]">
              —
            </p>
            <p className="mt-1.5 text-[0.75rem] text-[var(--portal-muted)]">
              vs. Previous Round
            </p>
          </div>
        ))}
      </div>

      <div className="flex w-full min-w-0 items-end gap-5 overflow-x-auto border-b border-[var(--portal-sidebar-border)]">
        {LA_TABS.map((t, i) => (
          <span
            key={t}
            className={`relative whitespace-nowrap pb-2.5 text-sm font-semibold ${
              i === 0
                ? "text-[var(--portal-accent-blue)]"
                : "text-[var(--portal-muted)]"
            }`}
          >
            {t}
            {i === 0 ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t bg-[var(--portal-accent-blue)]" />
            ) : null}
          </span>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">
            Engagement Over Time
          </h2>
          <p className="mt-6 flex h-40 items-center justify-center rounded-lg bg-[#f8fafc] text-sm text-[var(--portal-muted)]">
            No engagement events are recorded yet.
          </p>
        </article>
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">
            Learning Progress
          </h2>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {["Strategy", "People", "Process", "Finance"].map((c) => (
              <div key={c} className="flex flex-col items-center">
                <span className="text-[0.75rem] font-semibold text-[var(--portal-muted)]">
                  —
                </span>
                <span className="mt-2 flex h-24 w-full items-end gap-1">
                  <span className="h-1/3 flex-1 rounded-t bg-[#e6e9ee]" />
                  <span className="h-1/2 flex-1 rounded-t bg-[#dbe6fb]" />
                </span>
                <span className="mt-1.5 text-[0.6875rem] font-semibold text-[var(--portal-title)]">
                  {c}
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">
            Decision Effectiveness
          </h2>
          <div className="mt-4 flex items-center gap-5">
            <Donut pct={null} color="var(--portal-accent-blue)" suffix="Overall" />
            <ul className="min-w-0 flex-1 space-y-2 text-[0.8125rem]">
              {[
                ["High", "#16a34a"],
                ["Medium", "#2F6FED"],
                ["Low", "#f97316"],
              ].map(([label, color]) => (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="text-[var(--portal-ink)]">{label} (—)</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="px-5 py-4">
          <h2 className="font-bold text-[var(--portal-title)]">
            Team Learning Insights
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Team Name</th>
                <th className="px-4 py-3 whitespace-nowrap">Engagement</th>
                <th className="px-4 py-3 whitespace-nowrap">Decision Score</th>
                <th className="px-4 py-3 whitespace-nowrap">Learning Gain</th>
                <th className="px-4 py-3 whitespace-nowrap">Key Strengths</th>
                <th className="px-4 py-3 whitespace-nowrap">Areas for Growth</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[var(--portal-sidebar-border)]">
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[var(--portal-muted)]"
                >
                  Engagement and learning-gain signals are not recorded yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-4">
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">
            Learning by Topic
          </h2>
          <ul className="mt-4 space-y-3">
            {LEARNING_TOPICS.map((t) => (
              <li key={t} className="text-[0.8125rem]">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[var(--portal-ink)]">{t}</span>
                  <span className="shrink-0 text-[var(--portal-muted)]">—</span>
                </span>
                <span className="mt-1 block h-1.5 rounded-full bg-[#eef1f4]" />
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">
            Decision Heatmap
          </h2>
          <div className="mt-3 flex justify-between px-1 text-[0.625rem] text-[var(--portal-muted)]">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {HEATMAP_ROWS.map((r) => (
              <li key={r} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-[0.6875rem] text-[var(--portal-ink)]">
                  {r}
                </span>
                <span className="flex flex-1 gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-4 flex-1 rounded-sm bg-[#eef1f4]"
                    />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">Top Insights</h2>
          <ol className="mt-4 space-y-3">
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex items-start gap-2.5">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef1f4] text-[0.6875rem] font-bold text-[var(--portal-muted)]">
                  {n}
                </span>
                <span className="text-[0.8125rem] text-[var(--portal-muted)]">
                  —
                </span>
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">
            Learning Resources
          </h2>
          <ul className="mt-4 divide-y divide-[var(--portal-sidebar-border)]">
            {LEARNING_RESOURCES.map((r) => (
              <li key={r.label}>
                <Link
                  href={r.href}
                  className="flex items-center gap-2.5 py-2.5 text-[0.8125rem] text-[var(--portal-accent-blue)] hover:underline"
                >
                  <BookOpen className="h-4 w-4 shrink-0" strokeWidth={2} />
                  <span className="min-w-0 flex-1 truncate">{r.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--portal-muted)]" />
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </TeachingChrome>
  );
}
