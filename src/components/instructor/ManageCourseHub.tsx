import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Info,
  Megaphone,
  Users,
} from "lucide-react";
import { ProfessorSystemStatus } from "@/components/instructor/ProfessorChrome";

export type SessionOption = {
  id: string;
  name: string;
  status: string;
  teamCount: number;
  courseCode?: string | null;
  semester?: string | null;
  practiceRounds?: number;
  competitiveRounds?: number;
  currentRoundLabel?: string;
  currentRoundHint?: string;
  currentRoundOpen?: boolean;
  submittedValue?: string;
  submittedHint?: string;
  budgetLabel?: string;
  budgetHint?: string;
  completedRounds?: number;
  nextRoundLabel?: string;
};

const NAV_ROWS = [
  {
    title: "Course Overview",
    body: "View course details, structure, round settings, and current status.",
    href: (id: string) => `/sessions/${id}/course`,
    icon: FileText,
    iconWrap: "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]",
  },
  {
    title: "Teams & Enrollment",
    body: "Create teams, assign industry and strategy, and manage enrollment.",
    href: (id: string) => `/sessions/${id}/teams`,
    icon: Users,
    iconWrap: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Announcements",
    body: "Create and manage announcements for your class. Messages appear on the student dashboard.",
    href: (id: string) => `/sessions/${id}/announcements`,
    icon: Megaphone,
    iconWrap: "bg-orange-50 text-[var(--portal-brand)]",
  },
  {
    title: "Round Management",
    body: "Open, close, and process practice and competitive rounds. Set economy and compute outcomes.",
    href: (id: string) => `/sessions/${id}/rounds`,
    icon: CalendarDays,
    iconWrap: "bg-violet-50 text-violet-700",
  },
] as const;

function statusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "complete") return "Complete";
  return "Setup";
}

