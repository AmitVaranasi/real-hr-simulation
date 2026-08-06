"use client";

import {
  DEFAULT_INDUSTRY_NORMS,
  MODULE_TAB_GUIDANCE,
  formatNormRange,
  type BudgetModuleKey,
} from "@/lib/engine/industry-norms";
import { getIndustryNormsResolved } from "@/lib/engine/simulation-config";
import type { Industry, Warning } from "@/lib/engine/types";

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

function statusClass(status: RangeStatus) {
  if (status === "within")
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "below")
    return "bg-[var(--portal-primary-soft)] text-[var(--portal-title)] border-[var(--portal-primary)]/30";
  if (status === "above")
    return "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)] border-[var(--portal-primary)]/40";
  return "bg-[var(--portal-page)] text-[var(--portal-muted)] border-[var(--portal-sidebar-border)]";
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
}

export function DecisionGuidance({
  industry,
  module,
  yourInvestmentPct,
  warnings,
}: DecisionGuidanceProps) {
  const keys = MODULE_TAB_GUIDANCE[module] ?? [];
  const norms =
    getIndustryNormsResolved()[industry] ?? DEFAULT_INDUSTRY_NORMS[industry];
  const primaryKey = keys[0] as BudgetModuleKey | undefined;
  const primaryNorm = primaryKey ? norms[primaryKey] : undefined;
  const status = rangeStatus(yourInvestmentPct, primaryNorm);

  const aliases = MODULE_WARNING_ALIASES[module] ?? [module, "Budget"];
  const filtered = warnings.filter(
    (w) =>
      aliases.some((a) => w.module.toLowerCase().includes(a.toLowerCase())) ||
      (w.module === "Budget" && w.severity === "critical")
  );

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--portal-primary)]">
          Decision Guidance
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass(status)}`}
          >
            {statusLabel(status)}
          </span>
          {yourInvestmentPct != null && primaryNorm ? (
            <span className="text-xs text-[var(--portal-muted)]">
              Your investment: {yourInvestmentPct.toFixed(1)}% of HR budget
              {primaryNorm ? ` · Suggested: ${formatNormRange(primaryNorm)}` : ""}
            </span>
          ) : (
            <span className="text-xs text-[var(--portal-muted)]">
              Suggested ranges for this module remain configurable until engine
              validation.
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-[var(--portal-ink)]">
          Consider whether your current investment supports your workforce needs,
          organizational strategy, and other HR priorities.
        </p>
      </div>

      {filtered.length > 0 && (
        <ul className="space-y-2">
          {filtered.map((w, i) => (
            <li
              key={`${w.module}-${i}`}
              className={`rounded-lg px-3 py-2 text-sm ${
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
  );
}
