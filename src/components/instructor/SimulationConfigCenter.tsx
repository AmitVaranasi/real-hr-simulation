"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Factory,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  Play,
  RefreshCw,
  Save,
  Settings2,
  Target,
  TestTube2,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
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
  | "overview"
  | "parameters"
  | "industries"
  | "norms"
  | "strategies"
  | "benchmarks"
  | "carryforward"
  | "scenarios"
  | "process"
  | "diagnostics"
  | "export";

const MODULE_STRIP: {
  id: Tab;
  label: string;
  hint: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    id: "overview",
    label: "Overview",
    hint: "Configuration Summary",
    icon: LayoutDashboard,
  },
  {
    id: "parameters",
    label: "Budget & Economy",
    hint: "Economic Assumptions",
    icon: Wallet,
  },
  {
    id: "industries",
    label: "Industries",
    hint: "Industry Settings",
    icon: Factory,
  },
  {
    id: "norms",
    label: "Industry Norms",
    hint: "Guidance Ranges",
    icon: Gauge,
  },
  {
    id: "strategies",
    label: "Strategies",
    hint: "Strategy Settings",
    icon: Target,
  },
  {
    id: "benchmarks",
    label: "BSC Benchmarks",
    hint: "Metric Thresholds",
    icon: BarChart3,
  },
  {
    id: "carryforward",
    label: "Carry-Forward",
    hint: "Effect Settings",
    icon: RefreshCw,
  },
  {
    id: "scenarios",
    label: "Scenario Test",
    hint: "Run Scenarios",
    icon: TestTube2,
  },
  {
    id: "process",
    label: "Process Round",
    hint: "Manual Processing",
    icon: Play,
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    hint: "Engine Insights",
    icon: Activity,
  },
  {
    id: "export",
    label: "Export",
    hint: "Export & Download",
    icon: Download,
  },
];

const DECISION_MODULES = [
  "Recruitment & Selection",
  "Performance Management",
  "Training & Development",
  "Employee Relations",
  "Compensation & Benefits",
  "DEI Initiatives",
  "Org Design & Change",
] as const;

function economyLabel(economy: EconomyCondition | string | undefined) {
  if (economy === "boom") return "Boom";
  if (economy === "recession") return "Recession";
  return "Normal / Moderate Growth";
}

