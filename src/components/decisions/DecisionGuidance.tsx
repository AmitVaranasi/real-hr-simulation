"use client";

import { AlertTriangle, Lightbulb } from "lucide-react";
import {
  DEFAULT_INDUSTRY_NORMS,
  MODULE_TAB_GUIDANCE,
  formatNormRange,
  type BudgetModuleKey,
} from "@/lib/engine/industry-norms";
import { getIndustryNormsResolved } from "@/lib/engine/simulation-config";
import type { Industry, Warning } from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils";
import { IndustryGuidance } from "@/components/decisions/IndustryGuidance";

type RangeStatus = "within" | "below" | "above" | "unavailable";

function rangeStatus(
  pct: number | null,
  norm: { min?: number; max?: number; suggested?: [number, number] } | undefined
): RangeStatus {
  if (pct == null || !norm) return "unavailable";
  const low = norm.suggested?.[0] ?? norm.min;
  const high = norm.suggested?.[1] ?? norm.max;
  if (low != null && pct < low - 0.5) return "below";
  if (high != null && pct > high + 0.5) return "above";
  if (low != null || high != null) return "within";
  return "unavailable";
}

function statusLabel(status: RangeStatus) {
  if (status === "within") return "Within Suggested Range";
  if (status === "below") return "Below Suggested Range";
  if (status === "above") return "Above Suggested Range";
  return "Range Not Yet Validated";
}

function statusBannerClass(status: RangeStatus) {
  if (status === "within")
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "below") return "border-red-200 bg-red-50 text-red-800";
  if (status === "above") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-[var(--portal-sidebar-border)] bg-[var(--portal-page)] text-[var(--portal-muted)]";
}

/** Map DecisionForm module keys to warning module labels */
const MODULE_WARNING_ALIASES: Record<string, string[]> = {
  Recruitment: ["Recruitment", "Budget"],
  Performance: ["Performance", "Budget"],
  Training: ["Training", "Budget"],
  Relations: ["Relations", "Employee Relations", "Budget"],
  Compensation: ["Compensation", "Budget"],
  "Org Design": ["Org Design", "Organization", "Budget"],
  DEI: ["DEI", "Budget"],
};

interface DecisionGuidanceProps {
  industry: Industry;
  module: string;
  /** Current module spend as % of discretionary HR budget */
  yourInvestmentPct: number | null;
  warnings: Warning[];
  moduleSpend?: number;
  availableBudget?: number;
}

