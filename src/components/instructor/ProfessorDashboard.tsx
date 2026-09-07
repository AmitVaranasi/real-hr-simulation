"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Briefcase,
  ChevronRight,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  Factory,
  Globe2,
  Lock,
  PlayCircle,
  Star,
  Target,
  TrendingUp,
  Users,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

export type RoundSummary = {
  id: string;
  round_number: number;
  round_type: string;
  status: string;
  economy_condition?: string | null;
};

export type TeamLite = {
  id: string;
  name: string;
  industry: string | null;
  strategy: string | null;
  lastScore: number | null;
};

export type RoundSnapshot = {
  headcount: number | null;
  revenue: number | null;
  profit: number | null;
  stockPrice: number | null;
  bsc: number | null;
  budgetRemaining: number | null;
};

export type TeamProgress = {
  total: number;
  started: number;
  saved: number;
  submitted: number;
  awaiting: number;
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
  industry: string;
  strategy: string;
  economy: string;
  budget: number;
  progress: TeamProgress;
  snapshot: RoundSnapshot | null;
  teams: TeamLite[];
  completedRounds: number;
};

function StatusPill({
  state,
}: {
  state: "complete" | "progress" | "pending" | "locked";
}) {
  if (state === "complete") {
    return (
      <span className="mt-2 inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-emerald-700">
        ✓ Complete
      </span>
    );
  }
  if (state === "progress") {
    return (
      <span className="mt-2 inline-flex items-center rounded-md border border-blue-300 bg-blue-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-blue-700">
        • In Progress
      </span>
    );
  }
  if (state === "locked") {
    return (
      <span className="mt-2 inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-[var(--portal-muted)]">
        <Lock className="h-3 w-3" /> Locked
      </span>
    );
  }
  return (
    <span className="mt-2 inline-flex text-[0.6875rem] font-semibold text-[var(--portal-muted)]">
      - Pending
    </span>
  );
}

function dash<T>(value: T | null | undefined, format?: (v: T) => string) {
  if (value == null) return "—";
  return format ? format(value) : String(value);
}

function professorLabel(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Professor";
  const last = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return `Professor ${last}`;
}

function economySub(economy: string) {
  const key = economy.toLowerCase();
  if (key === "boom") return "Growth environment";
  if (key === "recession") return "Constrained environment";
  if (key === "normal") return "Stable Environment";
  return "—";
}

function roundSubline(open: boolean, started: number, submitted: number, total: number) {
  if (!open) return "No decision window open";
  if (submitted >= total && total > 0) return "All teams submitted";
  if (started > 0) return "Decisions in Progress";
  return "Waiting for teams";
}

