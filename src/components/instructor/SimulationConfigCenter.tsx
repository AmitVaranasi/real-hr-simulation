"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formInputClassName, formSelectClassName } from "@/components/ui/form-controls";
import { FormulaInspector } from "@/components/instructor/FormulaInspector";
import { INDUSTRY_CONFIGS, STRATEGY_CONFIGS } from "@/lib/engine/config";
import { createDefaultDecision } from "@/lib/engine/defaults";
import type {
  EconomyCondition,
  Industry,
  SimulationTrace,
  Strategy,
} from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils";

type Tab = "parameters" | "scenarios" | "process" | "diagnostics";

const INDUSTRIES = Object.keys(INDUSTRY_CONFIGS) as Industry[];
const STRATEGIES = Object.keys(STRATEGY_CONFIGS) as Strategy[];

export function SimulationConfigCenter() {
  const [tab, setTab] = useState<Tab>("parameters");
  const [config, setConfig] = useState<{ overrides: Record<string, unknown> }>({
    overrides: {},
  });
  const [discretionaryBudget, setDiscretionaryBudget] = useState(500_000);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [scenarioIndustry, setScenarioIndustry] = useState<Industry>("Manufacturing");
  const [scenarioStrategy, setScenarioStrategy] = useState<Strategy>("Focus");
  const [scenarioEconomy, setScenarioEconomy] =
    useState<EconomyCondition>("normal");
  const [scenarioTrace, setScenarioTrace] = useState<SimulationTrace | null>(
    null
  );
  const [scenarioLoading, setScenarioLoading] = useState(false);

  const [sessions, setSessions] = useState<
    Array<{ id: string; name: string; rounds: Array<{ id: string; round_number: number }> }>
  >([]);
  const [processSessionId, setProcessSessionId] = useState("");
  const [processRoundId, setProcessRoundId] = useState("");

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/simulation-config");
    if (!res.ok) return;
    const data = await res.json();
    setConfig(data.config);
    setDiscretionaryBudget(
      Number(data.config?.overrides?.discretionary_budget ?? 500_000)
    );
  }, []);

  useEffect(() => {
    void loadConfig();
    void fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.sessions ?? []).map(
          (s: { id: string; name: string; rounds?: Array<{ id: string; round_number: number }> }) => ({
            id: s.id,
            name: s.name,
            rounds: s.rounds ?? [],
          })
        );
        setSessions(list);
      });
  }, [loadConfig]);

  async function saveConfig() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/simulation-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          version: 3,
          overrides: {
            ...config.overrides,
            discretionary_budget: discretionaryBudget,
          },
        },
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Configuration saved.");
      void loadConfig();
    } else {
      setMessage("Save failed — run supabase/migration-v3.sql if the table is missing.");
    }
  }

  async function resetConfig() {
    await fetch("/api/simulation-config", { method: "POST" });
    void loadConfig();
    setDiscretionaryBudget(500_000);
    setMessage("Reset to code defaults.");
  }

  async function runScenario(industry: Industry) {
    setScenarioLoading(true);
    setScenarioIndustry(industry);
    const res = await fetch("/api/simulation-config/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industry,
        strategy: scenarioStrategy,
        economy: scenarioEconomy,
        decision: createDefaultDecision(),
      }),
    });
    setScenarioLoading(false);
    if (res.ok) {
      const data = await res.json();
      setScenarioTrace(data.trace);
      setTab("diagnostics");
    }
  }

  async function processRound() {
    if (!processSessionId || !processRoundId) return;
    setMessage(null);
    const res = await fetch("/api/simulation-config/process-round", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: processSessionId,
        roundId: processRoundId,
      }),
    });
    const data = await res.json();
    setMessage(
      res.ok
        ? `Processed ${data.computed} team(s).`
        : data.error ?? "Process failed"
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "parameters", label: "Parameters" },
    { id: "scenarios", label: "Scenario test" },
    { id: "process", label: "Process round" },
    { id: "diagnostics", label: "Diagnostics" },
  ];

  const selectedSession = sessions.find((s) => s.id === processSessionId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sessions" className="text-sm text-indigo-600 hover:underline">
          ← Sessions
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Simulation Configuration Center
        </h1>
        <p className="text-slate-600">
          Edit engine assumptions, run scenarios, and inspect formulas (V3 professor sandbox).
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
          {message}
        </p>
      )}

      {tab === "parameters" && (
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">
              Discretionary HR budget (starting pool)
            </span>
            <input
              type="number"
              step={10000}
              className={`mt-1 w-full max-w-xs ${formInputClassName}`}
              value={discretionaryBudget}
              onChange={(e) => setDiscretionaryBudget(Number(e.target.value))}
            />
          </label>
          <p className="text-sm text-slate-500">
            Industry multipliers, strategy BSC weights, and benchmark tables remain
            in code defaults for now. Saved budget applies on the next round compute.
            Full JSON overrides can be extended in <code className="text-xs">simulation_config.config_json</code>.
          </p>
          <div className="flex gap-3">
            <Button onClick={saveConfig} disabled={saving}>
              {saving ? "Saving…" : "Save configuration"}
            </Button>
            <Button variant="outline" onClick={resetConfig}>
              Reset to defaults
            </Button>
          </div>
        </div>
      )}

      {tab === "scenarios" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="font-medium">Strategy</span>
              <select
                className={`mt-1 w-full ${formSelectClassName}`}
                value={scenarioStrategy}
                onChange={(e) =>
                  setScenarioStrategy(e.target.value as Strategy)
                }
              >
                {STRATEGIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="font-medium">Economy</span>
              <select
                className={`mt-1 w-full ${formSelectClassName}`}
                value={scenarioEconomy}
                onChange={(e) =>
                  setScenarioEconomy(e.target.value as EconomyCondition)
                }
              >
                <option value="boom">Boom</option>
                <option value="normal">Normal</option>
                <option value="recession">Recession</option>
              </select>
            </label>
          </div>
          <p className="text-sm text-slate-600">
            One-click scenario runs use default decisions for each industry:
          </p>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <Button
                key={ind}
                variant="outline"
                size="sm"
                disabled={scenarioLoading}
                onClick={() => void runScenario(ind)}
              >
                {ind}
              </Button>
            ))}
          </div>
          {scenarioTrace && (
            <p className="text-sm text-emerald-700">
              Last run: {scenarioIndustry} — score{" "}
              {scenarioTrace.bsc_scores.total_score.toFixed(1)} · profit{" "}
              {formatCurrency(scenarioTrace.financial_cascade.profit)}
            </p>
          )}
        </div>
      )}

      {tab === "process" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">
            Manually process a round (same as close-round compute) for testing.
          </p>
          <label className="block text-sm">
            <span className="font-medium">Session</span>
            <select
              className={`mt-1 w-full ${formSelectClassName}`}
              value={processSessionId}
              onChange={(e) => {
                setProcessSessionId(e.target.value);
                setProcessRoundId("");
              }}
            >
              <option value="">Select session…</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {selectedSession && (
            <label className="block text-sm">
              <span className="font-medium">Round</span>
              <select
                className={`mt-1 w-full ${formSelectClassName}`}
                value={processRoundId}
                onChange={(e) => setProcessRoundId(e.target.value)}
              >
                <option value="">Select round…</option>
                {selectedSession.rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    Round {r.round_number}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Button
            onClick={() => void processRound()}
            disabled={!processSessionId || !processRoundId}
          >
            Process round
          </Button>
        </div>
      )}

      {tab === "diagnostics" && scenarioTrace && (
        <FormulaInspector
          teamName={`Scenario: ${scenarioIndustry}`}
          roundLabel={`${scenarioStrategy} · ${scenarioEconomy}`}
          decision={createDefaultDecision()}
          trace={scenarioTrace}
        />
      )}

      {tab === "diagnostics" && !scenarioTrace && (
        <p className="text-slate-500">
          Run a scenario from the Scenario test tab to view formula diagnostics.
        </p>
      )}
    </div>
  );
}