export function DecisionGuidance({
  industry,
  module,
  yourInvestmentPct,
  warnings,
  moduleSpend,
  availableBudget,
}: DecisionGuidanceProps) {
  const keys = MODULE_TAB_GUIDANCE[module] ?? [];
  const norms =
    getIndustryNormsResolved()[industry] ?? DEFAULT_INDUSTRY_NORMS[industry];
  const primaryKey = keys[0] as BudgetModuleKey | undefined;
  const primaryNorm = primaryKey ? norms[primaryKey] : undefined;
  const status = rangeStatus(yourInvestmentPct, primaryNorm);

  const aliases = MODULE_WARNING_ALIASES[module] ?? [module, "Budget"];
  const moduleAliases = aliases.filter((a) => a !== "Budget");
  const filtered = warnings.filter((w) => {
    const mod = w.module.toLowerCase();
    if (moduleAliases.some((a) => mod.includes(a.toLowerCase()))) return true;
    if (w.module === "Budget" && w.severity === "critical") return true;
    if (
      w.module === "Budget" &&
      moduleAliases.some((a) =>
        w.message.toLowerCase().includes(a.toLowerCase())
      )
    ) {
      return true;
    }
    return false;
  });

  const suggested = primaryNorm
    ? formatNormRange(primaryNorm)
    : null;
  const spendPct =
    moduleSpend != null && availableBudget != null
      ? (moduleSpend / Math.max(1, availableBudget)) * 100
      : yourInvestmentPct;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 border-b border-[var(--portal-sidebar-border)] px-3 py-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Lightbulb className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--portal-brand)]">
          Decision Guidance
        </p>
      </div>

      <div className="space-y-3 p-3">
        <div
          className={`rounded-lg border px-3 py-2.5 ${statusBannerClass(status)}`}
        >
          <p className="flex items-center gap-1.5 text-xs font-bold">
            {status === "below" || status === "above" ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            ) : null}
            {statusLabel(status)}
          </p>
          {yourInvestmentPct != null && suggested ? (
            <p className="mt-1 text-[0.6875rem] leading-relaxed opacity-90">
              Your {yourInvestmentPct.toFixed(1)}% investment is{" "}
              {status === "within"
                ? "within"
                : status === "below"
                  ? "below"
                  : status === "above"
                    ? "above"
                    : "outside"}{" "}
              the suggested {suggested} range for {industry}.
            </p>
          ) : (
            <p className="mt-1 text-[0.6875rem] leading-relaxed opacity-90">
              Suggested ranges for this module remain configurable until engine
              validation.
            </p>
          )}
        </div>

        <IndustryGuidance
          industry={industry}
          module={module}
          yourInvestmentPct={yourInvestmentPct}
          embedded
        />

        {moduleSpend != null ? (
          <div className="rounded-lg border border-[var(--portal-sidebar-border)] bg-[var(--portal-page)] px-3 py-2.5">
            <p className="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
              Module Investment
            </p>
            <p className="mt-1 text-[0.9375rem] font-bold text-[var(--portal-title)]">
              {formatCurrency(moduleSpend)}
              {spendPct != null ? (
                <span className="ml-1.5 text-sm font-semibold text-[var(--portal-muted)]">
                  | {spendPct.toFixed(1)}% of HR Budget
                </span>
              ) : null}
            </p>
            {primaryNorm && spendPct != null ? (
              <ModuleInvestmentMeter
                pct={spendPct}
                min={primaryNorm.suggested?.[0] ?? primaryNorm.min ?? 0}
                max={primaryNorm.suggested?.[1] ?? primaryNorm.max ?? 30}
              />
            ) : null}
          </div>
        ) : null}

        <p className="text-[0.6875rem] leading-relaxed text-[var(--portal-muted)]">
          Consider whether your current investment supports your workforce needs,
          organizational strategy, and other HR priorities.
        </p>

        {filtered.length > 0 && (
          <ul className="space-y-2">
            {filtered.map((w, i) => (
              <li
                key={`${w.module}-${i}`}
                className={`rounded-lg px-3 py-2 text-[0.75rem] ${
                  w.severity === "critical"
                    ? "bg-red-50 text-red-800"
                    : "bg-[var(--portal-primary-soft)] text-[var(--portal-title)]"
                }`}
              >
                <strong>{w.module}:</strong> {w.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ModuleInvestmentMeter({
  pct,
  min,
  max,
}: {
  pct: number;
  min: number;
  max: number;
}) {
  const scaleMax = Math.max(max * 1.4, pct * 1.1, 1);
  const rangeStart = (min / scaleMax) * 100;
  const rangeWidth = ((max - min) / scaleMax) * 100;
  const marker = Math.max(0, Math.min(100, (pct / scaleMax) * 100));

  return (
    <div className="relative mt-2.5 h-2 rounded-full bg-[#e5e9ef]">
      <div
        className="absolute top-0 h-2 rounded-full bg-emerald-200"
        style={{ left: `${rangeStart}%`, width: `${Math.max(4, rangeWidth)}%` }}
      />
      <div
        className="absolute -top-1 h-4 w-1 rounded-sm bg-[var(--portal-brand)]"
        style={{ left: `calc(${marker}% - 2px)` }}
        title={`${pct.toFixed(1)}%`}
      />
    </div>
  );
}
