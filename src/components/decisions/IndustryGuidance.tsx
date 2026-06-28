"use client";

import {
  DEFAULT_INDUSTRY_NORMS,
  MODULE_TAB_GUIDANCE,
  formatNormRange,
  type BudgetModuleKey,
} from "@/lib/engine/industry-norms";
import type { Industry } from "@/lib/engine/types";

interface IndustryGuidanceProps {
  industry: Industry;
  module: string;
}

export function IndustryGuidance({ industry, module }: IndustryGuidanceProps) {
  const keys = MODULE_TAB_GUIDANCE[module];
  if (!keys?.length) return null;

  const norms = DEFAULT_INDUSTRY_NORMS[industry];
  const lines = keys
    .map((key) => {
      const norm = norms[key as BudgetModuleKey];
      if (!norm) return null;
      return `${norm.label ?? key}: ${formatNormRange(norm)}`;
    })
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
      <p className="font-medium text-slate-700">
        Suggested industry range ({industry})
      </p>
      <ul className="mt-1 list-inside list-disc">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {norms.benefits_pct_of_comp && module === "Compensation" && (
        <p className="mt-1 text-xs text-slate-500">
          Benefits: {norms.benefits_pct_of_comp.min}%–
          {norms.benefits_pct_of_comp.max}% of salary
        </p>
      )}
    </div>
  );
}
