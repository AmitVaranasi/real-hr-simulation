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
}

export function IndustryGuidance({
  industry,
  module,
  yourInvestmentPct = null,
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
  const markerPct =
    your == null ? null : Math.max(0, Math.min(100, (your / Math.max(max * 1.4, 1)) * 100));
  const rangeStart = (min / Math.max(max * 1.4, 1)) * 100;
  const rangeWidth = ((max - min) / Math.max(max * 1.4, 1)) * 100;

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
      <p className="text-xs font-bold uppercase tracking-wide text-[#2563eb]">
        Industry Guidance
      </p>
      <p className="mt-1 font-medium text-slate-800">
        {industry} · {primaryNorm.label ?? module} Investment (% of HR Budget)
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Suggested Range: {formatNormRange(primaryNorm)}
      </p>

      <div className="relative mt-3 h-2 rounded-full bg-slate-200">
        <div
          className="absolute top-0 h-2 rounded-full bg-[#c7e0f4]"
          style={{ left: `${rangeStart}%`, width: `${Math.max(4, rangeWidth)}%` }}
        />
        {markerPct != null && (
          <div
            className="absolute -top-1 h-4 w-1 rounded-full bg-[#e67e22]"
            style={{ left: `calc(${markerPct}% - 2px)` }}
            title={`Your investment ${your?.toFixed(1)}%`}
          />
        )}
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span>Suggested Range</span>
        <span className="font-semibold text-[#c45f12]">
          {your != null ? `▲ Your Investment ${your.toFixed(1)}%` : "Your Investment —"}
        </span>
      </div>

      {norms.benefits_pct_of_comp && module === "Compensation" && (
        <p className="mt-2 text-xs text-slate-500">
          Benefits: {norms.benefits_pct_of_comp.min}%–
          {norms.benefits_pct_of_comp.max}% of salary
        </p>
      )}
    </div>
  );
}
