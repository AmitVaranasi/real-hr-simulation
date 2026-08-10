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
  const equityCost = decision.equity_level * 10_000;
  const totalCompEstimate =
    basePayroll + benefitsCost + bonusCost + equityCost;
  const compRatio =
    revenue && revenue > 0 ? (totalCompEstimate / revenue) * 100 : null;

  const parts = [
    { label: "Base Payroll", sub: "(est.)", value: basePayroll },
    { label: "Benefits Cost", sub: "(est.)", value: benefitsCost },
    { label: "Bonus Pool", sub: "(est.)", value: bonusCost },
    { label: "Equity Cost", sub: "(est.)", value: equityCost },
  ];

  return (
    <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <p className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--portal-title)]">
        Compensation Economics
        <span className="ml-1.5 font-semibold normal-case tracking-normal text-[var(--portal-muted)]">
          (Estimated Annual Impact)
        </span>
      </p>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-2">
        {parts.map((part, i) => (
          <div key={part.label} className="flex min-w-0 flex-1 items-stretch gap-2">
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-[var(--portal-sidebar-border)] bg-[var(--portal-page)] px-3 py-4 text-center">
              <p className="text-[0.6875rem] font-semibold text-[var(--portal-muted)]">
                {part.label}
              </p>
              <p className="text-[0.625rem] text-[var(--portal-muted)]">{part.sub}</p>
              <p className="mt-2 text-sm font-bold text-[var(--portal-title)]">
                {formatCurrency(part.value)}
              </p>
            </div>
            {i < parts.length - 1 ? (
              <span className="hidden self-center text-lg font-bold text-[var(--portal-muted)] lg:inline">
                +
              </span>
            ) : (
              <span className="hidden self-center text-lg font-bold text-[var(--portal-muted)] lg:inline">
                =
              </span>
            )}
          </div>
        ))}

        <div className="flex min-w-[160px] flex-col items-center justify-center rounded-xl border-2 border-red-200 bg-red-50/60 px-4 py-4 text-center lg:min-w-[180px]">
          <p className="text-[0.6875rem] font-semibold text-[var(--portal-muted)]">
            Total Compensation
          </p>
          <p className="text-[0.625rem] text-[var(--portal-muted)]">(est.)</p>
          <p className="mt-2 text-lg font-bold text-[var(--portal-title)]">
            {formatCurrency(totalCompEstimate)}
          </p>
          {compRatio != null ? (
            <>
              <p className="mt-3 text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                Compensation Ratio
              </p>
              <p className="text-xs font-semibold text-[var(--portal-title)]">
                {compRatio.toFixed(1)}% of Revenue
              </p>
            </>
          ) : null}
          {budget.compensation_spend > 0 ? (
            <p className="mt-2 text-[0.625rem] text-[var(--portal-muted)]">
              Discretionary HR spend: {formatCurrency(budget.compensation_spend)}
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-[0.6875rem] text-[var(--portal-muted)]">
        Estimates update as you change your decisions.
      </p>
    </div>
  );
}
