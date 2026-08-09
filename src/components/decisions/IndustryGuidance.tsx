"use client";

import {
  DEFAULT_INDUSTRY_NORMS,
  MODULE_TAB_GUIDANCE,
  formatNormRange,
  type BudgetModuleKey,
} from "@/lib/engine/industry-norms";
import { getIndustryNormsResolved } from "@/lib/engine/simulation-config";
import type { Industry } from "@/lib/engine/types";

interface IndustryGuidanceProps {
  industry: Industry;
  module: string;
  yourInvestmentPct?: number | null;
  /** When true, render without outer card chrome (inside Decision Guidance rail). */
  embedded?: boolean;
}

export function IndustryGuidance({
  industry,
  module,
  yourInvestmentPct = null,
  embedded = false,
}: IndustryGuidanceProps) {
  const keys = MODULE_TAB_GUIDANCE[module];
  if (!keys?.length) return null;

  const norms =
    getIndustryNormsResolved()[industry] ?? DEFAULT_INDUSTRY_NORMS[industry];
  const primaryKey = keys[0] as BudgetModuleKey;
  const primaryNorm = norms[primaryKey];
  if (!primaryNorm) return null;

  const suggested = primaryNorm.suggested;
  const min = suggested?.[0] ?? primaryNorm.min ?? 0;
  const max = suggested?.[1] ?? primaryNorm.max ?? 100;
  const your = yourInvestmentPct ?? null;
  const scaleMax = Math.max(max * 1.4, your != null ? your * 1.15 : 0, 1);
  const markerPct =
    your == null ? null : Math.max(0, Math.min(100, (your / scaleMax) * 100));
  const rangeStart = (min / scaleMax) * 100;
  const rangeWidth = ((max - min) / scaleMax) * 100;

  const body = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--portal-accent-blue)]">
        Industry Guidance
      </p>
      <p className="mt-1 text-[12px] font-semibold text-[var(--portal-ink)]">
        {industry} · {primaryNorm.label ?? module} Investment
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--portal-muted)]">
        Suggested Range: {formatNormRange(primaryNorm)}
      </p>

      {/* Caret sits above the track and points down AT the bar (not overlapping fill) */}
      <div className="relative mt-3">
        <div className="relative mb-0.5 h-2.5" aria-hidden={markerPct == null}>
          {markerPct != null && (
            <div
              className="pointer-events-none absolute bottom-0 z-10 flex flex-col items-center"
              style={{
                left: `${markerPct}%`,
                transform: "translateX(-50%)",
              }}
              title={`Your investment ${your?.toFixed(1)}%`}
            >
              <div className="h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-[var(--portal-brand)]" />
            </div>
          )}
        </div>
        <div className="relative h-2.5 rounded-full bg-[#e5e9ef]">
          <div
            className="absolute top-0 h-2.5 rounded-full bg-emerald-200"
            style={{
              left: `${rangeStart}%`,
              width: `${Math.max(4, rangeWidth)}%`,
            }}
          />
        </div>
      </div>
      <div className="mt-2 flex items-start justify-between gap-2 text-[10px]">
        <span className="font-medium text-[var(--portal-muted)]">
          Suggested Range
          <span className="mt-0.5 block font-semibold text-emerald-700">
            {formatNormRange(primaryNorm)}
          </span>
        </span>
        <span className="text-right font-semibold text-[var(--portal-brand)]">
          {your != null ? `${your.toFixed(1)}% Your Investment` : "Your Investment —"}
        </span>
      </div>

      {norms.benefits_pct_of_comp && module === "Compensation" && (
        <p className="mt-2 text-[11px] text-[var(--portal-muted)]">
          Benefits: {norms.benefits_pct_of_comp.min}%–
          {norms.benefits_pct_of_comp.max}% of salary
        </p>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="rounded-lg border border-[var(--portal-sidebar-border)] bg-[var(--portal-page)] px-3 py-2.5">
        {body}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-[var(--portal-sidebar-border)] bg-[var(--portal-page)] px-3 py-3 text-sm text-[var(--portal-muted)]">
      {body}
    </div>
  );
}
