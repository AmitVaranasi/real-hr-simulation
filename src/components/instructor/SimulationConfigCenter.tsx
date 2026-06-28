"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formSelectClassName } from "@/components/ui/form-controls";
import {
  ConfigBenchmarkPanel,
  ConfigIndustryNormsPanel,
  ConfigIndustryPanel,
  ConfigParametersPanel,
  ConfigStrategyPanel,
} from "@/components/instructor/config/ConfigEditors";
import { EngineDiagnosticPanel } from "@/components/instructor/EngineDiagnosticPanel";
import { FormulaInspector } from "@/components/instructor/FormulaInspector";
import { createDefaultDecision } from "@/lib/engine/defaults";
import type { SimulationConfigOverrides } from "@/lib/engine/simulation-config";
import type {
  EconomyCondition,
  Industry,
  SimulationTrace,
  Strategy,
} from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils";

type Tab =
  | "parameters"
  | "industries"
  | "norms"
  | "strategies"
  | "benchmarks"
  | "scenarios"
  | "process"
  | "diagnostics"
  | "export";

export function SimulationConfigCenter() {
  const [tab, setTab] = useState<Tab>("parameters");
  const [overrides, setOverrides] = useState<SimulationConfigOverrides>({});
  const [discretionaryBudget, setDiscretionaryBudget] = useState(500_000);
  const [effective, setEffective] = useState<Record<string, unknown> | null>(
    null
  );
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
    const o = (data.config?.overrides ?? {}) as SimulationConfigOverrides;
    setOverrides(o);
    setDiscretionaryBudget(Number(o.discretionary_budget ?? 500_000));
    setEffective(data.effective ?? null);
  }, []);

  useEffect(() => {
    void loadConfig();
    void fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        setSessions(
          (data.sessions ?? []).map(
            (s: {
              id: string;
              name: string;
              rounds?: Array<{ id: string; round_number: number }>;
            }) => ({
              id: s.id,
              name: s.name,
              rounds: s.rounds ?? [],
            })
          )
        );
      });
  }, [loadConfig]);

  async function saveConfig() {
    setSaving(true);
    setMessage(null);
    const payload = {
      version: 3 as const,
      overrides: {
        ...overrides,
        discretionary_budget: discretionaryBudget,
      },
    };
    const res = await fetch("/api/simulation-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: payload }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Configuration saved. Students will see updates on next page load.");
      void loadConfig();
    } else {
      setMessage("Save failed — run supabase/migration-v3.sql if the table is missing.");
    }
  }

  async function resetConfig() {
    await fetch("/api/simulation-config", { method: "POST" });
    setOverrides({});
    setDiscretionaryBudget(500_000);
    void loadConfig();
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

  async function exportScenarios(format: "json" | "csv") {
    const res = await fetch("/api/simulation-config/export-scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        strategy: scenarioStrategy,
        economy: scenarioEconomy,
        format,
      }),
    });
    if (!res.ok) {
      setMessage("Export failed.");
      return;
    }
    if (format === "csv") {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "scenario-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "simulation-config-export.json";
      a.click();
      URL.revokeObjectURL(url);
    }
    setMessage(`Exported scenarios as ${format.toUpperCase()}.`);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "parameters", label: "Budget & economy" },
    { id: "industries", label: "Industries" },
    { id: "norms", label: "Industry norms" },
    { id: "strategies", label: "Strategies" },
    { id: "benchmarks", label: "BSC benchmarks" },
    { id: "scenarios", label: "Scenario test" },
    { id: "process", label: "Process round" },
    { id: "diagnostics", label: "Diagnostics" },
    { id: "export", label: "Export" },
  ];

  const selectedSession = sessions.find((s) => s.id === processSessionId);
  const saveBar = (
    <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
      <Button onClick={saveConfig} disabled={saving}>
        {saving ? "Saving…" : "Save all configuration"}
      </Button>
      <Button variant="outline" onClick={resetConfig}>
        Reset to defaults
      </Button>
    </div>
  );

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
          Edit engine assumptions without code changes. Save before running scenarios
          or processing rounds.
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

      {(tab === "parameters" ||
        tab === "industries" ||
        tab === "norms" ||
        tab === "strategies" ||
        tab === "benchmarks") && (
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
          {tab === "parameters" && (
            <ConfigParametersPanel
              overrides={overrides}
              onChange={setOverrides}
              discretionaryBudget={discretionaryBudget}
              onBudgetChange={setDiscretionaryBudget}
            />
          )}
          {tab === "industries" && (
            <ConfigIndustryPanel overrides={overrides} onChange={setOverrides} />
          )}
          {tab === "norms" && (
            <ConfigIndustryNormsPanel overrides={overrides} onChange={setOverrides} />
          )}
          {tab === "strategies" && (
            <ConfigStrategyPanel overrides={overrides} onChange={setOverrides} />
          )}
          {tab === "benchmarks" && (
            <ConfigBenchmarkPanel overrides={overrides} onChange={setOverrides} />
          )}
          {saveBar}
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
                {(
                  [
                    "Cost Leadership",
                    "Differentiation",
                    "Innovation",
                    "Customer Intimacy",
                    "Focus",
                  ] as Strategy[]
                ).map((s) => (
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
            Run simulation as each industry (uses saved config + default decisions):
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                "Manufacturing",
                "Service",
                "High-Tech",
                "Banking",
                "Retail",
              ] as Industry[]
            ).map((ind) => (
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
            Manually process a round using saved configuration.
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

      {tab === "diagnostics" && (
        <div className="space-y-6">
          <EngineDiagnosticPanel
            effective={
              effective as {
                discretionary_budget: number;
                economy_multipliers: typeof import("@/lib/engine/config").ECONOMY_MULTIPLIERS;
                industries: typeof import("@/lib/engine/config").INDUSTRY_CONFIGS;
              } | null
            }
            scenarioTrace={scenarioTrace}
            scenarioLabel={`${scenarioIndustry} · ${scenarioStrategy}`}
          />
          {scenarioTrace && (
            <FormulaInspector
              teamName={`Scenario: ${scenarioIndustry}`}
              roundLabel={`${scenarioStrategy} · ${scenarioEconomy}`}
              decision={createDefaultDecision()}
              trace={scenarioTrace}
            />
          )}
        </div>
      )}

      {tab === "export" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">
            Export all-industry scenario results using current saved configuration.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void exportScenarios("json")}>
              Download JSON (full)
            </Button>
            <Button variant="outline" onClick={() => void exportScenarios("csv")}>
              Download CSV summary
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