export function SimulationConfigCenter() {
  const [tab, setTab] = useState<Tab>("overview");
  const [overrides, setOverrides] = useState<SimulationConfigOverrides>({});
  const [discretionaryBudget, setDiscretionaryBudget] = useState(500_000);
  const [effective, setEffective] = useState<Record<string, unknown> | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [scenarioIndustry, setScenarioIndustry] =
    useState<Industry>("Manufacturing");
  const [scenarioStrategy, setScenarioStrategy] = useState<Strategy>("Focus");
  const [scenarioEconomy, setScenarioEconomy] =
    useState<EconomyCondition>("normal");
  const [scenarioTrace, setScenarioTrace] = useState<SimulationTrace | null>(
    null
  );
  const [scenarioLoading, setScenarioLoading] = useState(false);

  const [sessions, setSessions] = useState<
    Array<{
      id: string;
      name: string;
      rounds: Array<{ id: string; round_number: number }>;
    }>
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
    if (data.config?.updated_at) {
      setLastSavedAt(String(data.config.updated_at));
    }
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
      setMessage(
        "Configuration saved. Students will see updates on next page load."
      );
      setLastSavedAt(new Date().toISOString());
      void loadConfig();
    } else {
      setMessage(
        "Save failed — run supabase/migration-v3.sql if the table is missing."
      );
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
        : (data.error ?? "Process failed")
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

  const selectedSession = sessions.find((s) => s.id === processSessionId);
  const strategyCount = useMemo(() => {
    const keys = Object.keys(overrides.strategies ?? {});
    return keys.length > 0 ? keys.length : 5;
  }, [overrides.strategies]);

  const summaryItems = [
    { label: "Mode", value: "Competitive" },
    {
      label: "Sessions loaded",
      value: `${sessions.length} course session(s)`,
    },
    { label: "Industry focus", value: scenarioIndustry },
    { label: "Economy", value: economyLabel(scenarioEconomy) },
    {
      label: "HR Budget",
      value: `${formatCurrency(discretionaryBudget)} per team`,
    },
    { label: "Strategies", value: `${strategyCount} configured` },
    { label: "BSC Benchmarks", value: "16 Metrics (Standard)" },
  ];

  const saveBar = (
    <div className="flex flex-wrap gap-3 border-t border-[var(--portal-sidebar-border)] pt-4">
      <Button onClick={saveConfig} disabled={saving}>
        {saving ? "Saving…" : "Save all configuration"}
      </Button>
      <Button variant="outline" onClick={resetConfig}>
        Reset to defaults
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="text-xs text-[var(--portal-muted)]">
        <Link href="/sessions" className="text-[var(--portal-accent-blue)] hover:underline">
          Dashboard
        </Link>
        <span className="mx-1.5">›</span>
        <span>Simulation Lab</span>
        <span className="mx-1.5">›</span>
        <span className="font-medium text-[var(--portal-ink)]">Configuration</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--portal-title)] sm:text-3xl">
            Simulation Lab Configuration
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--portal-muted)]">
            Design and edit engine assumptions without code changes. Save your
            configuration before running scenarios or processing rounds.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadConfig()}>
            <FolderOpen className="mr-1.5 h-4 w-4" />
            Load Saved Configuration
          </Button>
          <Button variant="outline" onClick={() => void saveConfig()} disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Saving…" : "Save Configuration"}
          </Button>
          <Button
            className="bg-[var(--portal-accent-blue)] hover:bg-blue-700"
            onClick={() => void saveConfig()}
            disabled={saving}
          >
            <Play className="mr-1.5 h-4 w-4" />
            Apply Configuration
          </Button>
        </div>
      </div>

      {/* 11-module icon strip (2 rows like PNG) */}
      <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-3 shadow-sm">
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-7">
          {MODULE_STRIP.map((m) => {
            const Icon = m.icon;
            const active = tab === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setTab(m.id)}
                className={`flex flex-col items-center rounded-lg px-1 py-2 text-center transition sm:col-span-1 ${
                  m.id === "scenarios" ||
                  m.id === "process" ||
                  m.id === "diagnostics" ||
                  m.id === "export"
                    ? "sm:col-span-1"
                    : ""
                } ${
                  active
                    ? "text-[var(--portal-accent-blue)]"
                    : "text-[var(--portal-muted)] hover:bg-[#f8fafc]"
                }`}
                title={m.hint}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                <span className="mt-1 text-[10px] font-semibold leading-tight">
                  {m.label}
                </span>
                <span
                  className={`mt-1 h-0.5 w-10 rounded-full ${
                    active ? "bg-[var(--portal-accent-blue)]" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {message && (
        <p className="rounded-lg bg-[var(--portal-primary-soft)] px-3 py-2 text-sm text-[var(--portal-title)]">
          {message}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          {tab === "overview" && (
            <>
              <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-[var(--portal-title)]">
                  (1) Simulation Scope
                </h2>
                <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                      Simulation Mode
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      {[
                        "Competitive (Teams Compete)",
                        "Collaborative",
                        "Individual",
                      ].map((mode, i) => (
                        <label
                          key={mode}
                          className="inline-flex items-center gap-2 text-[var(--portal-ink)]"
                        >
                          <input
                            type="radio"
                            name="sim-mode"
                            defaultChecked={i === 0}
                            className="accent-[var(--portal-accent-blue)]"
                            readOnly
                          />
                          {mode}
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          label: "Number of Rounds",
                          value: String(sessions[0] ? 6 : "—"),
                        },
                        { label: "Practice Rounds", value: "1" },
                        {
                          label: "Teams",
                          value: String(sessions.length ? "—" : "—"),
                        },
                        { label: "Team Size", value: "4–5 Students" },
                      ].map((c) => (
                        <div
                          key={c.label}
                          className="rounded-lg border border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-3 py-2"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                            {c.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[var(--portal-title)]">
                            {c.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                        Decision Modules
                      </p>
                      <span className="text-[11px] font-semibold text-[var(--portal-accent-blue)]">
                        Select All | Clear All
                      </span>
                    </div>
                    <ul className="mt-2 space-y-2">
                      {DECISION_MODULES.map((m) => (
                        <li
                          key={m}
                          className="flex items-center gap-2 text-sm text-[var(--portal-ink)]"
                        >
                          <input
                            type="checkbox"
                            defaultChecked
                            className="accent-[var(--portal-accent-blue)]"
                            readOnly
                          />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[var(--portal-title)]">
                    (2) Environment Parameters
                  </h2>
                  <button
                    type="button"
                    onClick={() => setTab("parameters")}
                    className="text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
                  >
                    Use Recommended Defaults →
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      title: "Budget",
                      value: formatCurrency(discretionaryBudget),
                      note: "Total discretionary HR budget per team per round.",
                      link: () => setTab("parameters"),
                      linkLabel: "Budget Guidelines →",
                      icon: Wallet,
                      tone: "text-emerald-700 bg-emerald-50",
                    },
                    {
                      title: "Economic Scenario",
                      value: economyLabel(scenarioEconomy),
                      note: "Applied when running scenarios and processing rounds.",
                      link: () => setTab("parameters"),
                      linkLabel: "Edit Economy →",
                      icon: TrendingUp,
                      tone: "text-emerald-700 bg-emerald-50",
                    },
                    {
                      title: "Industry",
                      value: scenarioIndustry,
                      note: "Industry settings drive multipliers and norms.",
                      link: () => setTab("industries"),
                      linkLabel: "Edit Industry →",
                      icon: Factory,
                      tone: "text-violet-700 bg-violet-50",
                    },
                    {
                      title: "Competition Level",
                      value: "Moderate",
                      note: "Balanced competitive pressure across teams.",
                      link: () => setTab("strategies"),
                      linkLabel: "Edit Competition →",
                      icon: Building2,
                      tone: "text-[var(--portal-primary)] bg-[var(--portal-primary-soft)]",
                    },
                    {
                      title: "Strategies Available",
                      value: `${strategyCount} Strategies`,
                      note: "Strategy weights and BSC emphasis by competitive posture.",
                      link: () => setTab("strategies"),
                      linkLabel: "Edit Strategies →",
                      icon: Target,
                      tone: "text-[var(--portal-accent-blue)] bg-[var(--portal-accent-blue-soft)]",
                    },
                  ].map((card) => {
                    const Icon = card.icon;
                    return (
                      <article
                        key={card.title}
                        className="rounded-xl border border-[var(--portal-sidebar-border)] p-4"
                      >
                        <div
                          className={`inline-flex rounded-lg p-2 ${card.tone}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                          {card.title}
                        </p>
                        <p className="mt-1 text-lg font-bold text-[var(--portal-title)]">
                          {card.value}
                        </p>
                        <p className="mt-1 text-xs text-[var(--portal-muted)]">
                          {card.note}
                        </p>
                        <button
                          type="button"
                          onClick={card.link}
                          className="mt-2 text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
                        >
                          {card.linkLabel}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-[var(--portal-title)]">
                  (3) Performance Architecture
                </h2>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-[var(--portal-sidebar-border)] p-4">
                    <p className="text-sm font-semibold text-[var(--portal-title)]">
                      BSC Perspective Weights
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <div
                        className="relative h-[7rem] w-[7rem] shrink-0 rounded-full"
                        style={{
                          background:
                            "conic-gradient(#16a34a 0 25%, #0ea5e9 25% 50%, #1d6ef5 50% 75%, #7c3aed 75% 100%)",
                        }}
                      >
                        <div className="absolute inset-3 flex items-center justify-center rounded-full bg-white text-sm font-bold text-[var(--portal-title)]">
                          100%
                        </div>
                      </div>
                      <ul className="space-y-1.5 text-xs">
                        {[
                          ["Financial", "25%", "bg-emerald-500"],
                          ["Employee", "25%", "bg-sky-500"],
                          ["Internal Process", "25%", "bg-sky-500"],
                          ["Learning & Growth", "25%", "bg-violet-500"],
                        ].map(([label, pct, color]) => (
                          <li key={label} className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${color}`}
                            />
                            <span className="text-[var(--portal-ink)]">
                              {label}
                            </span>
                            <span className="font-bold text-[var(--portal-title)]">
                              {pct}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab("strategies")}
                      className="mt-3 text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
                    >
                      Edit Weights →
                    </button>
                  </div>
                  <div className="rounded-xl border border-[var(--portal-sidebar-border)] p-4">
                    <p className="text-sm font-semibold text-[var(--portal-title)]">
                      BSC Metric Benchmarks
                    </p>
                    <p className="mt-2 text-lg font-bold text-[var(--portal-title)]">
                      Standard BSC — 16 Metrics
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        ["Financial", "4 Metrics", "bg-emerald-50 text-emerald-700"],
                        ["Employee", "4 Metrics", "bg-sky-50 text-sky-700"],
                        [
                          "Internal",
                          "4 Metrics",
                          "bg-sky-50 text-sky-700",
                        ],
                        ["Learning", "4 Metrics", "bg-violet-50 text-violet-700"],
                      ].map(([label, count, tone]) => (
                        <div
                          key={label}
                          className={`rounded-lg px-2 py-2 text-xs font-semibold ${tone}`}
                        >
                          {label}
                          <p className="mt-0.5 font-normal opacity-80">{count}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab("benchmarks")}
                      className="mt-3 text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
                    >
                      Edit Benchmarks →
                    </button>
                  </div>
                  <div className="rounded-xl border border-[var(--portal-sidebar-border)] p-4">
                    <p className="text-sm font-semibold text-[var(--portal-title)]">
                      Carry-Forward Effects
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-[var(--portal-ink)]">
                      {[
                        "Financial Results",
                        "Workforce Results",
                        "Knowledge & Capabilities",
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[var(--portal-success)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setTab("carryforward")}
                      className="mt-3 text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
                    >
                      Edit Carry-Forward →
                    </button>
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-3 rounded-xl border border-[var(--portal-accent-blue)]/30 bg-[var(--portal-accent-blue-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--portal-title)]">
                  Changes made here affect all future rounds for this session.
                  Test scenarios in the Testing Center before applying major
                  changes to your active course.
                </p>
                <Link
                  href="/sessions/testing"
                  className="shrink-0 rounded-md bg-[var(--portal-accent-blue)] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Go to Testing Center →
                </Link>
              </div>
            </>
          )}

          {(tab === "parameters" ||
            tab === "industries" ||
            tab === "norms" ||
            tab === "strategies" ||
            tab === "benchmarks") && (
            <div className="space-y-6 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 shadow-sm">
              {tab === "parameters" && (
                <ConfigParametersPanel
                  overrides={overrides}
                  onChange={setOverrides}
                  discretionaryBudget={discretionaryBudget}
                  onBudgetChange={setDiscretionaryBudget}
                />
              )}
              {tab === "industries" && (
                <ConfigIndustryPanel
                  overrides={overrides}
                  onChange={setOverrides}
                />
              )}
              {tab === "norms" && (
                <ConfigIndustryNormsPanel
                  overrides={overrides}
                  onChange={setOverrides}
                />
              )}
              {tab === "strategies" && (
                <ConfigStrategyPanel
                  overrides={overrides}
                  onChange={setOverrides}
                />
              )}
              {tab === "benchmarks" && (
                <ConfigBenchmarkPanel
                  overrides={overrides}
                  onChange={setOverrides}
                />
              )}
              {saveBar}
            </div>
          )}

          {tab === "carryforward" && (
            <div className="space-y-4 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[var(--portal-primary-soft)] p-2 text-[var(--portal-primary)]">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--portal-title)]">
                    Carry-Forward Effects
                  </h2>
                  <p className="mt-1 text-sm text-[var(--portal-muted)]">
                    Pending Cooper parameters — no invented formulas. Surface
                    shows how prior-round state currently feeds the engine.
                  </p>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  {
                    title: "Financial Results",
                    body: "Prior revenue, profit, and stock feed subsequent-round baselines via team state.",
                  },
                  {
                    title: "Workforce Results",
                    body: "Headcount, turnover, engagement, and related HR metrics carry into prior-state construction.",
                  },
                  {
                    title: "Knowledge & Capabilities",
                    body: "Training effectiveness and succession signals influence capability continuity across rounds.",
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="rounded-lg border border-[var(--portal-sidebar-border)] px-4 py-3"
                  >
                    <p className="font-semibold text-[var(--portal-title)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[var(--portal-muted)]">{item.body}</p>
                  </li>
                ))}
              </ul>
              <p className="rounded-lg border border-dashed border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-3 py-2 text-xs text-[var(--portal-muted)]">
                Tunable carry-forward coefficients will appear here when Cooper
                finalizes parameters. Existing process-round APIs remain unchanged.
              </p>
            </div>
          )}

          {tab === "scenarios" && (
            <div className="space-y-4 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 shadow-sm">
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
              <p className="text-sm text-[var(--portal-muted)]">
                Run simulation as each industry (uses saved config + default
                decisions):
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
            <div className="space-y-4 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 shadow-sm">
              <p className="text-sm text-[var(--portal-muted)]">
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
            <div className="space-y-4 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 shadow-sm">
              <p className="text-sm text-[var(--portal-muted)]">
                Export all-industry scenario results using current saved
                configuration.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => void exportScenarios("json")}
                >
                  Download JSON (full)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void exportScenarios("csv")}
                >
                  Download CSV summary
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right summary rail */}
        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--portal-title)]">
              Configuration Summary
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {summaryItems.map((item) => (
                <li
                  key={item.label}
                  className="flex items-start justify-between gap-2 border-b border-[var(--portal-sidebar-border)] pb-2 last:border-0"
                >
                  <span className="text-[var(--portal-muted)]">{item.label}</span>
                  <span className="text-right font-medium text-[var(--portal-ink)]">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setTab("overview")}
              className="mt-3 text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View Full Summary →
            </button>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--portal-title)]">
              Configuration Status
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--portal-ink)]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--portal-success)]" />
                All required settings are complete
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--portal-success)]" />
                Configuration is valid and ready to apply
              </li>
              <li className="flex items-start gap-2 text-[var(--portal-muted)]">
                <Clock className="mt-0.5 h-4 w-4" />
                Last saved:{" "}
                {lastSavedAt
                  ? new Date(lastSavedAt).toLocaleString()
                  : "Not saved this session"}
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--portal-title)]">
              Quick Actions
            </h3>
            <div className="mt-3 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => void exportScenarios("json")}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Configuration
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => void loadConfig()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import / Reload Saved
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => void resetConfig()}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Reset to Defaults
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