export function ManageCourseHub({
  sessions,
  activeSessionId,
}: {
  sessions: SessionOption[];
  activeSessionId: string | null;
}) {
  const active = sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? null;
  const courseTitle = active
    ? [active.courseCode, active.name].filter(Boolean).join(" ")
    : "No course yet";

  const metrics = active
    ? [
        {
          label: "Teams",
          value: String(active.teamCount),
          hint: "Total Teams",
          icon: Users,
        },
        {
          label: "Rounds",
          value: `${active.practiceRounds ?? 0} Practice`,
          hint: `${active.competitiveRounds ?? 0} Competitive`,
          icon: CalendarDays,
        },
        {
          label: "Current Round",
          value: active.currentRoundLabel ?? "—",
          hint: active.currentRoundHint ?? "—",
          badge: active.currentRoundOpen ? "OPEN" : null,
          icon: BookOpen,
        },
        {
          label: "Submissions",
          value: active.submittedValue ?? "—",
          hint: active.submittedHint ?? "Submitted",
          icon: FileText,
        },
        {
          label: "Discretionary HR Budget",
          value: active.budgetLabel ?? "—",
          hint: active.budgetHint ?? "Per team / per round",
          icon: CircleDollarSign,
        },
      ]
    : [];

  return (
    <div className="grid w-full items-start gap-4 lg:grid-cols-[minmax(0,1fr)_var(--portal-right-rail)]">
      <div className="min-w-0 space-y-5">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--portal-muted)]">
          <Link href="/sessions" className="text-[var(--portal-accent-blue)] hover:underline">
            Dashboard
          </Link>
          <span>›</span>
          <span className="text-[var(--portal-accent-blue)]">Course Management</span>
          <span>›</span>
          <span className="font-medium text-[var(--portal-ink)]">Course Overview</span>
        </nav>

        <div>
          <h1 className="text-[1.75rem] font-bold leading-tight text-[var(--portal-title)]">
            Course Management
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--portal-muted)]">
            Manage all aspects of your simulation course. Set up teams,
            communicate with students, and control the simulation rounds.
          </p>
        </div>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                <FileText className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--portal-primary)]">
                  Active Course
                </p>
                <h2 className="mt-1 text-xl font-bold text-[var(--portal-title)]">
                  {courseTitle}
                  {active?.semester ? ` – ${active.semester}` : ""}
                </h2>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--portal-muted)]">
                  <span>Session:</span>
                  <span className="font-medium text-[var(--portal-ink)]">
                    {active?.semester ?? "—"}
                  </span>
                  <span className="ml-2">Status:</span>
                  {active ? (
                    <span className="rounded-md bg-[#e8eef8] px-2 py-0.5 text-[0.6875rem] font-semibold uppercase text-[var(--portal-title)]">
                      {statusLabel(active.status)}
                    </span>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
            {active ? (
              <div className="flex flex-wrap gap-2">
                {active.status === "complete" ? (
                  <Link
                    href="/sessions/new"
                    className="inline-flex items-center gap-2 rounded-md bg-[var(--portal-brand)] px-3.5 py-2 text-sm font-semibold text-white"
                  >
                    Start a new course
                  </Link>
                ) : null}
                <Link
                  href={`/sessions/${active.id}/course`}
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
                >
                  <FileText className="h-4 w-4" strokeWidth={1.75} />
                  Edit Course Settings
                </Link>
              </div>
            ) : (
              <Link
                href="/sessions/new"
                className="rounded-md bg-[var(--portal-brand)] px-3.5 py-2 text-sm font-semibold text-white"
              >
                Create session
              </Link>
            )}
          </div>

          {active ? (
            <div className="mt-5 grid grid-cols-2 divide-y divide-[var(--portal-sidebar-border)] border-t border-[var(--portal-sidebar-border)] sm:grid-cols-5 sm:divide-x sm:divide-y-0">
              {metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="min-w-0 px-3 py-3 first:pl-0 last:pr-0">
                    <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-[var(--portal-muted)]">
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {m.label}
                    </p>
                    <p className="mt-2 text-lg font-bold leading-none text-[var(--portal-title)]">
                      {m.value}
                      {m.badge ? (
                        <span className="ml-2 inline-flex rounded bg-emerald-100 px-1.5 py-0.5 align-middle text-[0.5625rem] font-bold uppercase text-emerald-700">
                          {m.badge}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-2 text-[0.6875rem] text-[var(--portal-muted)]">
                      {m.hint}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}

          {sessions.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {sessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/manage?session=${s.id}`}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    s.id === active?.id
                      ? "bg-[var(--portal-navy)] text-white"
                      : "bg-[#f1f3f5] text-[var(--portal-ink)] hover:bg-[var(--portal-sidebar-border)]"
                  }`}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--portal-title)]">
            Course Management Center
          </h2>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Use the tools below to manage your course.
          </p>
          <div className="mt-3 space-y-2">
            {NAV_ROWS.map((row) => {
              const Icon = row.icon;
              const href = active ? row.href(active.id) : "/sessions/new";
              return (
                <Link
                  key={row.title}
                  href={href}
                  className="flex items-center gap-4 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-3.5 shadow-sm transition hover:border-[var(--portal-primary)]"
                >
                  <span
                    className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${row.iconWrap}`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-[var(--portal-title)]">
                      {row.title}
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] text-[var(--portal-muted)]">
                      {row.body}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--portal-muted)]" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]">
              <Info className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--portal-title)]">
                Need Help Getting Started?
              </p>
              <p className="mt-0.5 text-sm text-[var(--portal-muted)]">
                Visit the Professor Guide for step-by-step instructions on
                setting up and running your course.
              </p>
            </div>
          </div>
          <Link
            href="/sessions/professor-resources/guide"
            className="rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
          >
            Go to Professor Guide
          </Link>
        </section>
      </div>

      <aside className="space-y-4">
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
          <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Quick Actions
          </h2>
          <ul className="mt-3 space-y-4">
            <li>
              <p className="text-sm font-semibold text-[var(--portal-title)]">
                Open Round Management
              </p>
              <p className="mt-0.5 text-[0.6875rem] text-[var(--portal-muted)]">
                Open, close, and process the current decision window.
              </p>
              <Link
                href={active ? `/sessions/${active.id}/rounds` : "/sessions/new"}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-[var(--portal-brand)] px-3 py-2 text-xs font-semibold text-white"
              >
                Go to Round Management
              </Link>
            </li>
            <li className="border-t border-[var(--portal-sidebar-border)] pt-4">
              <p className="text-sm font-semibold text-[var(--portal-title)]">
                Teams & Enrollment
              </p>
              <p className="mt-0.5 text-[0.6875rem] text-[var(--portal-muted)]">
                Create teams and assign industry and strategy.
              </p>
              <Link
                href={active ? `/sessions/${active.id}/teams` : "/sessions/new"}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)]"
              >
                Manage Teams
              </Link>
            </li>
            <li className="border-t border-[var(--portal-sidebar-border)] pt-4">
              <p className="text-sm font-semibold text-[var(--portal-title)]">
                Simulation Lab
              </p>
              <p className="mt-0.5 text-[0.6875rem] text-[var(--portal-muted)]">
                Review configuration before students play.
              </p>
              <Link
                href="/sessions/lab"
                className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)]"
              >
                Open Simulation Lab
              </Link>
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
          <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Course Status
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--portal-muted)]">Practice Round</dt>
              <dd className="font-medium">
                {active?.currentRoundOpen ? "Open" : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--portal-muted)]">Competitive Rounds</dt>
              <dd className="font-medium">{active?.competitiveRounds ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--portal-muted)]">Students Enrolled</dt>
              <dd className="font-medium">—</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--portal-muted)]">Rounds Completed</dt>
              <dd className="font-medium">{active?.completedRounds ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--portal-muted)]">Next Round</dt>
              <dd className="font-medium">{active?.nextRoundLabel ?? "—"}</dd>
            </div>
          </dl>
          <Link
            href={active ? `/sessions/${active.id}/rounds` : "/sessions/new"}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)]"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            View Round Calendar
          </Link>
        </section>

        <ProfessorSystemStatus />
      </aside>
    </div>
  );
}
