"use client";

import type { BudgetBreakdown, Decision } from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils";

interface CompensationBreakdownProps {
  decision: Decision;
  budget: BudgetBreakdown;
  headcount: number;
  marketSalary: number;
  revenue?: number;
}

/** Figma "Project_Alfa_Review_and_Submit" #1:180-#1:209 */
export function CompensationBreakdown({
  decision,
  budget,
  headcount,
  marketSalary,
  revenue,
}: CompensationBreakdownProps) {
  const basePayroll = headcount * marketSalary;
  const benefitsCost = basePayroll * (decision.benefits_pct / 100);
  const bonusCost = basePayroll * (decision.bonus_tier / 100);
  const discretionaryComp = budget.compensation_spend;
  const totalCompEstimate =
    basePayroll + benefitsCost + bonusCost + discretionaryComp;
  const compRatio =
    revenue && revenue > 0 ? (totalCompEstimate / revenue) * 100 : null;

  const parts = [
    { label: "Base Payroll", sub: "(est.)", value: basePayroll },
    { label: "Benefits Cost", sub: "(est.)", value: benefitsCost },
    { label: "Bonus Pool", sub: "(est.)", value: bonusCost },
    { label: "Discretionary Comp", sub: "(Budget)", value: discretionaryComp },
  ];

  return (
    <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <p className="text-[13px] font-bold text-[var(--portal-title)]">
        Compensation Economics{" "}
        <span className="text-[9px] font-normal text-[#34466A]">
          (Estimated Annual Impact)
        </span>
      </p>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-2">
        {parts.map((part, i) => (
          <div key={part.label} className="flex min-w-0 flex-1 items-stretch gap-2">
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-[#E6EBF2] bg-white px-3 py-4 text-center">
              <p className="text-[10px] text-[#34466A]">{part.label}</p>
              <p className="text-[9px] text-[#34466A]">{part.sub}</p>
              <p className="mt-2 text-xs font-bold text-[var(--portal-title)]">
                {formatCurrency(part.value)}
              </p>
            </div>
            {i < parts.length - 1 ? (
              <span className="hidden self-center text-lg font-bold text-[var(--portal-title)] lg:inline">
                +
              </span>
            ) : (
              <span className="hidden self-center text-lg font-bold text-[var(--portal-title)] lg:inline">
                =
              </span>
            )}
          </div>
        ))}

        <div className="flex min-w-[170px] flex-col items-center justify-center rounded-lg border border-[#FFD6BD] bg-[#FFF8F2] px-4 py-4 text-center lg:min-w-[190px]">
          <p className="text-[10px] text-[#34466A]">Total Compensation</p>
          <p className="text-[9px] text-[#34466A]">(est.)</p>
          <p className="mt-2 text-[13px] font-bold text-[var(--portal-brand)]">
            {formatCurrency(totalCompEstimate)}
          </p>
          {compRatio != null ? (
            <>
              <p className="mt-3 text-[9px] text-[#34466A]">Compensation Ratio</p>
              <p className="text-[10px] font-bold text-[var(--portal-title)]">
                {compRatio.toFixed(1)}% of Revenue
              </p>
            </>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-[9px] text-[#34466A]">
        Estimates update as you change your decisions.
      </p>
    </div>
  );
}