export function ProfessorDashboard({
  sessions,
  professorName,
}: {
  sessions: SessionSummary[];
  professorName: string;
}) {
  const active = sessions.find((s) => s.status === "active") ?? sessions[0];
  const [teamId, setTeamId] = useState(active?.teams[0]?.id ?? "");

  const selectedTeam = useMemo(
    () => active?.teams.find((t) => t.id === teamId) ?? active?.teams[0] ?? null,
    [active, teamId]
  );

  if (!active) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--portal-title)]">
          Course Command Center
        </h1>
        <p className="mt-2 text-sm text-[var(--portal-muted)]">
          Create a course session to configure teams, open rounds, and monitor
          class progress.
        </p>
        <Link href="/sessions/new" className="mt-5 inline-block">
          <Button variant="orange">Create session</Button>
        </Link>
      </div>
    );
  }

  const open = Boolean(active.openRound);
  const submitted = active.progress.submitted;
  const allSubmitted = open && submitted >= active.progress.total && active.progress.total > 0;
  const latestClosed = active.rounds
    .filter((r) => r.status === "closed")
    .sort((a, b) => b.round_number - a.round_number)[0];

  const steps = [
    {
      n: 1,
      title: "Round Open",
      body: "Students can enter the simulation and begin HR decisions.",
      state: open ? ("complete" as const) : ("pending" as const),
      icon: DoorOpen,
    },
    {
      n: 2,
      title: "HR Decisions",
      body: "Students are submitting decisions across seven HR areas.",
      state: allSubmitted
        ? ("complete" as const)
        : open && active.progress.started > 0
          ? ("progress" as const)
          : open
            ? ("pending" as const)
            : ("locked" as const),
      icon: Users,
    },
    {
      n: 3,
      title: "Review & Submit",
      body: "Teams review decisions and submit before you close the window.",
      state: allSubmitted
        ? ("complete" as const)
        : open && submitted > 0
          ? ("progress" as const)
          : open
            ? ("pending" as const)
            : ("locked" as const),
      icon: ClipboardList,
    },
    {
      n: 4,
      title: "Results",
      body: "Process the round to generate results and unlock teaching views.",
      state: latestClosed && !open ? ("complete" as const) : ("locked" as const),
      icon: BarChart3,
    },
  ];

  const nextActions = [];
  if (!open) {
    nextActions.push({
      title: "Open Round",
      body: "Open the next practice or competitive decision window.",
      href: `/sessions/${active.id}/rounds`,
      label: "Go to Round Management →",
      primary: true,
    });
  } else if (!allSubmitted) {
    nextActions.push({
      title: "Monitor Submissions",
      body: `${submitted} of ${active.progress.total} teams have submitted.`,
      href: `/sessions/${active.id}/rounds`,
      label: "Review Submissions →",
      primary: true,
    });
    nextActions.push({
      title: "Close Round",
      body: "Close the decision window when you are ready to process.",
      href: `/sessions/${active.id}/rounds`,
      label: "Close Round",
      primary: false,
    });
  } else {
    nextActions.push({
      title: "Compute Results",
      body: "Process this round to lock decisions and generate outcomes.",
      href: `/sessions/${active.id}/rounds`,
      label: "Process Round →",
      primary: true,
    });
  }
  if (latestClosed) {
    nextActions.push({
      title: "View Round Insights",
      body: "Turn processed results into teaching points.",
      href: "/sessions/teaching/round-insights",
      label: "Open Round Insights",
      primary: false,
    });
    nextActions.push({
      title: "Begin Debrief",
      body: "Open the discussion outline for this class.",
      href: "/sessions/teaching/debrief",
      label: "Begin Debrief",
      primary: false,
    });
  }

  const progressPct =
    active.rounds_total + active.practice_rounds > 0
      ? Math.min(
          100,
          Math.round(
            (active.completedRounds /
              (active.rounds_total + active.practice_rounds)) *
              100
          )
        )
      : 0;

  const snap = active.snapshot;
  const metrics = [
    {
      label: "Headcount",
      icon: Users,
      iconClass: "text-[var(--portal-icon-green)]",
      value: dash(snap?.headcount),
    },
    {
      label: "Revenue",
      icon: CircleDollarSign,
      iconClass: "text-[var(--portal-icon-green)]",
      value: dash(snap?.revenue, formatCompactCurrency),
    },
    {
      label: "Operating Profit",
      icon: TrendingUp,
      iconClass: "text-[var(--portal-icon-orange)]",
      value: dash(snap?.profit, formatCompactCurrency),
    },
    {
      label: "Stock Price",
      icon: BarChart3,
      iconClass: "text-[var(--portal-icon-purple)]",
      value: dash(snap?.stockPrice, (v) => `$${v.toFixed(2)}`),
    },
    {
      label: "HR Balance Scorecard",
      icon: Star,
      iconClass: "text-[var(--portal-icon-blue)]",
      value: dash(snap?.bsc, (v) => v.toFixed(1)),
    },
    {
      label: "HR Budget Remaining",
      icon: Briefcase,
      iconClass: "text-[var(--portal-icon-blue)]",
      value: dash(snap?.budgetRemaining, formatCurrency),
    },
  ];

  const rankedTeams = [...active.teams].sort(
    (a, b) => (b.lastScore ?? -1) - (a.lastScore ?? -1)
  );
  const selectedRank =
    selectedTeam?.lastScore != null
      ? rankedTeams.findIndex((t) => t.id === selectedTeam.id) + 1
      : null;

  const context = [
    {
      label: "Current Round",
      icon: CalendarDays,
      iconClass: "text-[var(--portal-icon-blue)]",
      value: active.openRound
        ? `${active.openRound.round_type === "practice" ? "Practice" : "Competitive"} Round ${active.openRound.round_number}`
        : "No Round Open",
      badge: active.openRound ? "OPEN" : null,
      sub: roundSubline(open, active.progress.started, submitted, active.progress.total),
    },
    {
      label: "Industry",
      icon: Factory,
      iconClass: "text-[var(--portal-icon-green)]",
      value: active.industry,
      badge: null,
      sub: "Competitive Intensity: —",
    },
    {
      label: "Strategy",
      icon: Target,
      iconClass: "text-[var(--portal-icon-orange)]",
      value: active.strategy,
      badge: null,
      sub: "—",
    },
    {
      label: "Economy",
      icon: Globe2,
      iconClass: "text-[var(--portal-icon-purple)]",
      value: active.economy,
      badge: null,
      sub: economySub(active.economy),
    },
    {
      label: "Discretionary HR Budget",
      icon: CircleDollarSign,
      iconClass: "text-[var(--portal-icon-blue)]",
      value: formatCurrency(active.budget),
      badge: null,
      sub: "Per team / per round",
    },
  ];

  const courseTitle = [active.course_code, active.name]
    .filter(Boolean)
    .join(" ");
  const courseHeading = active.semester
    ? `${courseTitle} - ${active.semester}`
    : courseTitle;

  const snapshotFootnote = snap ? "vs Last Round" : "No results yet";
  const totalRounds = active.rounds_total + active.practice_rounds;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--portal-muted)]">
            Welcome back,{" "}
            <span className="font-bold text-[var(--portal-title)]">
              {professorLabel(professorName)}
            </span>
          </p>
          <h1 className="mt-1 text-[1.75rem] font-bold leading-tight text-[var(--portal-title)]">
            {courseHeading}
          </h1>
          <p className="mt-2 text-sm text-[var(--portal-muted)]">
            Command center for your simulation. Monitor progress, manage
            rounds, and view results.
          </p>
        </div>
        <Link
          href="/sessions/help"
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-[var(--portal-accent-blue)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
        >
          <PlayCircle className="h-4 w-4" strokeWidth={1.75} />
          How It Works
        </Link>
      </div>

      <div className="grid w-full items-start gap-4 lg:grid-cols-[minmax(0,1fr)_var(--portal-right-rail)]">
        <div className="min-w-0 space-y-4">
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-3 py-3 shadow-sm">
          <div className="grid grid-cols-2 divide-y divide-[var(--portal-sidebar-border)] md:grid-cols-3 md:divide-y-0 lg:grid-cols-5 lg:divide-x">
            {context.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="min-w-0 px-3 py-2 first:pl-1 last:pr-1">
                  <div className="flex items-start gap-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                    <Icon className={`mt-px h-3.5 w-3.5 shrink-0 `} strokeWidth={2} />
                    <span className="leading-tight">{card.label}</span>
                  </div>
                  <p className="mt-1 text-[0.9375rem] font-bold leading-snug text-[var(--portal-title)]">
                    {card.value}
                    {card.badge ? (
                      <span className="ml-1.5 inline-flex rounded bg-emerald-100 px-1.5 py-px text-[0.625rem] font-bold uppercase text-emerald-700">
                        {card.badge}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[0.6875rem] leading-tight text-[var(--portal-muted)]">
                    {card.sub}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Round Overview
            </h2>
            <Link
              href={`/sessions/${active.id}/rounds`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
              View Round Calendar
            </Link>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-stretch">
            {steps.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.n}
                  className="flex min-w-0 flex-1 items-stretch"
                >
                  {i > 0 ? (
                    <div className="hidden shrink-0 items-center px-1 lg:flex">
                      <ChevronRight className="h-4 w-4 text-[var(--portal-muted)]" />
                    </div>
                  ) : null}
                  {/* Numbered stepper card with a state-coloured top rule —
                      professor_dashboard_overview_editable. */}
                  <div className="min-w-0 flex-1 py-1 lg:px-2 lg:first:pl-0">
                    <div className="h-full overflow-hidden rounded-lg border border-[var(--portal-sidebar-border)]">
                      <div
                        className={`h-1 w-full ${
                          step.state === "complete"
                            ? "bg-emerald-500"
                            : step.state === "progress"
                              ? "bg-[var(--portal-accent-blue)]"
                              : "bg-[#c9ced6]"
                        }`}
                      />
                      <div className="flex flex-col items-center px-3 py-3.5 text-center">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold text-white ${
                              step.state === "complete"
                                ? "bg-emerald-500"
                                : step.state === "progress"
                                  ? "bg-[var(--portal-accent-blue)]"
                                  : "bg-[#c9ced6]"
                            }`}
                          >
                            {step.n}
                          </span>
                          <StepIcon
                            className="h-4 w-4 text-[var(--portal-muted)]"
                            strokeWidth={2}
                          />
                        </div>
                        <p className="mt-2.5 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                          {step.title}
                        </p>
                        <p className="mt-1 text-[0.6875rem] leading-snug text-[var(--portal-muted)]">
                          {step.body}
                        </p>
                        <StatusPill state={step.state} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--portal-accent-blue-soft)] px-4 py-2.5 text-[0.75rem]">
            <p className="font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Decisions Due:{" "}
              <span className="font-normal normal-case text-[var(--portal-ink)]">
                —
              </span>
            </p>
            <p className="font-semibold text-[var(--portal-accent-blue)]">
              Time Remaining: —
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Key Snapshot{" "}
              <span className="font-normal normal-case text-[var(--portal-muted)]">
                (End of Last Round)
              </span>
            </h2>
            <Link
              href={
                latestClosed
                  ? `/sessions/${active.id}/reports`
                  : "/sessions/class-performance/analytics"
              }
              className="text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View Full Report
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="min-w-0 rounded-lg border border-[var(--portal-sidebar-border)] bg-[#fafbfc] px-2.5 py-2.5"
                >
                  <div className="flex items-start gap-1 text-[0.5625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                    <Icon className={`h-3 w-3 shrink-0 ${m.iconClass}`} strokeWidth={2} />
                    <span className="leading-tight">{m.label}</span>
                  </div>
                  <p className="mt-1.5 whitespace-nowrap text-lg font-bold leading-none tabular-nums text-[var(--portal-title)]">
                    {m.value}
                  </p>
                  <p className="mt-1 text-[0.625rem] text-[var(--portal-muted)]">
                    {m.value === "—" && !snap ? "No results yet" : snapshotFootnote}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs text-[var(--portal-muted)]">
              <span className="flex items-baseline gap-3">
                <span className="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                  Simulation Progress
                </span>
                <span>
                  Round{" "}
                  {Math.min(active.completedRounds + (open ? 1 : 0), totalRounds) || 0} of{" "}
                  {totalRounds || "—"}
                </span>
              </span>
              <span className="font-semibold text-[var(--portal-accent-blue)]">
                {progressPct}% Complete
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#f1f3f5]">
              <div
                className="h-full rounded-full bg-[var(--portal-accent-blue)]"
                style={{ width: `${Math.max(progressPct, progressPct === 0 ? 0 : 4)}%` }}
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--portal-brand)]/30 bg-[var(--portal-brand-soft)] px-4 py-3">
          <div className="flex items-start gap-2.5 text-sm text-[#6f5a31]">
            <Bell
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-brand)]"
              strokeWidth={2}
            />
            <p>
              <span className="font-bold uppercase tracking-wide text-[var(--portal-title)]">
                Important
              </span>{" "}
              You control when rounds open, close, and process. Configuration
              changes apply to future rounds only — completed rounds stay frozen.
            </p>
          </div>
          <Link
            href="/sessions/professor-resources/guide"
            className="rounded-md border border-[var(--portal-brand)] px-3 py-1.5 text-xs font-bold text-[var(--portal-brand)]"
          >
            View Professor Guide
          </Link>
        </div>
        </div>

      <aside className="space-y-4 lg:sticky lg:top-[calc(var(--portal-topbar-height)+1rem)]">
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
          <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Next Actions
          </h2>
          <ul className="mt-3 space-y-3">
            {nextActions.slice(0, 3).map((action) => (
              <li
                key={action.title}
                className="rounded-lg border border-[var(--portal-sidebar-border)] p-3"
              >
                <p className="text-sm font-semibold text-[var(--portal-title)]">
                  {action.title}
                </p>
                <p className="mt-0.5 text-[0.6875rem] text-[var(--portal-muted)]">
                  {action.body}
                </p>
                <Link href={action.href} className="mt-2 block">
                  {action.primary ? (
                    <Button variant="orange" className="w-full">
                      {action.label}
                    </Button>
                  ) : (
                    <span className="inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]">
                      {action.label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
          <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Team Snapshot
          </h2>
          {active.teams.length > 0 ? (
            <>
              <p className="mt-2 text-base font-bold text-[var(--portal-title)]">
                {selectedTeam?.name ?? "—"}
              </p>
              {active.teams.length > 1 ? (
                <select
                  className="mt-2 w-full rounded-md border border-[var(--portal-sidebar-border)] bg-white px-2 py-1.5 text-sm"
                  value={selectedTeam?.id ?? ""}
                  onChange={(e) => setTeamId(e.target.value)}
                >
                  {active.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--portal-muted)]">
              No teams enrolled yet.
            </p>
          )}
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--portal-muted)]">Team Performance</dt>
              <dd className="font-medium">
                {selectedTeam?.lastScore != null
                  ? selectedTeam.lastScore.toFixed(1)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--portal-muted)]">Rank in Class</dt>
              <dd className="font-medium">{selectedRank || "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--portal-muted)]">Teams in Class</dt>
              <dd className="font-medium">{active.teamCount || "—"}</dd>
            </div>
          </dl>
          <Link
            href={`/sessions/${active.id}/leaderboard`}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
          >
            <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.75} />
            View Leaderboard
          </Link>
        </section>
      </aside>
      </div>
    </div>
  );
}
