"use client";

import type { BSCScores } from "@/lib/engine/types";

interface BSCScorecardProps {
  scores: BSCScores;
}

const perspectives = [
  { key: "score_financial" as const, label: "Financial", max: 30 },
  { key: "score_employee" as const, label: "Employee", max: 35 },
  { key: "score_process" as const, label: "Internal Process", max: 30 },
  { key: "score_learning" as const, label: "Learning & Growth", max: 35 },
];

export function BSCScorecard({ scores }: BSCScorecardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-indigo-600 px-6 py-4 text-white">
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
        {perspectives.map((p) => {
          const value = scores[p.key];
          const pct = (value / p.max) * 100;
          return (
            <div
              key={p.key}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-700">{p.label}</span>
                <span className="text-slate-500">
                  {value.toFixed(1)} / {p.max}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
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
