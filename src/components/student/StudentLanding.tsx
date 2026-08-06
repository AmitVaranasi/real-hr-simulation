"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  CheckCircle2,
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
import { formatCurrency } from "@/lib/utils";

type OpenRound = {
  id: string;
  round_number: number;
  round_type: string;
  status: string;
  economy_condition: string;
};

type DecisionStatus = {
  is_submitted: boolean;
  exists: boolean;
} | null;

const STRATEGY_BLURBS: Record<string, string> = {
  Focus: "Operational Excellence",
  "Cost Leadership": "Efficiency Focus",
  Differentiation: "Quality & Brand",
  Innovation: "R&D Advantage",
  "Customer Intimacy": "Service Excellence",
};

const ECONOMY_BLURBS: Record<string, string> = {
  normal: "Stable Environment",
  boom: "Expansion Environment",
  recession: "Constrained Environment",
};

export type StudentLandingProps = {
  displayName: string;
  sessionName: string;
  announcement: string | null;
  team: {
    id: string;
    name: string;
    industry: string;
    strategy: string;
    headcount: number | null;
    revenue: number | null;
    stock_price: number | null;
    budget_carryover: number;
  };
  budgetBase: number;
  roundsTotal: number;
  roundsCompleted: number;
  lastScore: number | null;
  lastSummary: string | null;
  lastProfit: number | null;
  teamsInClass: number | null;
  initialOpenRound: OpenRound | null;
  initialDecision: DecisionStatus;
};

function StatusPill({
  state,
}: {
  state: "complete" | "progress" | "pending" | "locked";
}) {
  if (state === "complete") {
    return (
      <span className="mt-2 inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        ✓ Complete
      </span>
    );
  }
  if (state === "progress") {
    return (
      <span className="mt-2 inline-flex items-center rounded-md border border-blue-300 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
        • In Progress
      </span>
    );
  }
  if (state === "locked") {
    return (
      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--portal-muted)]">
        <Lock className="h-3 w-3" /> Locked
      </span>
    );
  }
  return (
    <span className="mt-2 inline-flex text-[11px] font-semibold text-[var(--portal-muted)]">
      - Pending
    </span>
  );
}

