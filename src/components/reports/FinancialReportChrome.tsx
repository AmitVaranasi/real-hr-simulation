"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, Download, Info } from "lucide-react";

export type FinancialRoundItem = {
  id: string;
  roundId: string;
  roundNumber: number;
  dateLabel: string;
  href: string;
};

export function formatMoneySigned(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatMoneyParens(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
  return value < 0 ? `(${formatted})` : formatted;
}

export function pctChange(current: number, prior: number) {
  if (prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

export function TrendBadge({
  change,
  unit = "%",
  invert = false,
}: {
  change: number | null;
  unit?: "%" | "pp" | "";
  invert?: boolean;
}) {
  if (change == null || Number.isNaN(change)) {
    return <span className="text-xs text-[var(--portal-muted)]">—</span>;
  }
  const favorable = invert ? change < 0 : change > 0;
  const color =
    Math.abs(change) < 0.05
      ? "text-[var(--portal-muted)]"
      : favorable
        ? "text-emerald-700"
        : "text-red-600";
  const arrow = change > 0 ? "▲" : change < 0 ? "▼" : "•";
  const sign = change > 0 ? "+" : "";
  const decimals = unit === "pp" || Math.abs(change) < 10 ? 1 : 1;
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {arrow} {sign}
      {change.toFixed(decimals)}
      {unit === "%" ? "%" : unit === "pp" ? " pp" : ""}
    </span>
  );
}

function padFinancialRounds(
  rounds: FinancialRoundItem[]
): Array<FinancialRoundItem & { placeholder?: boolean }> {
  const byNumber = new Map(rounds.map((r) => [r.roundNumber, r]));
  const maxShown = Math.max(
    5,
    ...rounds.map((r) => r.roundNumber),
    0
  );
  return Array.from({ length: maxShown }, (_, i) => {
    const n = i + 1;
    return (
      byNumber.get(n) ?? {
        id: `placeholder-${n}`,
        roundId: "",
        roundNumber: n,
        dateLabel: "—",
        href: "#",
        placeholder: true,
      }
    );
  });
}

export function FinancialReportChrome({
  reportLabel,
  rounds,
  selectedRoundId,
  title,
  subtitle,
  infoText,
  children,
  onDownloadPdf,
}: {
  reportLabel: string;
  rounds: FinancialRoundItem[];
  selectedRoundId?: string | null;
  title: string;
  subtitle: string;
  infoText: string;
  children: React.ReactNode;
  onDownloadPdf?: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid items-start gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[var(--portal-title)]">
            Financial Reports
          </h2>
          <p className="mt-1 text-xs text-[var(--portal-muted)]">
            Select a round to view results
          </p>
          <ul className="mt-4 space-y-2">
            {padFinancialRounds(rounds).map((r) => {
              const active = Boolean(
                r.roundId &&
                  (selectedRoundId
                    ? selectedRoundId === r.roundId
                    : r.roundId === rounds[0]?.roundId)
              );
              const inner = (
                <>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        active
                          ? "text-[var(--portal-primary)]"
                          : r.placeholder
                            ? "text-[var(--portal-muted)]"
                            : "text-[var(--portal-title)]"
                      }`}
                    >
                      {reportLabel} –
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        active
                          ? "text-[var(--portal-primary)]"
                          : r.placeholder
                            ? "text-[var(--portal-muted)]"
                            : "text-[var(--portal-title)]"
                      }`}
                    >
                      Round {r.roundNumber}
                    </p>
                    <p className="mt-1 text-[0.6875rem] text-[var(--portal-muted)]">
                      {r.dateLabel}
                    </p>
                  </div>
                  <ChevronRight
                    className={`mt-1 h-4 w-4 shrink-0 ${
                      active
                        ? "text-[var(--portal-primary)]"
                        : "text-[var(--portal-muted)]"
                    }`}
                  />
                </>
              );
              return (
                <li key={r.id}>
                  {r.placeholder ? (
                    <div className="flex items-start justify-between gap-2 rounded-lg border border-dashed border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-3 py-2.5">
                      {inner}
                    </div>
                  ) : (
                    <Link
                      href={r.href}
                      className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                        active
                          ? "border-[var(--portal-primary)] bg-[var(--portal-primary-soft)]"
                          : "border-[var(--portal-sidebar-border)] bg-[#f8fafc] hover:border-[var(--portal-primary)]/40"
                      }`}
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <Link
            href="/reports/workforce-brief"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--portal-primary)] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to The Workforce Brief
          </Link>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide text-[var(--portal-title)] sm:text-2xl">
                {title}
              </h1>
              <p className="mt-1 text-sm text-[var(--portal-muted)]">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => onDownloadPdf?.()}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-title)] hover:bg-[#f8fafc]"
            >
              <Download className="h-4 w-4" />
              Download PDF Report
            </button>
          </div>

          {children}

          <div className="flex gap-3 rounded-xl border border-[var(--portal-primary)]/20 bg-[var(--portal-primary-soft)] px-4 py-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--portal-primary)]" />
            <p className="text-xs leading-relaxed text-[var(--portal-ink)]">
              {infoText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SummaryMetricCard({
  label,
  value,
  priorLabel,
  change,
  icon,
  iconClass,
  valueClass,
  invertTrend,
  changeUnit = "%",
}: {
  label: string;
  value: string;
  priorLabel: string;
  change: number | null;
  icon: React.ReactNode;
  iconClass: string;
  valueClass?: string;
  invertTrend?: boolean;
  changeUnit?: "%" | "pp" | "";
}) {
  return (
    <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
            {label}
          </p>
          <p
            className={`mt-1 whitespace-nowrap text-xl font-bold tabular-nums ${valueClass ?? "text-[var(--portal-title)]"}`}
          >
            {value}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[0.6875rem] text-[var(--portal-muted)]">{priorLabel}</p>
      <div className="mt-1">
        <TrendBadge change={change} unit={changeUnit} invert={invertTrend} />
      </div>
    </div>
  );
}
