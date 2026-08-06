"use client";

import type { BSCScores } from "@/lib/engine/types";

interface BSCScorecardProps {
  scores: BSCScores;
  bscWeights?: {
    financial: number;
    employee: number;
    process: number;
    learning: number;
  };
}

const PERSPECTIVE_KEYS = [
  { key: "score_financial" as const, label: "Financial", weightKey: "financial" as const },
  { key: "score_employee" as const, label: "Employee", weightKey: "employee" as const },
  { key: "score_process" as const, label: "Internal Process", weightKey: "process" as const },
  { key: "score_learning" as const, label: "Learning & Growth", weightKey: "learning" as const },
];

const DEFAULT_WEIGHTS = {
  financial: 30,
  employee: 35,
  process: 30,
  learning: 35,
};

export function BSCScorecard({ scores, bscWeights }: BSCScorecardProps) {
  const weights = bscWeights ?? DEFAULT_WEIGHTS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-[var(--portal-primary)] px-6 py-4 text-white">
        <div>
          <p className="text-sm opacity-90">Total Round Score</p>
          <p className="text-4xl font-bold">{scores.total_score.toFixed(1)}</p>
        </div>
        <div className="text-right text-sm">
          {scores.strategy_bonus > 0 && (
            <p>Strategy bonus: +{scores.strategy_bonus}</p>
          )}
          {scores.industry_penalty > 0 && (
            <p>Industry penalty: -{scores.industry_penalty}</p>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {PERSPECTIVE_KEYS.map((p) => {
          const value = scores[p.key];
          const max = weights[p.weightKey];
          const pct = max > 0 ? (value / max) * 100 : 0;
          return (
            <div
              key={p.key}
              className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white p-4"
            >
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-[var(--portal-ink)]">{p.label}</span>
                <span className="text-[var(--portal-muted)]">
                  {value.toFixed(1)} / {max}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#f1f3f5]">
                <div
                  className="h-full rounded-full bg-[var(--portal-primary)]"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
