"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
  initialOpenRound: OpenRound | null;
  initialDecision: DecisionStatus;
};

export function StudentLanding({
  displayName,
  sessionName,
  announcement,
  team,
  budgetBase,
  roundsTotal,
  roundsCompleted,
  lastScore,
  lastSummary,
  initialOpenRound,
  initialDecision,
}: StudentLandingProps) {
  const [openRound, setOpenRound] = useState(initialOpenRound);
  const [decision, setDecision] = useState(initialDecision);
  const [checking, setChecking] = useState(false);

  const availableBudget = budgetBase + team.budget_carryover;

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

  const continueHref = openRound
    ? decision?.exists && !decision.is_submitted
      ? `/round/${openRound.id}/review`
      : `/round/${openRound.id}/decisions`
    : null;

  const continueLabel = !openRound
    ? null
    : decision?.is_submitted
      ? "View submitted decisions"
      : decision?.exists
        ? "Continue to Review & Submit"
        : "Continue Simulation";

  const progressPct =
    roundsTotal > 0
      ? Math.min(100, Math.round((roundsCompleted / roundsTotal) * 100))
      : 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Capsim-style welcome banner */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-900 px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {sessionName}
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Welcome to {team.name} Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Hello {displayName}. From Getting Started, review your team brief,
            then enter Decisions when a round is open.
          </p>
        </div>
        <div className="grid gap-0 sm:grid-cols-3">
          <div className="border-b border-slate-100 px-6 py-4 sm:border-b-0 sm:border-r">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Industry
            </p>
            <p className="mt-1 font-semibold text-slate-900">{team.industry}</p>
          </div>
          <div className="border-b border-slate-100 px-6 py-4 sm:border-b-0 sm:border-r">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Strategy
            </p>
            <p className="mt-1 font-semibold text-slate-900">{team.strategy}</p>
          </div>
          <div className="px-6 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Discretionary budget
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {formatCurrency(availableBudget)}
            </p>
            {team.budget_carryover > 0 && (
              <p className="text-xs text-slate-500">
                includes {formatCurrency(team.budget_carryover)} carryover
              </p>
            )}
          </div>
        </div>
      </section>

      {announcement && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <h2 className="text-sm font-semibold text-amber-900">
            Professor comments
          </h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-amber-950">
            {announcement}
          </p>
        </section>
      )}

      {/* Round timeline strip (Capsim-inspired) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {openRound
                ? `${openRound.round_type === "practice" ? "Practice" : "Competition"} Round ${openRound.round_number}`
                : "Round status"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {openRound
                ? `Economy: ${openRound.economy_condition} · Decisions: ${
                    decision?.is_submitted
                      ? "Submitted"
                      : decision?.exists
                        ? "Draft saved"
                        : "Not started"
                  }`
                : "No round is open. This page updates when your instructor opens one."}
              {checking && (
                <span className="ml-2 text-xs text-slate-400">Updating…</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {continueHref && continueLabel && (
              <Link href={continueHref}>
                <Button size="lg">{continueLabel} →</Button>
              </Link>
            )}
            {!openRound && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void fetchStatus()}
                disabled={checking}
              >
                {checking ? "Checking…" : "Check now"}
              </Button>
            )}
          </div>
        </div>

        {openRound && (
          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              {
                n: 1,
                title: "Start of round",
                body: "Students can enter decisions",
                done: true,
              },
              {
                n: 2,
                title: "Decisions due",
                body: decision?.is_submitted
                  ? "Submitted"
                  : "Submit before instructor closes",
                done: !!decision?.is_submitted,
              },
              {
                n: 3,
                title: "Results",
                body: "Available after close & compute",
                done: false,
              },
            ].map((step) => (
              <li
                key={step.n}
                className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {step.n}. {step.title}
                </p>
                <p className="mt-1 text-sm text-slate-700">{step.body}</p>
                <p
                  className={`mt-2 text-xs font-medium ${
                    step.done ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  {step.done ? "Complete" : "Pending"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Company snapshot</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Headcount</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">
                {team.headcount ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Revenue</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">
                {team.revenue != null
                  ? formatCurrency(Number(team.revenue))
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Stock</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">
                {team.stock_price != null
                  ? `$${Number(team.stock_price).toFixed(2)}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Last BSC</dt>
              <dd className="mt-1 text-lg font-semibold text-indigo-700">
                {lastScore != null ? lastScore.toFixed(1) : "—"}
              </dd>
            </div>
          </dl>
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                Simulation progress · {roundsCompleted} / {roundsTotal} rounds
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          {lastSummary && (
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {lastSummary}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Quick links</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/dashboard/getting-started"
                className="font-medium text-indigo-700 hover:underline"
              >
                Getting Started
              </Link>
            </li>
            {openRound && (
              <>
                <li>
                  <Link
                    href={`/round/${openRound.id}/decisions`}
                    className="font-medium text-indigo-700 hover:underline"
                  >
                    Decisions
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/round/${openRound.id}/review`}
                    className="font-medium text-indigo-700 hover:underline"
                  >
                    Review &amp; Submit
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link
                href="/history"
                className="font-medium text-indigo-700 hover:underline"
              >
                Reports
              </Link>
            </li>
            <li>
              <Link
                href="/leaderboard"
                className="font-medium text-indigo-700 hover:underline"
              >
                Leaderboard
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
