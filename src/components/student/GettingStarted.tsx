"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export type GettingStartedProps = {
  displayName: string;
  hasTeam: boolean;
  teamName: string | null;
  industry: string | null;
  strategy: string | null;
  openRoundId: string | null;
  decisionDraft: boolean;
  decisionSubmitted: boolean;
  roundsCompleted: number;
};

type Step = {
  id: number;
  title: string;
  description: string;
  status: "complete" | "current" | "upcoming";
  actionHref?: string;
  actionLabel?: string;
};

export function GettingStarted({
  displayName,
  hasTeam,
  teamName,
  industry,
  strategy,
  openRoundId,
  decisionDraft,
  decisionSubmitted,
  roundsCompleted,
}: GettingStartedProps) {
  const steps: Step[] = [
    {
      id: 1,
      title: "Welcome & orientation",
      description:
        "You are entering an HR business simulation. Your team will allocate discretionary budget across recruitment, performance, training, relations, and compensation each round.",
      status: "complete",
    },
    {
      id: 2,
      title: "Join your company team",
      description: hasTeam
        ? `You are on ${teamName}. Industry: ${industry}. Strategy: ${strategy}.`
        : "Enter the join code from your instructor to join a team.",
      status: hasTeam ? "complete" : "current",
      actionHref: hasTeam ? undefined : "/join",
      actionLabel: hasTeam ? undefined : "Join a team",
    },
    {
      id: 3,
      title: "Review industry & strategy brief",
      description:
        "Understand how your industry norms and chosen strategy shape Balanced Scorecard weights before you decide.",
      status: !hasTeam
        ? "upcoming"
        : roundsCompleted > 0 || decisionDraft || decisionSubmitted
          ? "complete"
          : "current",
      actionHref: hasTeam ? "/dashboard" : undefined,
      actionLabel: hasTeam ? "Open dashboard" : undefined,
    },
    {
      id: 4,
      title: "Make HR decisions",
      description: openRoundId
        ? decisionSubmitted
          ? "Your team has submitted this round. Review forecasts anytime, then wait for results."
          : decisionDraft
            ? "A draft is saved. Continue editing or go to Review & Submit."
            : "A round is open. Enter decisions across the five HR modules."
        : "Waiting for your instructor to open a round.",
      status: !hasTeam
        ? "upcoming"
        : decisionSubmitted
          ? "complete"
          : openRoundId
            ? "current"
            : "upcoming",
      actionHref: openRoundId
        ? decisionDraft && !decisionSubmitted
          ? `/round/${openRoundId}/review`
          : `/round/${openRoundId}/decisions`
        : undefined,
      actionLabel: openRoundId
        ? decisionSubmitted
          ? "View decisions"
          : decisionDraft
            ? "Continue to Review"
            : "Continue Simulation"
        : undefined,
    },
    {
      id: 5,
      title: "Review results & learn",
      description:
        "After the round is closed and scored, study your BSC scorecard, feedback, and reports—then improve next round.",
      status: roundsCompleted > 0 ? "complete" : "upcoming",
      actionHref: roundsCompleted > 0 ? "/history" : undefined,
      actionLabel: roundsCompleted > 0 ? "View reports" : undefined,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Getting Started · Recommended
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Welcome, {displayName}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Here&apos;s how to get started. Complete the orientation steps below,
          then continue into decisions when your instructor opens a round.
        </p>
      </div>

      <ol className="mt-6 space-y-3">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              step.status === "current"
                ? "border-indigo-300 ring-1 ring-indigo-100"
                : "border-slate-200"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      step.status === "complete"
                        ? "bg-emerald-100 text-emerald-800"
                        : step.status === "current"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {step.status === "complete" ? "✓" : step.id}
                  </span>
                  <div>
                    <h2 className="font-semibold text-slate-900">{step.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                    step.status === "complete"
                      ? "bg-emerald-50 text-emerald-700"
                      : step.status === "current"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-slate-50 text-slate-500"
                  }`}
                >
                  {step.status === "complete"
                    ? "Complete"
                    : step.status === "current"
                      ? "Complete now"
                      : "Upcoming"}
                </span>
                {step.actionHref && step.actionLabel && (
                  <Link href={step.actionHref}>
                    <Button size="sm">{step.actionLabel}</Button>
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {openRoundId && (
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 text-white">
          <p className="text-sm font-medium text-slate-200">Ready to play</p>
          <p className="mt-1 text-lg font-semibold">
            Continue to your open round
          </p>
          <Link href={`/round/${openRoundId}/decisions`} className="mt-3 inline-block">
            <Button className="bg-white text-slate-900 hover:bg-slate-100">
              Continue Simulation →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
