"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  ExternalLink,
  Info,
  Lightbulb,
  Lock,
  Mail,
  Network,
  Play,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { YourSimulationPanel } from "@/components/student/shell/StudentShell";

export type GettingStartedProps = {
  displayName: string;
  firstName: string;
  hasTeam: boolean;
  teamName: string | null;
  courseLabel: string;
  industry: string | null;
  strategy: string | null;
  openRoundId: string | null;
  openRoundNumber: number | null;
  openRoundLabel: string;
  decisionDraft: boolean;
  decisionSubmitted: boolean;
  roundsCompleted: number;
};

type StepStatus = "complete" | "in_progress" | "not_started" | "upcoming" | "waiting";

type Step = {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
  icon: LucideIcon;
  actionHref?: string;
  actionLabel?: string;
  actionVariant?: "outline" | "orange";
  actionDisabled?: boolean;
  actionHint?: string;
};

function statusLabel(status: StepStatus, openRoundNumber: number | null) {
  if (status === "complete") return "Complete";
  if (status === "in_progress") {
    return openRoundNumber ? `Round ${openRoundNumber} Open` : "In Progress";
  }
  if (status === "waiting") return "Waiting for Instructor";
  return "Not Started";
}

function statusBadgeClass(status: StepStatus) {
  if (status === "complete") return "bg-emerald-50 text-emerald-700";
  if (status === "waiting") {
    return "bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]";
  }
  if (status === "in_progress" || status === "not_started") {
    return "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]";
  }
  return "bg-[#f1f3f5] text-[var(--portal-muted)]";
}

/** Soft filled circles with colored numerals — matches Cooper PNG */
function stepNumberClass(status: StepStatus) {
  if (status === "complete") return "bg-emerald-100 text-emerald-700";
  if (status === "waiting") {
    return "bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]";
  }
  if (status === "in_progress" || status === "not_started") {
    return "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]";
  }
  return "bg-[#eef0f3] text-[var(--portal-muted)]";
}

