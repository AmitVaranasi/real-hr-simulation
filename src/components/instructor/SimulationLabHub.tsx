import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  FlaskConical,
  PieChart,
  RotateCcw,
  Search,
  Settings,
  Upload,
} from "lucide-react";
import {
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorListRow,
  ProfessorStandardRail,
  type CourseRailState,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import { DISCRETIONARY_BUDGET } from "@/lib/engine/defaults";
import { formatCurrency } from "@/lib/utils";

export function SimulationLabHub({
  rail,
  sessionId,
  courseTitle,
  status,
}: {
  rail: CourseRailState;
  sessionId: string | null;
  courseTitle: string;
  status: string;
}) {
  const inspectHref = sessionId
    ? `/sessions/${sessionId}/inspect`
    : "/sessions/config";

  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Quick Actions"
          course={rail}
          tools={[
            {
              title: "Open Configuration",
              icon: <Settings className="h-4 w-4" strokeWidth={1.75} />,
              body: "Set rules and assumptions in the existing config center.",
              action: "Go to Configuration",
              primary: true,
              href: "/sessions/config",
            },
            {
              title: "Testing Center",
              icon: <FlaskConical className="h-4 w-4" strokeWidth={1.75} />,
              body: "Validate scenarios before applying them to a live course.",
              action: "Open Testing Center",
              href: "/sessions/testing",
            },
            {
              title: "Formula Inspect",
              icon: <Search className="h-4 w-4" strokeWidth={1.75} />,
              body: "Trace calculations for a team and processed round.",
              action: "Go to Formula Inspect",
              href: inspectHref,
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title="Simulation Lab"
        subtitle="Configure, test, and validate the Real HR Simulation engine."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Simulation Lab" },
        ]}
        actions={
          <Link
            href="/sessions/testing"
            className="rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)]"
          >
            Export Diagnostics
          </Link>
        }
      />

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--portal-primary)]">
            Active Course
          </p>
          <h2 className="mt-1 text-lg font-bold text-[var(--portal-title)]">
            {courseTitle}
          </h2>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Status:{" "}
            <span className="rounded-md bg-[#e8eef8] px-2 py-0.5 text-[0.6875rem] font-semibold uppercase text-[var(--portal-title)]">
              {status}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
          <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
          <p className="mt-1 text-sm font-bold text-emerald-800">Operational</p>
          <p className="text-[0.6875rem] text-emerald-700">All systems normal</p>
          <Link
            href="/sessions/testing"
            className="mt-1 inline-block text-xs font-semibold text-[var(--portal-accent-blue)]"
          >
            View Diagnostics
          </Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Configure",
            body: "Set rules and assumptions",
            href: "/sessions/config",
            icon: Settings,
          },
          {
            label: "Test",
            body: "Validate and stress test",
            href: "/sessions/testing",
            icon: FlaskConical,
          },
          {
            label: "Inspect",
            body: "Trace calculations and logic",
            href: inspectHref,
            icon: Search,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm hover:border-[var(--portal-accent-blue)]"
            >
              <Icon className="h-5 w-5 text-[var(--portal-accent-blue)]" />
              <p className="mt-2 text-sm font-bold uppercase tracking-wide text-[var(--portal-title)]">
                {item.label}
              </p>
              <p className="text-sm text-[var(--portal-muted)]">{item.body}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">
            Simulation Configuration
          </h2>
          {/* Green ticks + trailing values — simulation_lab_editable. */}
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--portal-ink)]">
            {[
              `Budget: ${formatCurrency(DISCRETIONARY_BUDGET)}`,
              "Economic Scenarios:",
              "Industry Settings:",
              "Strategy Conditions:",
              "BSC Benchmarks: 16 Metrics",
              "Competitors: —",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-emerald-600"
                  strokeWidth={2}
                />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/sessions/config"
            className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
          >
            Open Configuration Center
          </Link>
        </article>
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">Testing Center</h2>
          <ul className="mt-3 space-y-3">
            {[
              {
                title: "Scenario Runner",
                body: "Test across industries and strategies",
              },
              {
                title: "Workflow Checklist",
                body: "Validate full classroom path",
              },
              {
                title: "Engine Diagnostics",
                body: "Check parameters and system health",
              },
              {
                title: "Live Session Inspect",
                body: "Test real team simulations",
              },
            ].map((item) => (
              <li key={item.title} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50">
                  <FlaskConical
                    className="h-3.5 w-3.5 text-violet-600"
                    strokeWidth={2}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--portal-title)]">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/sessions/testing"
            className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
          >
            Open Testing Center
          </Link>
        </article>
        <article className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">Quick Tools</h2>
          {/* Bordered rows: icon + title + description + chevron. */}
          <ul className="mt-3 space-y-2">
            {[
              {
                title: "Formula Workspace",
                body: "View and test simulation formulas",
                href: inspectHref,
                Icon: Search,
              },
              {
                title: "Import Configuration",
                body: "Upload and apply settings",
                href: "/sessions/config",
                Icon: Upload,
              },
              {
                title: "Save Defaults",
                body: "Restore system defaults",
                href: "/sessions/config",
                Icon: RotateCcw,
              },
              {
                title: "Reset to Initial State",
                body: "Clear current configuration",
                href: "/sessions/config",
                Icon: PieChart,
              },
            ].map(({ title, body, href, Icon }) => (
              <li key={title}>
                <ProfessorListRow
                  href={href}
                  title={title}
                  body={body}
                  icon={<Icon className="h-4 w-4" strokeWidth={2} />}
                />
              </li>
            ))}
          </ul>
          <Link
            href={inspectHref}
            className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
          >
            Go to Formula Inspect
          </Link>
        </article>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <h2 className="font-bold text-[var(--portal-title)]">
          Engine Health Overview
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-5">
          {[
            "Scoring Engine",
            "Budget Controls",
            "Data Integrity",
            "Round Processing",
            "Scenario Library",
          ].map((label) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-lg border border-[var(--portal-sidebar-border)] px-3 py-4 text-center"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2
                  className="h-5 w-5 text-emerald-600"
                  strokeWidth={2}
                />
              </span>
              <p className="mt-2 text-xs font-semibold text-[var(--portal-title)]">
                {label}
              </p>
              <p className="mt-0.5 text-[0.6875rem] font-semibold text-emerald-700">
                Operational
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[0.6875rem] text-[var(--portal-muted)]">
          Last system check: — ·{" "}
          <Link href="/sessions/testing" className="font-semibold text-[var(--portal-accent-blue)]">
            View Full Diagnostics
          </Link>
        </p>
      </section>
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-100">
            <Circle className="h-3 w-3 fill-violet-600 text-violet-600" />
          </span>
          <h2 className="font-bold text-[var(--portal-title)]">
            Feature Highlights
          </h2>
        </div>
        {/* Blue tick bullets — simulation_lab_editable. */}
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--portal-ink)]">
          {[
            "Industry and strategy multipliers from the live engine",
            "Decision validation on submit",
            "Carry-forward configured in Simulation Lab",
            "Scenario tests do not touch student records",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]"
                strokeWidth={2}
              />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </section>
      </div>

      <ProfessorHelpBanner
        title="Configure settings, run test scenarios, and use diagnostic tools"
        body="Ensure learning objectives are ready for your class. This landing does not replace the configuration or testing engines."
        href="/sessions/professor-resources/guide"
        action="Go to Instructor Guide"
      />
    </ProfessorPageGrid>
  );
}
