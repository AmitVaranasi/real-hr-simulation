"use client";

import type { BudgetBreakdown, Decision } from "@/lib/engine/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

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
  const discretionaryComp = budget.compensation_spend;
  const totalCompEstimate = basePayroll + benefitsCost + bonusCost + discretionaryComp;
  const compRatio =
    revenue && revenue > 0 ? (totalCompEstimate / revenue) * 100 : null;

  return (
    <div className="rounded-lg border border-[var(--portal-sidebar-border)] bg-[var(--portal-page)] p-4 text-sm">
      <p className="font-medium text-slate-800">Compensation economics</p>
      <dl className="mt-2 grid gap-1 sm:grid-cols-2">
        <dt className="text-[var(--portal-muted)]">Base payroll (est.)</dt>
        <dd className="font-medium">{formatCurrency(basePayroll)}</dd>
        <dt className="text-[var(--portal-muted)]">Benefits cost (est.)</dt>
        <dd className="font-medium">{formatCurrency(benefitsCost)}</dd>
        <dt className="text-[var(--portal-muted)]">Bonus pool (est.)</dt>
        <dd className="font-medium">{formatCurrency(bonusCost)}</dd>
        <dt className="text-[var(--portal-muted)]">Discretionary comp (budget)</dt>
        <dd className="font-medium">{formatCurrency(discretionaryComp)}</dd>
        <dt className="font-medium text-slate-800">Total compensation (est.)</dt>
        <dd className="font-semibold text-[var(--portal-primary)]">
          {formatCurrency(totalCompEstimate)}
        </dd>
        {compRatio != null && (
          <>
            <dt className="text-[var(--portal-muted)]">Compensation ratio</dt>
            <dd className="font-medium">{formatPercent(compRatio)} of revenue</dd>
          </>
        )}
      </dl>
    </div>
  );
}
