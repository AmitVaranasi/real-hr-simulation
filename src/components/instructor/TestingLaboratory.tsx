"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formSelectClassName } from "@/components/ui/form-controls";
import { EngineDiagnosticPanel } from "@/components/instructor/EngineDiagnosticPanel";
import { FormulaInspector } from "@/components/instructor/FormulaInspector";
import { createDefaultDecision } from "@/lib/engine/defaults";
import type {
  EconomyCondition,
  Industry,
  SimulationTrace,
  Strategy,
} from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils";

const INDUSTRIES: Industry[] = [
  "Manufacturing",
  "Service",
  "High-Tech",
  "Banking",
  "Retail",
];

const STRATEGIES: Strategy[] = [
  "Cost Leadership",
  "Differentiation",
  "Innovation",
  "Customer Intimacy",
  "Focus",
];

const WORKFLOW_STEPS = [
  "Create or open a session",
  "Add teams with industry + strategy",
  "Open a round (set economy)",
  "Students submit decisions",
  "Close & compute the round",
  "Inspect formula traces",
  "Release leaderboard / review reports",
];

export function TestingLaboratory() {
  const [industry, setIndustry] = useState<Industry>("Manufacturing");
  const [strategy, setStrategy] = useState<Strategy>("Focus");
  const [economy, setEconomy] = useState<EconomyCondition>("normal");
  const [trace, setTrace] = useState<SimulationTrace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [effectiveBudget, setEffectiveBudget] = useState(500_000);
  const [sessions, setSessions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const loadEffective = useCallback(async () => {
    const res = await fetch("/api/simulation-config/effective");
    if (!res.ok) return;
    const data = await res.json();
    setEffectiveBudget(Number(data.discretionary_budget ?? 500_000));
  }, []);

  useEffect(() => {
    void loadEffective();
    void fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        setSessions(
          (data.sessions ?? []).map((s: { id: string; name: string }) => ({
            id: s.id,
            name: s.name,
          }))
        );
      });
  }, [loadEffective]);

  async function runScenario() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/simulation-config/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, strategy, economy }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Scenario failed");
        setTrace(null);
      } else {
        setTrace(data.trace ?? null);
      }
    } catch {
      setError("Could not run scenario");
    }
    setLoading(false);
  }

  async function exportScenarios() {
    const res = await fetch("/api/simulation-config/export-scenarios");
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hr-simulation-scenarios.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Testing Center</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Dedicated laboratory for formula validation, scenario runs, workflow
            checks, and engine diagnostics before expert evaluation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/sessions/config"
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Configuration
          </Link>
          <Button type="button" variant="outline" onClick={() => void exportScenarios()}>
            Export scenarios
          </Button>
        </div>
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Workflow checklist</h2>
        <p className="mt-1 text-sm text-slate-500">
          Use this when validating a full classroom path.
        </p>
        <ul className="mt-4 space-y-2">
          {WORKFLOW_STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={!!checked[i]}
                onChange={(e) =>
                  setChecked((prev) => ({ ...prev, [i]: e.target.checked }))
                }
              />
              <span className={checked[i] ? "text-slate-400 line-through" : ""}>
                {step}
              </span>
            </li>
          ))}
        </ul>
        {sessions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {sessions.slice(0, 4).map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-[#c45f12] hover:bg-[#fff4e8]"
              >
                Open {s.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Scenario runner</h2>
        <p className="mt-1 text-sm text-slate-500">
          Run the default decision pack across industry × strategy × economy.
          Discretionary budget: {formatCurrency(effectiveBudget)}.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="font-medium text-slate-700">Industry</span>
            <select
              className={`mt-1 w-full ${formSelectClassName}`}
              value={industry}
              onChange={(e) => setIndustry(e.target.value as Industry)}
            >
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-slate-700">Strategy</span>
            <select
              className={`mt-1 w-full ${formSelectClassName}`}
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as Strategy)}
            >
              {STRATEGIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-slate-700">Economy</span>
            <select
              className={`mt-1 w-full ${formSelectClassName}`}
              value={economy}
              onChange={(e) => setEconomy(e.target.value as EconomyCondition)}
            >
              <option value="boom">boom</option>
              <option value="normal">normal</option>
              <option value="recession">recession</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => void runScenario()} disabled={loading}>
            {loading ? "Running…" : "Run scenario"}
          </Button>
          {INDUSTRIES.map((ind) => (
            <Button
              key={ind}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIndustry(ind);
                void (async () => {
                  setLoading(true);
                  setError(null);
                  const res = await fetch("/api/simulation-config/scenario", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      industry: ind,
                      strategy,
                      economy,
                    }),
                  });
                  const data = await res.json();
                  setLoading(false);
                  if (res.ok) setTrace(data.trace ?? null);
                  else setError(data.error ?? "Failed");
                })();
              }}
            >
              {ind}
            </Button>
          ))}
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-slate-900">
          Engine diagnostic panel
        </h2>
        <EngineDiagnosticPanel />
      </section>

      {trace && (
        <section className="mt-8">
          <FormulaInspector
            teamName={`${industry} / ${strategy}`}
            roundLabel={`Scenario · ${economy} economy`}
            decision={createDefaultDecision()}
            trace={trace}
            carryForward={{
              prior_round_number: null,
              budget_carryover: 0,
              prior_metrics: null,
              prior_financials: null,
              team_rolling_state: {
                headcount: null,
                revenue: null,
                stock_price: null,
                satisfaction: null,
                engagement: null,
                turnover_rate: null,
              },
            }}
          />
        </section>
      )}

      <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="font-semibold text-slate-900">Live session inspect</h2>
        <p className="mt-1 text-sm text-slate-500">
          Jump into a real team/round formula trace (includes carry-forward).
        </p>
        <ul className="mt-3 space-y-2">
          {sessions.length === 0 && (
            <li className="text-sm text-slate-500">No sessions yet.</li>
          )}
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/sessions/${s.id}/inspect`}
                className="text-sm font-medium text-[#c45f12] hover:underline"
              >
                Inspect {s.name} →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