export function StudentLanding({
  displayName: _displayName,
  sessionName: _sessionName,
  announcement,
  team,
  budgetBase,
  roundsTotal,
  roundsCompleted,
  lastScore,
  lastSummary: _lastSummary,
  lastProfit,
  teamsInClass,
  initialOpenRound,
  initialDecision,
}: StudentLandingProps) {
  const [openRound, setOpenRound] = useState(initialOpenRound);
  const [decision, setDecision] = useState(initialDecision);
  const [checking, setChecking] = useState(false);

  const availableBudget = budgetBase + team.budget_carryover;
  const budgetPct =
    availableBudget > 0
      ? Math.min(100, Math.round((availableBudget / availableBudget) * 100))
      : 100;

  const fetchStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/student/dashboard", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setOpenRound(data.openRound ?? null);
      setDecision(data.decision ?? null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    setOpenRound(initialOpenRound);
    setDecision(initialDecision);
  }, [initialOpenRound, initialDecision]);

  useEffect(() => {
    const interval = setInterval(() => void fetchStatus(), 5000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchStatus();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchStatus]);

  const decisionsHref = openRound
    ? `/round/${openRound.id}/decisions`
    : "/decisions";
  const reviewHref = openRound
    ? `/round/${openRound.id}/review`
    : "/review";
  const resultsHref = openRound
    ? `/round/${openRound.id}/results`
    : "/reports/workforce-brief";

  const roundOpenDone = Boolean(openRound);
  const decisionsInProgress = Boolean(openRound) && !decision?.is_submitted;
  const decisionsDone = Boolean(decision?.is_submitted);
  const reviewPending = Boolean(openRound) && !decision?.is_submitted;
  const resultsLocked = true;

  const progressPct =
    roundsTotal > 0
      ? Math.min(100, Math.round((roundsCompleted / roundsTotal) * 100))
      : 0;

  const roundTitle = openRound
    ? `${openRound.round_type === "practice" ? "Practice" : "Competition"} Round ${openRound.round_number}`
    : "No Round Open";

  const decisionStateLabel = !openRound
    ? "Waiting for instructor"
    : decision?.is_submitted
      ? "Submitted"
      : decision?.exists
        ? "Decisions in Progress"
        : "Ready to start";

  const statusCards = [
    {
      label: "Round",
      icon: CalendarDays,
      iconClass: "text-[var(--portal-icon-blue)]",
      value: openRound ? `${roundTitle} (OPEN)` : "—",
      sub: openRound ? decisionStateLabel : "Waiting for instructor",
    },
    {
      label: "Industry",
      icon: Factory,
      iconClass: "text-[var(--portal-icon-green)]",
      value: team.industry,
      sub: "Competitive Intensity: Medium",
    },
    {
      label: "Strategy",
      icon: Target,
      iconClass: "text-[var(--portal-icon-blue)]",
      value: team.strategy,
      sub: STRATEGY_BLURBS[team.strategy] ?? "Strategic focus",
    },
    {
      label: "Economy",
      icon: Globe2,
      iconClass: "text-[var(--portal-icon-purple)]",
      value: openRound
        ? openRound.economy_condition.charAt(0).toUpperCase() +
          openRound.economy_condition.slice(1)
        : "—",
      sub: openRound
        ? ECONOMY_BLURBS[openRound.economy_condition] ?? "Environment"
        : "Set when round opens",
    },
    {
      label: "Discretionary HR Budget",
      icon: CircleDollarSign,
      iconClass: "text-[var(--portal-icon-blue)]",
      value: formatCurrency(availableBudget),
      sub:
        team.budget_carryover > 0
          ? `Includes ${formatCurrency(team.budget_carryover)} carryover`
          : "Full Budget Available",
    },
  ];

  const metrics = [
    {
      label: "Headcount",
      icon: Users,
      iconClass: "text-[var(--portal-icon-green)]",
      value: team.headcount ?? "—",
      sub: "vs Last Round",
    },
    {
      label: "Revenue",
      icon: CircleDollarSign,
      iconClass: "text-[var(--portal-icon-green)]",
      value: team.revenue != null ? formatCurrency(Number(team.revenue)) : "—",
      sub: "vs Last Round",
    },
    {
      label: "Operating Profit",
      icon: TrendingUp,
      iconClass: "text-[var(--portal-icon-blue)]",
      value: lastProfit != null ? formatCurrency(lastProfit) : "$—",
      sub: "vs Last Round",
    },
    {
      label: "Stock Price",
      icon: BarChart3,
      iconClass: "text-[var(--portal-icon-purple)]",
      value:
        team.stock_price != null
          ? `$${Number(team.stock_price).toFixed(2)}`
          : "—",
      sub: "vs Last Round",
    },
    {
      label: "HR Balance Scorecard",
      icon: Star,
      iconClass: "text-[var(--portal-icon-blue)]",
      value: lastScore != null ? lastScore.toFixed(1) : "—",
      sub: lastScore != null ? "Last round" : "No results yet",
    },
    {
      label: "HR Budget Remaining",
      icon: Briefcase,
      iconClass: "text-[var(--portal-icon-blue)]",
      value: formatCurrency(availableBudget),
      sub: `${budgetPct}% Available`,
    },
  ];

  const steps = [
    {
      n: 1,
      title: "Round Open",
      body: "Round is available. You can start making HR decisions.",
      state: roundOpenDone ? ("complete" as const) : ("pending" as const),
      icon: DoorOpen,
    },
    {
      n: 2,
      title: "HR Decisions",
      body: "Make decisions across seven HR areas.",
      state: decisionsDone
        ? ("complete" as const)
        : decisionsInProgress
          ? ("progress" as const)
          : ("pending" as const),
      icon: Users,
    },
    {
      n: 3,
      title: "Review & Submit",
      body: "Review all decisions and submit before deadline.",
      state: decisionsDone
        ? ("complete" as const)
        : reviewPending
          ? ("pending" as const)
          : ("pending" as const),
      icon: ClipboardList,
    },
    {
      n: 4,
      title: "Results",
      body: "Results available after instructor closes and computes round.",
      state: resultsLocked ? ("locked" as const) : ("pending" as const),
      icon: BarChart3,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-[var(--portal-title)]">
            {team.name} Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Here&apos;s where you are in the simulation and what&apos;s happening
            now.
          </p>
        </div>
        <Link
          href="/dashboard/getting-started"
          className="inline-flex items-center gap-2 rounded-md border border-[var(--portal-accent-blue)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
        >
          <PlayCircle className="h-4 w-4" strokeWidth={1.75} />
          How It Works
        </Link>
      </div>

      {/* 5-column status ribbon */}
      <div className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="grid sm:grid-cols-2 xl:grid-cols-5">
          {statusCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`px-4 py-3.5 ${
                  i < statusCards.length - 1
                    ? "xl:border-r xl:border-[var(--portal-sidebar-border)]"
                    : ""
                } ${i < 4 ? "border-b border-[var(--portal-sidebar-border)] xl:border-b-0" : ""}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                  <Icon
                    className={`h-3.5 w-3.5 ${card.iconClass}`}
                    strokeWidth={2}
                  />
                  {card.label}
                </div>
                <p className="mt-1.5 text-[13px] font-bold text-[var(--portal-title)]">
                  {card.value}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--portal-muted)]">
                  {card.sub}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {announcement && (
        <section className="rounded-xl border border-[var(--portal-primary)]/30 bg-[var(--portal-primary-soft)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--portal-primary)]">
            Professor announcement
          </h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--portal-title)]">
            {announcement}
          </p>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--portal-sidebar-border)] px-5 py-3">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                {openRound
                  ? `Round ${openRound.round_number} Status`
                  : "Round Status"}
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--portal-accent-blue)]">
                <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
                View Round Calendar
              </span>
            </div>
            <div className="grid gap-0 md:grid-cols-4">
              {steps.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.n}
                    className={`relative px-4 py-4 ${
                      i < 3
                        ? "md:border-r md:border-[var(--portal-sidebar-border)]"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-full text-[11px] font-bold ${
                          step.state === "complete"
                            ? "bg-emerald-100 text-emerald-700"
                            : step.state === "progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-[#f1f3f5] text-[var(--portal-muted)]"
                        }`}
                      >
                        <span className="leading-none">{step.n}</span>
                        <StepIcon className="mt-0.5 h-3 w-3" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                          {step.title}
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-[var(--portal-muted)]">
                          {step.body}
                        </p>
                        <StatusPill state={step.state} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--portal-accent-blue)]/20 bg-[var(--portal-accent-blue-soft)] px-5 py-2.5 text-[12px]">
              <p className="font-bold uppercase tracking-wide text-[var(--portal-title)]">
                Decisions Due:{" "}
                <span className="font-normal normal-case text-[var(--portal-muted)]">
                  Set by your instructor when the round opens
                </span>
              </p>
              <p className="text-[var(--portal-muted)]">
                {checking ? "Updating…" : "Time Remaining: —"}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                Company Snapshot (End of Last Round)
              </h2>
              <Link
                href="/reports/workforce-brief"
                className="text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
              >
                View Full Report →
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="rounded-lg border border-[var(--portal-sidebar-border)] bg-[#fafbfc] px-3 py-3"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                      <Icon
                        className={`h-3.5 w-3.5 ${m.iconClass}`}
                        strokeWidth={2}
                      />
                      {m.label}
                    </div>
                    <p className="mt-2 text-lg font-bold text-[var(--portal-title)]">
                      {m.value}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--portal-muted)]">
                      {m.sub}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-[var(--portal-muted)]">
                <span>
                  Simulation Progress · Round{" "}
                  {Math.min(roundsCompleted + (openRound ? 1 : 0), roundsTotal)}{" "}
                  of {roundsTotal}
                </span>
                <span className="font-semibold text-[var(--portal-accent-blue)]">
                  {progressPct}% Complete
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#f1f3f5]">
                <div
                  className="h-full rounded-full bg-[var(--portal-accent-blue)]"
                  style={{ width: `${Math.max(progressPct, 4)}%` }}
                />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--portal-primary)]/30 bg-[var(--portal-primary-soft)] px-4 py-3">
            <div className="flex items-start gap-2.5 text-sm text-[var(--portal-title)]">
              <Bell
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-primary)]"
                strokeWidth={2}
              />
              <p>
                <span className="font-bold uppercase tracking-wide">
                  Important.
                </span>{" "}
                Your instructor controls when rounds open and close. Submit your
                decisions before the deadline to avoid penalties.
              </p>
            </div>
            <Link
              href="/resources/reference"
              className="shrink-0 rounded-md border border-[var(--portal-primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]"
            >
              View Grading Policy
            </Link>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Next Actions
            </h2>
            <ul className="mt-3 space-y-3">
              <li className="rounded-lg border border-[var(--portal-sidebar-border)] p-3">
                <div className="flex items-start gap-2">
                  <Users
                    className="mt-0.5 h-4 w-4 text-[var(--portal-icon-blue)]"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--portal-title)]">
                      Make HR Decisions
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--portal-muted)]">
                      Allocate your budget across 7 HR areas.
                    </p>
                    <Link href={decisionsHref} className="mt-2 block">
                      <Button variant="default" className="w-full">
                        Continue to Decisions →
                      </Button>
                    </Link>
                  </div>
                </div>
              </li>
              <li className="rounded-lg border border-[var(--portal-sidebar-border)] p-3">
                <div className="flex items-start gap-2">
                  <ClipboardList
                    className="mt-0.5 h-4 w-4 text-[var(--portal-icon-blue)]"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--portal-title)]">
                      Review &amp; Submit
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--portal-muted)]">
                      Review your team&apos;s decisions before the deadline.
                    </p>
                    <Link
                      href={reviewHref}
                      className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
                    >
                      Go to Review &amp; Submit
                    </Link>
                  </div>
                </div>
              </li>
              <li className="rounded-lg border border-[var(--portal-sidebar-border)] p-3">
                <div className="flex items-start gap-2">
                  <Users
                    className="mt-0.5 h-4 w-4 text-[var(--portal-icon-blue)]"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--portal-title)]">
                      Team Discussion
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--portal-muted)]">
                      Collaborate with your team and finalize your strategy.
                    </p>
                    <Link
                      href="/team/members"
                      className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
                    >
                      View My Team
                    </Link>
                  </div>
                </div>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Team Snapshot
            </h2>
            <p className="mt-2 text-sm font-semibold text-[var(--portal-ink)]">
              {team.name}
            </p>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--portal-muted)]">Team Performance</dt>
                <dd className="font-medium">
                  {lastScore != null ? lastScore.toFixed(1) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--portal-muted)]">Rank in Class</dt>
                <dd className="font-medium">—</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--portal-muted)]">Teams in Class</dt>
                <dd className="font-medium">{teamsInClass ?? "—"}</dd>
              </div>
            </dl>
            <Link
              href="/leaderboard"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
            >
              <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.75} />
              View Leaderboard
            </Link>
            {!openRound && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => void fetchStatus()}
                disabled={checking}
              >
                {checking ? "Checking…" : "Check round status"}
              </Button>
            )}
            {decision?.is_submitted && (
              <Link
                href={resultsHref}
                className="mt-2 block text-center text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
              >
                View results when available →
              </Link>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
