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
    <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
      <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-[var(--portal-brand)]">
        HR Decisions {moduleIndex} of {moduleTotal}
      </p>
      <div className="flex flex-wrap items-stretch justify-end gap-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="min-w-[108px] rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <p className="flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                <Icon className={`h-3 w-3 ${c.iconClass}`} strokeWidth={2} />
                {c.label}
              </p>
              <p className="mt-0.5 text-[0.8125rem] font-semibold leading-tight text-[var(--portal-ink)]">
                {c.value}
                {c.badge ? (
                  <span className="ml-1.5 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide text-emerald-700">
                    {c.badge}
                  </span>
                ) : null}
              </p>
            </div>
          );
        })}
      </div>
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
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--portal-sidebar-border)] bg-white/95 backdrop-blur lg:left-[260px]">
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
