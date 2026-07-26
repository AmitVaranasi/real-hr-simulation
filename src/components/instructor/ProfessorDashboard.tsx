import Link from "next/link";
import { Button } from "@/components/ui/button";

export type RoundSummary = {
  id: string;
  round_number: number;
  round_type: string;
  status: string;
};

export type SessionSummary = {
  id: string;
  name: string;
  course_code: string | null;
  semester: string | null;
  status: string;
  rounds_total: number;
  practice_rounds: number;
  teamCount: number;
  openRound: RoundSummary | null;
  rounds: RoundSummary[];
  currentRoundLabel: string;
  submittedCount: number;
  decisionsExpected: number;
};

export function ProfessorDashboard({
  sessions,
}: {
  sessions: SessionSummary[];
}) {
  const active = sessions.find((s) => s.status === "active") ?? sessions[0];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-slate-900 px-6 py-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Professor portal
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Dashboard</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Command center for rounds, teams, configuration, and testing —
              Capsim-style layout for Real HR Simulation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/sessions/new">
              <Button className="bg-white text-slate-900 hover:bg-slate-100">
                New session
              </Button>
            </Link>
            <Link href="/sessions/manage">
              <Button
                variant="outline"
                className="border-slate-500 bg-transparent text-white hover:bg-slate-800"
              >
                Manage Course
              </Button>
            </Link>
          </div>
        </div>

        {active ? (
          <div className="px-6 py-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Active course
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  {active.name}
                </h2>
                <p className="text-sm text-slate-500">
                  {[active.course_code, active.semester, active.status]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Link
                href={`/sessions/${active.id}`}
                className="text-sm font-medium text-indigo-700 hover:underline"
              >
                Open course ops →
              </Link>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-xs text-slate-500">Teams</dt>
                <dd className="text-xl font-semibold text-slate-900">
                  {active.teamCount}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-xs text-slate-500">Current round</dt>
                <dd className="text-xl font-semibold text-slate-900">
                  {active.openRound
                    ? `R${active.openRound.round_number}`
                    : "—"}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-xs text-slate-500">Submissions</dt>
                <dd className="text-xl font-semibold text-slate-900">
                  {active.decisionsExpected > 0
                    ? `${active.submittedCount}/${active.decisionsExpected}`
                    : "—"}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-xs text-slate-500">Structure</dt>
                <dd className="text-xl font-semibold text-slate-900">
                  {active.practice_rounds}p + {active.rounds_total}c
                </dd>
              </div>
            </dl>

            {/* Round timeline */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Round timeline
              </h3>
              <ol className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {active.rounds
                  .slice()
                  .sort((a, b) => a.round_number - b.round_number)
                  .map((r) => {
                    const isOpen = r.status === "open";
                    const isClosed = r.status === "closed";
                    return (
                      <li
                        key={r.id}
                        className={`min-w-[120px] rounded-lg border px-3 py-3 text-sm ${
                          isOpen
                            ? "border-emerald-300 bg-emerald-50"
                            : isClosed
                              ? "border-slate-200 bg-slate-50"
                              : "border-dashed border-slate-200 bg-white"
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          R{r.round_number}
                        </p>
                        <p className="mt-0.5 font-medium capitalize text-slate-900">
                          {r.round_type}
                        </p>
                        <p
                          className={`mt-1 text-xs font-medium ${
                            isOpen
                              ? "text-emerald-700"
                              : isClosed
                                ? "text-slate-600"
                                : "text-slate-400"
                          }`}
                        >
                          {r.status}
                        </p>
                      </li>
                    );
                  })}
              </ol>
            </div>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-slate-600">
              No sessions yet. Create one to add teams and open rounds.
            </p>
            <Link href="/sessions/new" className="mt-4 inline-block">
              <Button>Create session</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Manage Course tile preview */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Manage Course
          </h2>
          <Link
            href="/sessions/manage"
            className="text-sm font-medium text-indigo-700 hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/sessions/manage",
              title: "Administration",
              desc: "Course info, teams, announcements",
            },
            {
              href: active ? `/sessions/${active.id}` : "/sessions/new",
              title: "Schedule rounds",
              desc: "Open, close, and process rounds",
            },
            {
              href: "/sessions/config",
              title: "Configuration",
              desc: "Budgets, multipliers, benchmarks",
            },
            {
              href: "/sessions/testing",
              title: "Testing Center",
              desc: "Scenarios and formula diagnostics",
            },
            {
              href: active ? `/sessions/${active.id}/reports` : "/sessions",
              title: "Industry results",
              desc: "Class analytics and exports",
            },
            {
              href: active ? `/sessions/${active.id}/leaderboard` : "/sessions",
              title: "Industry scoring",
              desc: "Release leaderboard",
            },
            {
              href: active ? `/sessions/${active.id}/inspect` : "/sessions/testing",
              title: "Formula inspect",
              desc: "Input → metric → BSC trace",
            },
            {
              href: "/sessions/new",
              title: "New session",
              desc: "Create another course run",
            },
          ].map((tile) => (
            <Link
              key={tile.title}
              href={tile.href}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <p className="font-semibold text-slate-900">{tile.title}</p>
              <p className="mt-1 text-sm text-slate-500">{tile.desc}</p>
              <p className="mt-3 text-xs font-medium text-indigo-700">
                Continue →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Your sessions</h2>
        <div className="mt-3 space-y-2">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:border-indigo-200"
            >
              <div>
                <p className="font-semibold text-slate-900">{s.name}</p>
                <p className="text-sm text-slate-500">
                  {s.teamCount} teams · {s.currentRoundLabel}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  s.openRound
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {s.status}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
