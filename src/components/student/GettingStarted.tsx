"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  YourSimulationPanel,
  StudentPageHeader,
} from "@/components/student/shell/StudentShell";

export type GettingStartedProps = {
  displayName: string;
  firstName: string;
  hasTeam: boolean;
  teamName: string | null;
  courseLabel: string;
  industry: string | null;
  strategy: string | null;
  openRoundId: string | null;
  openRoundLabel: string;
  decisionDraft: boolean;
  decisionSubmitted: boolean;
  roundsCompleted: number;
};

type StepStatus = "complete" | "current" | "upcoming" | "waiting";

type Step = {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
  actionHref?: string;
  actionLabel?: string;
};

function statusLabel(status: StepStatus) {
  if (status === "complete") return "Complete";
  if (status === "current") return "In Progress";
  if (status === "waiting") return "Waiting";
  return "Not Started";
}

function statusClass(status: StepStatus) {
  if (status === "complete") return "bg-emerald-100 text-emerald-800";
  if (status === "waiting") return "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]";
  if (status === "current") return "bg-sky-100 text-sky-800";
  return "bg-[#f1f3f5] text-[var(--portal-muted)]";
}

export function GettingStarted({
  firstName,
  hasTeam,
  teamName,
  courseLabel,
  industry,
  strategy,
  openRoundId,
  openRoundLabel,
  decisionDraft,
  decisionSubmitted,
  roundsCompleted,
}: GettingStartedProps) {
  const steps: Step[] = [
    {
      id: 1,
      title: "Welcome & Orientation",
      description:
        "Learn how the Real HR Simulation works, including rounds, budgets, decisions, results, and the decision-learning cycle.",
      status: "complete",
      actionHref: "/resources/reference",
      actionLabel: "Review Again",
    },
    {
      id: 2,
      title: "Join Your Company Team",
      description: hasTeam
        ? `Confirm your company (${teamName}), view teammates, and make sure you are ready to collaborate.`
        : "Enter the join code from your instructor to join a company team.",
      status: hasTeam ? "complete" : "current",
      actionHref: hasTeam ? "/team/members" : "/join",
      actionLabel: hasTeam ? "Manage Team" : "Join Your Team",
    },
    {
      id: 3,
      title: "Review Industry & Strategy Brief",
      description:
        "Understand your industry environment, competitive landscape, and strategic priorities before making HR decisions.",
      status: !hasTeam
        ? "upcoming"
        : roundsCompleted > 0 || decisionDraft || decisionSubmitted
          ? "complete"
          : "current",
      actionHref: hasTeam ? "/team/industry-strategy" : undefined,
      actionLabel: hasTeam ? "Open Brief" : undefined,
    },
    {
      id: 4,
      title: "Explore Your HR Decision Environment",
      description:
        "Learn about the seven HR decision areas, how they are connected, and how your choices can impact results.",
      status: !hasTeam
        ? "upcoming"
        : decisionDraft || decisionSubmitted || roundsCompleted > 0
          ? "complete"
          : "current",
      actionHref: "/learn/recruitment",
      actionLabel: "Explore Modules",
    },
    {
      id: 5,
      title: "Enter the Simulation",
      description: openRoundId
        ? decisionSubmitted
          ? "Your team has submitted this round. Continue to the Dashboard while you wait for results."
          : "A round is open. Continue to your Dashboard and HR Decisions."
        : "Waiting for your instructor to open a round.",
      status: !hasTeam
        ? "upcoming"
        : openRoundId
          ? decisionSubmitted
            ? "complete"
            : "current"
          : "waiting",
      actionHref: hasTeam ? "/dashboard" : undefined,
      actionLabel: hasTeam ? "Go to Dashboard" : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <StudentPageHeader
        title={`Welcome, ${firstName}`}
        subtitle="Let's get you ready to lead your organization. Follow the steps below to prepare for your first round."
      />

      <YourSimulationPanel
        company={teamName ?? "Not joined"}
        course={courseLabel || "—"}
        industry={industry ?? "—"}
        strategy={strategy ?? "—"}
        roundLabel={openRoundLabel}
      />

      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--portal-primary)]">
              Getting Started
            </h2>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              Complete these steps to prepare for the simulation.
            </p>
          </div>
          <p className="text-xs text-[var(--portal-muted)]">
            ✓ Complete · ◉ In Progress · ○ Not Started · ◷ Waiting
          </p>
        </div>

        <ol className="mt-5 space-y-3">
          {steps.map((step) => (
            <li
              key={step.id}
              className="rounded-xl border border-[#f0f1f3] bg-[#f8fafc] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[var(--portal-title)]">
                      Step {step.id}. {step.title}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusClass(step.status)}`}
                    >
                      {statusLabel(step.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--portal-muted)]">{step.description}</p>
                </div>
                {step.actionHref && step.actionLabel ? (
                  <Link href={step.actionHref} className="shrink-0">
                    <Button size="sm" variant={step.status === "complete" ? "outline" : "default"}>
                      {step.actionLabel}
                    </Button>
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-[var(--portal-title)]">Need help?</h2>
        <p className="mt-2 text-sm text-[var(--portal-muted)]">
          Visit the Help Center for guides and FAQs, or open Resources for reference
          materials.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/help">
            <Button variant="outline" size="sm">
              Go to Help Center
            </Button>
          </Link>
          <Link href="/resources">
            <Button variant="outline" size="sm">
              Open Resources
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
