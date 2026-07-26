import Link from "next/link";

type SessionOption = {
  id: string;
  name: string;
  status: string;
  teamCount: number;
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
          href: activeId ? `/sessions/${activeId}` : "/sessions/new",
        },
        {
          title: "Team assignments",
          desc: "Create teams, set industry & strategy, share join codes",
          href: activeId ? `/sessions/${activeId}` : "/sessions/new",
        },
        {
          title: "Enrollment",
          desc: "Student join codes and password reset help",
          href: activeId ? `/sessions/${activeId}` : "/sessions/new",
        },
        {
          title: "Professor comments",
          desc: "Announcements shown on the student dashboard",
          href: activeId ? `/sessions/${activeId}` : "/sessions/new",
        },
      ],
    },
    {
      group: "Schedule",
      items: [
        {
          title: "Practice & competition rounds",
          desc: "Open, close, set economy, and compute outcomes",
          href: activeId ? `/sessions/${activeId}` : "/sessions/new",
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
      <section className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Manage Course
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Course administration
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
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
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {s.name} · {s.teamCount} teams
              </Link>
            ))}
          </div>
        )}
      </section>

      {tiles.map((group) => (
        <section key={group.group}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {group.group}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                </div>
                <span className="shrink-0 text-sm font-medium text-indigo-700">
                  Continue →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
