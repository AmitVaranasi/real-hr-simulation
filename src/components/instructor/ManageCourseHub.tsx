import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  LineChart,
  Search,
  Settings,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SessionOption = {
  id: string;
  name: string;
  status: string;
  teamCount: number;
};

const GROUP_ICONS: Record<string, LucideIcon> = {
  Administration: BookOpen,
  Schedule: ClipboardList,
  "Simulation lab": FlaskConical,
};

const TILE_ICONS: Record<string, LucideIcon> = {
  "Course info": BookOpen,
  "Team assignments": Users,
  Enrollment: Users,
  "Professor comments": ClipboardList,
  "Practice & competition rounds": Wrench,
  "Industry scoring": Trophy,
  "Industry results": LineChart,
  "Formula inspect": Search,
  "Simulation configuration": Settings,
  "Testing Center": FlaskConical,
  "New session": LayoutDashboard,
  "Professor dashboard": LayoutDashboard,
};

export function ManageCourseHub({
  sessions,
  activeSessionId,
}: {
  sessions: SessionOption[];
  activeSessionId: string | null;
}) {
  const activeId = activeSessionId ?? sessions[0]?.id ?? null;

  const tiles = [
    {
      group: "Administration",
      items: [
        {
          title: "Course info",
          desc: "Session name, status, and round structure",
          href: activeId ? `/sessions/${activeId}/course` : "/sessions/new",
        },
        {
          title: "Team assignments",
          desc: "Create teams, set industry & strategy, share join codes",
          href: activeId ? `/sessions/${activeId}/teams` : "/sessions/new",
        },
        {
          title: "Enrollment",
          desc: "Student join codes and password reset help",
          href: activeId ? `/sessions/${activeId}/teams` : "/sessions/new",
        },
        {
          title: "Professor comments",
          desc: "Announcements shown on the student dashboard",
          href: activeId
            ? `/sessions/${activeId}/announcements`
            : "/sessions/new",
        },
      ],
    },
    {
      group: "Schedule",
      items: [
        {
          title: "Practice & competition rounds",
          desc: "Open, close, set economy, and compute outcomes",
          href: activeId ? `/sessions/${activeId}/rounds` : "/sessions/new",
        },
        {
          title: "Industry scoring",
          desc: "Release the class leaderboard",
          href: activeId
            ? `/sessions/${activeId}/leaderboard`
            : "/sessions",
        },
        {
          title: "Industry results",
          desc: "Analytics, decision history, PDF/Excel export",
          href: activeId ? `/sessions/${activeId}/reports` : "/sessions",
        },
        {
          title: "Formula inspect",
          desc: "Trace decisions through metrics to BSC",
          href: activeId ? `/sessions/${activeId}/inspect` : "/sessions/testing",
        },
      ],
    },
    {
      group: "Simulation lab",
      items: [
        {
          title: "Simulation configuration",
          desc: "Budgets, economy, industries, strategies, benchmarks",
          href: "/sessions/config",
        },
        {
          title: "Testing Center",
          desc: "Scenario runs, diagnostics, workflow checklist",
          href: "/sessions/testing",
        },
        {
          title: "New session",
          desc: "Create another course simulation",
          href: "/sessions/new",
        },
        {
          title: "Professor dashboard",
          desc: "Return to round timeline and KPIs",
          href: "/sessions",
        },
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--portal-primary)]">
          Manage Course
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--portal-ink)]">
          Course administration
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--portal-muted)]">
          Capsim-style hub for classroom management. Choose a course, then open
          the tile you need.
        </p>
        {sessions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/manage?session=${s.id}`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  s.id === activeId
                    ? "bg-[var(--portal-primary)] text-white"
                    : "bg-[var(--portal-sidebar)] text-[var(--portal-ink)] hover:bg-[var(--portal-sidebar-border)]"
                }`}
              >
                {s.name} · {s.teamCount} teams
              </Link>
            ))}
          </div>
        )}
      </section>

      {tiles.map((group) => {
        const GroupIcon = GROUP_ICONS[group.group] ?? BookOpen;
        return (
          <section key={group.group}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
              <GroupIcon
                className="h-4 w-4 text-[var(--portal-primary)]"
                strokeWidth={2}
              />
              {group.group}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.items.map((item) => {
                const TileIcon = TILE_ICONS[item.title] ?? Wrench;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-start gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm transition hover:border-[var(--portal-primary)] hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--portal-primary-soft)]">
                      <TileIcon
                        className="h-5 w-5 text-[var(--portal-primary)]"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--portal-ink)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--portal-muted)]">
                        {item.desc}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-[var(--portal-primary)]">
                        Continue →
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
