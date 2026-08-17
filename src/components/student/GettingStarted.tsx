"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
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

/** Figma: plain colored labels, no pill background */
function statusLabelClass(status: StepStatus) {
  if (status === "complete") return "text-[#0A8B4E]";
  if (status === "waiting") return "text-[var(--portal-brand)]";
  if (status === "in_progress" || status === "not_started") {
    return "text-[var(--portal-primary)]";
  }
  return "text-[var(--portal-muted)]";
}

function statusGlyphClass(status: StepStatus) {
  if (status === "complete") return "text-[#0A8B4E]";
  if (status === "waiting") return "text-[var(--portal-brand)]";
  if (status === "in_progress") return "text-[var(--portal-primary)]";
  return "text-[#60708F]";
}

/** 56px soft circles with large numerals — Figma #1:85/#1:96/#1:107/#1:118/#1:129 */
function stepNumberClass(status: StepStatus) {
  if (status === "complete") return "bg-[#EFF8EF] text-[#0A8B4E]";
  if (status === "waiting") return "bg-[#FFF1E8] text-[var(--portal-brand)]";
  if (status === "in_progress" || status === "not_started") {
    return "bg-[#EFF5FF] text-[var(--portal-primary)]";
  }
  return "bg-[#f1f3f5] text-[var(--portal-muted)]";
}

function statusIconClass(status: StepStatus) {
  if (status === "complete") return "text-[#0A8B4E]";
  if (status === "waiting") return "text-[var(--portal-brand)]";
  if (status === "upcoming") return "text-[var(--portal-muted)]";
  return "text-[var(--portal-primary)]";
}

