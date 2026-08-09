"use client";

import type { BudgetBreakdown } from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils";

interface BudgetTrackerProps {
  budget: BudgetBreakdown;
}

export function BudgetTracker({ budget }: BudgetTrackerProps) {
  const pct = Math.min(
    100,
    (budget.total_spend / Math.max(1, budget.available_budget)) * 100
  );
  const over = budget.remaining < 0;

  return (
    <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-[var(--portal-title)]">
          Discretionary HR Budget
        </span>
        <span
          className={
            over
              ? "font-semibold text-red-600"
              : "font-semibold tabular-nums text-[var(--portal-ink)]"
          }
        >
          {formatCurrency(budget.total_spend)} /{" "}
          {formatCurrency(budget.available_budget)}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#eef1f4]">
        <div
          className={`h-full rounded-full transition-all ${
            over ? "bg-red-500" : "bg-[var(--portal-success)]"
          }`}
          style={{ width: `${Math.min(Math.max(pct, 2), 100)}%` }}
        />
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs font-medium">
        <span className={over ? "text-red-600" : "text-[var(--portal-success)]"}>
          {formatCurrency(budget.remaining)} Remaining
        </span>
        <span className="text-[var(--portal-muted)]">|</span>
        <span className="text-[var(--portal-muted)]">{pct.toFixed(0)}% Used</span>
        {over ? (
          <span className="mt-1 block w-full text-red-600/90">
            Total module spend exceeds the discretionary pool — reduce bonus %,
            hires, or training to balance the budget.
          </span>
        ) : null}
      </p>
    </div>
  );
}
