"use client";

import Link from "next/link";
import { CalendarDays, Check, Factory, Globe2, Target } from "lucide-react";

export function DecisionStatusStrip({
  roundLabel,
  roundOpen,
  industry,
  strategy,
  economy,
  moduleIndex,
  moduleTotal = 7,
}: {
  roundLabel: string;
  roundOpen: boolean;
  industry: string;
  strategy: string;
  economy: string;
  moduleIndex: number;
  moduleTotal?: number;
}) {
  const cards = [
    {
      label: "Round",
      value: roundLabel,
      badge: roundOpen ? "OPEN" : null,
      icon: CalendarDays,
      iconClass: "text-[var(--portal-icon-blue)]",
    },
    {
      label: "Industry",
      value: industry,
      icon: Factory,
      iconClass: "text-[var(--portal-icon-green)]",
    },
    {
      label: "Strategy",
      value: strategy,
      icon: Target,
      iconClass: "text-[var(--portal-icon-orange)]",
    },
    {
      label: "Economy",
      value: economy,
      icon: Globe2,
      iconClass: "text-[var(--portal-icon-purple)]",
    },
  ];

  return (
    <div className="flex min-w-0 shrink-0 items-start gap-2">
      <div className="flex flex-wrap justify-end gap-1.5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="min-w-[88px] rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-2 py-1.5"
            >
              <div className="flex items-center gap-1">
                <Icon className={`h-3 w-3 ${c.iconClass}`} strokeWidth={2} />
                <span className="text-[0.5625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                  {c.label}
                </span>
              </div>
              <p className="mt-0.5 text-[0.75rem] font-semibold leading-tight text-[var(--portal-ink)]">
                {c.value}
              </p>
              {c.badge ? (
                <span className="mt-0.5 inline-block rounded bg-emerald-100 px-1 py-px text-[0.5625rem] font-bold uppercase tracking-wide text-emerald-700">
                  {c.badge}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="w-[4.75rem] pt-0.5 text-right text-[0.5625rem] font-bold uppercase leading-snug tracking-[0.08em] text-[var(--portal-title)]">
        HR Decisions
        <br />
        {moduleIndex} of {moduleTotal}
      </p>
    </div>
  );
}

export function DecisionStickyFooter({
  saving,
  continueLabel,
  onSaveNow,
  onSaveAndContinue,
  dashboardHref = "/dashboard",
  continueHint,
  contentMaxClassName = "max-w-[1400px]",
}: {
  saving?: boolean;
  continueLabel: string;
  onSaveNow?: () => void;
  onSaveAndContinue?: () => void;
  dashboardHref?: string;
  continueHint?: string;
  /** Aligns footer content width with the page container (e.g. Review & Submit). */
  contentMaxClassName?: string;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--portal-sidebar-border)] bg-white/95 backdrop-blur lg:left-[var(--portal-sidebar-width)]">
      <div
        className={`mx-auto flex ${contentMaxClassName} flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6`}
      >
        <Link
          href={dashboardHref}
          className="inline-flex items-center rounded-md border border-[var(--portal-accent-blue)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
        >
          ← Dashboard
        </Link>
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          {saving ? "Saving…" : "All changes auto-saved"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {onSaveNow ? (
            <button
              type="button"
              onClick={onSaveNow}
              className="rounded-md border border-[var(--portal-accent-blue)] bg-white px-4 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
            >
              Save Now
            </button>
          ) : null}
          {onSaveAndContinue ? (
            <div className="flex flex-col items-end gap-0.5">
              <button
                type="button"
                onClick={onSaveAndContinue}
                className="rounded-md bg-[var(--portal-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--portal-brand-hover)]"
              >
                {continueLabel}
              </button>
              {continueHint ? (
                <p className="max-w-[260px] text-right text-[0.625rem] text-[var(--portal-muted)]">
                  {continueHint}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