function StatusLabel({
  status,
  openRoundNumber,
}: {
  status: StepStatus;
  openRoundNumber: number | null;
}) {
  const label = statusLabel(status, openRoundNumber);
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide ${statusLabelClass(status)}`}
    >
      {status === "complete" ? (
        <CheckCircle2 className={`h-3.5 w-3.5 ${statusGlyphClass(status)}`} />
      ) : status === "waiting" ? (
        <Clock3 className="h-3.5 w-3.5" />
      ) : status === "in_progress" ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <Circle className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}

const outlineBlueClass =
  "h-[37px] w-[116px] rounded-md border-[var(--portal-primary)]/60 bg-white text-xs font-bold text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]";

const orangeCtaClass =
  "h-[41px] w-[228px] rounded-lg text-[13px] font-bold shadow-sm";

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
          ? `Begin Round ${openRoundNumber}`
          : "Begin Round"
        : "Enter Simulation",
      actionVariant: "orange",
      actionDisabled: !hasTeam || !openRoundId,
      actionHint:
        !openRoundId && hasTeam
          ? "Round will open when your instructor is ready."
          : undefined,
    },
  ];

  const whatToExpect = [
    {
      icon: ClipboardList,
      title: "Make Decisions",
      body: "Allocate your discretionary HR budget across seven HR areas each round.",
    },
    {
      icon: BarChart3,
      title: "See Results",
      body: "Your decisions influence your workforce, strategy execution, and financial performance.",
    },
    {
      icon: Lightbulb,
      title: "Learn & Improve",
      body: "Review feedback and reports, discuss with your team, and improve in the next round.",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Figma #1:47-#1:72 — welcome text left, Your Simulation panel right */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
        <header className="shrink-0 xl:w-[355px] xl:pt-4">
          <h1 className="text-2xl font-bold leading-tight text-[var(--portal-title)] sm:text-[2.125rem]">
            Welcome, {firstName} 👋
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#24365A]">
            Let&apos;s get you ready to lead your organization.
          </p>
          <p className="text-[15px] leading-relaxed text-[#24365A]">
            Follow the steps below to prepare for your first round.
          </p>
        </header>
        <div className="min-w-0 flex-1">
          <YourSimulationPanel
            company={teamName ?? "Not joined"}
            course={courseLabel || "—"}
            industry={industry ?? "—"}
            strategy={strategy ?? "—"}
            roundLabel={openRoundLabel}
          />
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_var(--portal-right-rail)] xl:grid-cols-[minmax(0,1fr)_304px]">
        <div className="min-w-0">
          {/* Figma #1:73-#1:83 — section header with legend */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Star className="h-7 w-7 fill-[var(--portal-brand)] text-[var(--portal-brand)]" />
                <h2 className="text-[15px] font-bold uppercase tracking-wider text-[var(--portal-brand)]">
                  Getting Started
                </h2>
              </div>
              <p className="mt-1 text-[13px] text-[var(--portal-muted)]">
                Complete these steps to prepare for the simulation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs font-medium text-[var(--portal-title)]">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0A8B4E]" />
                Complete
              </span>
              <span className="inline-flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--portal-primary)]" />
                In Progress
              </span>
              <span className="inline-flex items-center gap-1">
                <Circle className="h-3 w-3 text-[#60708F]" />
                Not Started
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5 text-[var(--portal-brand)]" />
                Waiting
              </span>
            </div>
          </div>

          {/* Figma #1:84-#1:139 — five separate step cards */}
          <ol className="mt-3 space-y-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const showAction = Boolean(step.actionLabel);
              const isOrangeCta = step.actionVariant === "orange";
              const isLockedOrange = isOrangeCta && step.actionDisabled;

              return (
                <li
                  key={step.id}
                  className="flex flex-col gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-4 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <span
                      className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[26px] font-bold leading-none ${stepNumberClass(step.status)}`}
                    >
                      {step.id}
                    </span>
                    <span
                      className={`hidden shrink-0 sm:inline-flex ${statusIconClass(step.status)}`}
                    >
                      <Icon className="h-9 w-9" strokeWidth={1.25} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold text-[var(--portal-title)]">
                        {step.title}
                      </h3>
                      <p className="mt-1 max-w-[380px] text-[13px] leading-snug text-[var(--portal-title)]">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex shrink-0 flex-col items-center gap-2 ${
                      isOrangeCta ? "w-full sm:w-[228px]" : "w-full sm:w-[116px]"
                    }`}
                  >
                    <StatusLabel status={step.status} openRoundNumber={openRoundNumber} />
                    {showAction ? (
                      step.actionHref && !step.actionDisabled ? (
                        <Link href={step.actionHref} className="block w-full">
                          <Button
                            size="sm"
                            variant={isOrangeCta ? "orange" : "outline"}
                            className={
                              isOrangeCta ? orangeCtaClass : outlineBlueClass
                            }
                          >
                            {step.actionLabel}
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          variant={isOrangeCta ? "orange" : "outline"}
                          disabled={step.actionDisabled}
                          className={
                            isLockedOrange
                              ? `${orangeCtaClass} cursor-not-allowed`
                              : outlineBlueClass
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
                      <p className="max-w-[225px] text-center text-[11px] leading-snug text-[#34466A]">
                        {step.actionHint}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Figma #1:140-#1:146 — info banner */}
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#CFE0FF] bg-[#F6FAFF] px-4 py-3.5">
            <span className="mt-0.5 inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md bg-[var(--portal-primary)] text-white">
              <Info className="h-4 w-4" />
            </span>
            <p className="text-xs leading-relaxed text-[var(--portal-title)]">
              <span className="text-sm font-bold">Important:</span> Your instructor
              controls when rounds open and close. Complete the steps above to be ready
              so your team can make the most of each round.
            </p>
          </div>
        </div>

        {/* Figma #1:147-#1:179 — right rail */}
        <aside className="space-y-4">
          <section className="rounded-xl bg-[var(--portal-navy)] p-4 text-white">
            <h2 className="text-[15px] font-bold uppercase tracking-wider text-white/80">
              What to Expect
            </h2>
            <ul className="mt-3">
              {whatToExpect.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.title}
                    className={index > 0 ? "mt-3 border-t border-[#294274] pt-3" : ""}
                  >
                    <p className="flex items-center gap-2 text-sm font-bold">
                      <Icon className="h-4 w-4 text-white/70" strokeWidth={1.75} />
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-white/75">
                      {item.body}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-xl border border-[#E2E8F2] bg-[#F9FBFF] p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Need Help?
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--portal-title)]">
              Visit the Help Center for guides, videos, and FAQs.
            </p>
            <Link href="/help" className="mt-3 block">
              <Button
                size="sm"
                variant="outline"
                className="h-[39px] w-full rounded-lg border-[var(--portal-primary)]/60 bg-white text-[13px] font-bold text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]"
              >
                Go to Help Center
              </Button>
            </Link>

            <div className="my-4 border-t border-[#E2E8F2]" />

            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Questions?
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--portal-title)]">
              Contact your instructor if you need assistance getting started.
            </p>
            <Link href="/team/instructor" className="mt-3 block">
              <Button
                size="sm"
                variant="outline"
                className="h-[39px] w-full rounded-lg border-[var(--portal-primary)]/60 bg-white text-[13px] font-bold text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]"
              >
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