function StatusBadge({
  status,
  openRoundNumber,
}: {
  status: StepStatus;
  openRoundNumber: number | null;
}) {
  const label = statusLabel(status, openRoundNumber);
  return (
    <span
      className={`inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md px-3 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(status)}`}
    >
      {status === "complete" ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : status === "waiting" ? (
        <Clock3 className="h-3.5 w-3.5" />
      ) : status === "in_progress" ? (
        <Circle className="h-3 w-3 fill-current" />
      ) : (
        <Circle className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}

const outlineBlueClass =
  "border-[var(--portal-primary)]/40 bg-white text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]";

export function GettingStarted({
  firstName,
  hasTeam,
  teamName,
  courseLabel,
  industry,
  strategy,
  openRoundId,
  openRoundNumber,
  openRoundLabel,
  decisionDraft,
  decisionSubmitted,
  roundsCompleted,
}: GettingStartedProps) {
  const briefDone = hasTeam && (roundsCompleted > 0 || decisionDraft || decisionSubmitted);
  const exploreDone = hasTeam && (decisionDraft || decisionSubmitted || roundsCompleted > 0);

  const steps: Step[] = [
    {
      id: 1,
      title: "Welcome & Orientation",
      description:
        "Learn how the Real HR Simulation works, including rounds, budgets, decisions, results, and the decision-learning cycle.",
      status: "complete",
      icon: BookOpen,
      actionHref: "/resources/reference",
      actionLabel: "Review Again",
      actionVariant: "outline",
    },
    {
      id: 2,
      title: "Join Your Company Team",
      description: hasTeam
        ? `Confirm your company (${teamName}), view teammates, and make sure you are ready to collaborate.`
        : "Enter the join code from your instructor to join a company team.",
      status: hasTeam ? "complete" : "not_started",
      icon: Users,
      actionHref: hasTeam ? "/team/members" : "/join",
      actionLabel: hasTeam ? "Manage Team" : "Join Your Team",
      actionVariant: "outline",
    },
    {
      id: 3,
      title: "Review Industry & Strategy Brief",
      description:
        "Understand your industry environment, competitive landscape, and strategic priorities before making HR decisions.",
      status: !hasTeam ? "upcoming" : briefDone ? "complete" : "not_started",
      icon: ClipboardList,
      actionHref: hasTeam ? "/team/industry-strategy" : undefined,
      actionLabel: hasTeam ? "Open Brief" : undefined,
      actionVariant: "outline",
    },
    {
      id: 4,
      title: "Explore Your HR Decision Environment",
      description:
        "Learn about the seven HR decision areas, how they are connected, and how your choices can impact results.",
      status: !hasTeam ? "upcoming" : exploreDone ? "complete" : "not_started",
      icon: Network,
      actionHref: hasTeam ? "/learn/recruitment" : undefined,
      actionLabel: hasTeam ? "Explore HR Areas" : undefined,
      actionVariant: "outline",
    },
    {
      id: 5,
      title: "Enter the Simulation",
      description: openRoundId
        ? decisionSubmitted
          ? "Your team has submitted this round. Continue to the Dashboard while you wait for results."
          : "Begin making HR decisions now that your instructor has opened the round."
        : "Begin making HR decisions when your instructor opens the round.",
      status: !hasTeam
        ? "upcoming"
        : openRoundId
          ? decisionSubmitted
            ? "complete"
            : "in_progress"
          : "waiting",
      icon: Play,
      actionHref: hasTeam && openRoundId ? `/round/${openRoundId}/decisions` : undefined,
      actionLabel: openRoundId
        ? openRoundNumber
          ? `Begin Round ${openRoundNumber} →`
          : "Begin Round →"
        : "Enter Simulation",
      actionVariant: "orange",
      actionDisabled: !hasTeam || !openRoundId,
      actionHint:
        !openRoundId && hasTeam
          ? "Round will open when your instructor is ready."
          : undefined,
    },
  ];

  const actionBtnClass = `h-8 w-full ${outlineBlueClass}`;
  const orangeBtnClass = "h-8 w-full";

  return (
    <div className="space-y-5">
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
        <header className="flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-[var(--portal-title)] sm:text-[30px] sm:leading-tight">
            Welcome, {firstName} 👋
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--portal-muted)]">
            Let&apos;s get you ready to lead your organization. Follow the steps below to
            prepare for your first round.
          </p>
        </header>

        <YourSimulationPanel
          company={teamName ?? "Not joined"}
          course={courseLabel || "—"}
          industry={industry ?? "—"}
          strategy={strategy ?? "—"}
          roundLabel={openRoundLabel}
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
            <div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-[var(--portal-brand)] text-[var(--portal-brand)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--portal-brand)]">
                  Getting Started
                </h2>
              </div>
              <p className="mt-1 text-sm text-[var(--portal-muted)]">
                Complete these steps to prepare for the simulation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[var(--portal-muted)]">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Complete
              </span>
              <span className="inline-flex items-center gap-1">
                <Circle className="h-3.5 w-3.5 fill-[var(--portal-primary)] text-[var(--portal-primary)]" />
                In Progress
              </span>
              <span className="inline-flex items-center gap-1">
                <Circle className="h-3.5 w-3.5 text-[var(--portal-muted)]" />
                Not Started
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5 text-[var(--portal-brand)]" />
                Waiting
              </span>
            </div>
          </div>

          <ol className="mt-4 divide-y divide-[var(--portal-sidebar-border)] border-t border-[var(--portal-sidebar-border)]">
            {steps.map((step) => {
              const Icon = step.icon;
              const showAction = Boolean(step.actionLabel);
              const isLockedOrange =
                step.actionVariant === "orange" && step.actionDisabled;

              return (
                <li key={step.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${stepNumberClass(step.status)}`}
                      >
                        {step.id}
                      </span>
                      <span
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center ${
                          step.status === "complete"
                            ? "text-emerald-600"
                            : step.status === "waiting"
                              ? "text-[var(--portal-brand)]"
                              : step.status === "upcoming"
                                ? "text-[var(--portal-muted)]"
                                : "text-[var(--portal-primary)]"
                        }`}
                      >
                        <Icon className="h-7 w-7" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 pl-0.5">
                        <h3 className="text-sm font-bold text-[var(--portal-title)]">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--portal-muted)]">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-[168px]">
                      <StatusBadge
                        status={step.status}
                        openRoundNumber={openRoundNumber}
                      />
                      {showAction ? (
                        step.actionHref && !step.actionDisabled ? (
                          <Link href={step.actionHref} className="block w-full">
                            <Button
                              size="sm"
                              variant={
                                step.actionVariant === "orange" ? "orange" : "outline"
                              }
                              className={
                                step.actionVariant === "orange"
                                  ? orangeBtnClass
                                  : actionBtnClass
                              }
                            >
                              {step.actionLabel}
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            size="sm"
                            variant={
                              step.actionVariant === "orange" ? "orange" : "outline"
                            }
                            disabled={step.actionDisabled}
                            className={
                              isLockedOrange
                                ? `${orangeBtnClass} cursor-not-allowed opacity-95`
                                : actionBtnClass
                            }
                          >
                            {isLockedOrange ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5" />
                                {step.actionLabel}
                              </span>
                            ) : (
                              step.actionLabel
                            )}
                          </Button>
                        )
                      ) : null}
                      {step.actionHint ? (
                        <p className="text-center text-[11px] leading-snug text-[var(--portal-muted)]">
                          {step.actionHint}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mx-5 mb-5 mt-1 flex items-start gap-3 rounded-lg bg-[var(--portal-primary-soft)] px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-primary)]" />
            <p className="text-sm leading-relaxed text-[var(--portal-ink)]">
              <span className="font-semibold">Important:</span> Your instructor controls
              when rounds open and close. Complete the steps above to be ready so your
              team can make the most of each round.
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl bg-[var(--portal-navy)] p-5 text-white">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/80">
              What to Expect
            </h2>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2f6fed]/25 text-[#6aa1ff]">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Make Decisions</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/70">
                    Allocate your discretionary HR budget across seven HR areas each
                    round.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <BarChart3 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">See Results</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/70">
                    Your decisions influence your workforce, strategy execution, and
                    financial performance.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--portal-brand)]/20 text-[var(--portal-brand)]">
                  <Lightbulb className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Learn &amp; Improve</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/70">
                    Review feedback and reports, discuss with your team, and improve in
                    the next round.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--portal-title)]">
              Need Help?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--portal-muted)]">
              Visit the Help Center for guides, videos, and FAQs.
            </p>
            <Link href="/help" className="mt-3 inline-block">
              <Button size="sm" variant="outline" className={outlineBlueClass}>
                <span className="inline-flex items-center gap-1.5">
                  Go to Help Center
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </Button>
            </Link>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--portal-title)]">
              Questions?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--portal-muted)]">
              Contact your instructor if you need assistance getting started.
            </p>
            <Link href="/team/instructor" className="mt-3 inline-block">
              <Button size="sm" variant="outline" className={outlineBlueClass}>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Message Instructor
                </span>
              </Button>
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
