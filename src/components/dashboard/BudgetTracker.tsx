"use client";

import type { BudgetBreakdown } from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils";

interface BudgetTrackerProps {
  budget: BudgetBreakdown;
}

export function BudgetTracker({ budget }: BudgetTrackerProps) {
  const pct = Math.min(
    100,
    (budget.total_spend / budget.available_budget) * 100
  );
  const over = budget.remaining < 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Discretionary HR Budget</span>
        <span className={over ? "font-semibold text-red-600" : "text-slate-600"}>
          {formatCurrency(budget.total_spend)} / {formatCurrency(budget.available_budget)}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full transition-all ${over ? "bg-red-500" : "bg-indigo-500"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Remaining:{" "}
        <span className={over ? "text-red-600" : "text-emerald-600"}>
          {formatCurrency(budget.remaining)}
        </span>
        {" · "}
        Adherence: {budget.adherence_pct.toFixed(0)}%
        {over && (
          <span className="block mt-1 text-red-600/90">
            Total module spend exceeds the $500K discretionary pool — reduce
            bonus %, hires, or training to balance the budget.
          </span>
        )}
      </p>
    </div>
  );
}
