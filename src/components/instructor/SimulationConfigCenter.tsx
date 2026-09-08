"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  Cog,
  Download,
  Factory,
  FolderOpen,
  Gauge,
  Info,
  Layers3,
  LayoutDashboard,
  Play,
  RefreshCw,
  Save,
  Settings2,
  Sigma,
  SlidersHorizontal,
  Sun,
  Target,
  TestTube2,
  TrendingUp,
  Upload,
  Users,
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
import {
  INDUSTRY_CONFIGS as ENGINE_INDUSTRIES,
  STRATEGY_CONFIGS as ENGINE_STRATEGIES,
} from "@/lib/engine/config";
import { createDefaultDecision } from "@/lib/engine/defaults";
import type { SimulationConfigOverrides } from "@/lib/engine/simulation-config";
import type {
  EconomyCondition,
  Industry,
  SimulationTrace,
  Strategy,
} from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils";

export type ConfigTab =
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

type Tab = ConfigTab;

const PAGE_COPY: Record<
  Tab,
  { title: string; subtitle: string; crumb: string }
> = {
  overview: {
    title: "Configuration",
    subtitle:
      "Review simulation scope, environment parameters, and performance architecture.",
    crumb: "Overview",
  },
  parameters: {
    title: "Budget & Economy Configuration",
    subtitle:
      "Define the HR budget and economic environment that drive financial and workforce outcomes.",
    crumb: "Budget & Economy",
  },
  industries: {
    title: "Industry Configuration",
    subtitle: "Set industry profiles and module multipliers.",
    crumb: "Industries",
  },
  norms: {
    title: "Industry Norms",
    subtitle: "Decision-boundary ranges and student guidance.",
    crumb: "Industry Norms",
  },
  strategies: {
    title: "Strategies Configuration",
    subtitle: "Available strategies and Balanced Scorecard weights.",
    crumb: "Strategies",
  },
  benchmarks: {
    title: "BSC Benchmarks",
    subtitle: "Excellent, moderate, and poor thresholds for the 16 metrics.",
    crumb: "BSC Benchmarks",
  },
  carryforward: {
    title: "Carry-Forward Configuration",
    subtitle: "Organizational memory across rounds.",
    crumb: "Carry-Forward",
  },
  scenarios: {
    title: "Scenario Test",
    subtitle: "Validate a configuration without touching live student data.",
    crumb: "Scenario Test",
  },
  process: {
    title: "Process Round",
    subtitle:
      "Run the next round of the simulation. The system will process team decisions through the existing engine.",
    crumb: "Process Round",
  },
  diagnostics: {
    title: "Diagnostics",
    subtitle: "Monitor configuration health and use diagnostic tools.",
    crumb: "Diagnostics",
  },
  export: {
    title: "Export Configuration",
    subtitle: "Export a configuration snapshot. Never includes student credentials.",
    crumb: "Export",
  },
};

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

const TAB_SLUGS: Record<Tab, string> = {
  overview: "overview",
  parameters: "budget-economy",
  industries: "industries",
  norms: "industry-norms",
  strategies: "strategies",
  benchmarks: "bsc-benchmarks",
  carryforward: "carry-forward",
  scenarios: "scenario-test",
  process: "process-round",
  diagnostics: "diagnostics",
  export: "export",
};

const SLUG_TO_TAB: Record<string, Tab> = Object.fromEntries(
  Object.entries(TAB_SLUGS).map(([tab, slug]) => [slug, tab as Tab])
) as Record<string, Tab>;

export function tabFromSlug(slug?: string | null): Tab {
  if (!slug) return "overview";
  return SLUG_TO_TAB[slug] ?? (slug as Tab) ?? "overview";
}


/* Carry-forward categories describe how prior-round state feeds the next round
   today — professor_carry_forward_configuration_editable. */
/* Pre-check names from process_round_editable; results are not stored. */
/* Export scopes from export_configuration_editable. */
/* Diagnostics screen content. */
const ALL_INDUSTRIES = Object.keys(ENGINE_INDUSTRIES) as Industry[];
const ALL_STRATEGIES = Object.keys(ENGINE_STRATEGIES) as Strategy[];

const HEALTH_CARDS = [
  { title: "Configuration Validity", body: "Settings completeness", Icon: CheckCircle2 },
  { title: "Engine Integrity", body: "Engine components", Icon: Cog },
  { title: "Data Consistency", body: "Items needing review", Icon: AlertTriangle },
  { title: "Calculation Accuracy", body: "Test calculations", Icon: Calculator },
  { title: "Performance", body: "Average response time", Icon: Gauge },
];

const DIAGNOSTIC_TOOLS: Array<{
  title: string;
  body: string;
  goTo: Tab;
  Icon: typeof Cog;
}> = [
  { title: "Calculation Trace", body: "Trace a calculation from inputs through formulas to outputs.", goTo: "scenarios", Icon: Calculator },
  { title: "Formula Validation", body: "Validate formulas, ranges, and dependencies.", goTo: "benchmarks", Icon: Sigma },
  { title: "Data Integrity Check", body: "Check for missing, duplicate, or inconsistent data.", goTo: "overview", Icon: Layers3 },
  { title: "Scenario Stress Test", body: "Test extreme scenarios to check engine stability.", goTo: "scenarios", Icon: Gauge },
  { title: "Multiplier Impact Test", body: "Analyze the impact of multipliers and weights.", goTo: "industries", Icon: BarChart3 },
];

const DIAGNOSTIC_AREAS = [
  "Configuration Completeness",
  "Formula Validation",
  "Data Integrity",
  "Scenario Consistency",
  "Carry-Forward Logic",
  "Performance Check",
];

const EXPORT_SCOPES = [
  { title: "Configuration Settings", body: "Configuration modules and parameters.", tone: "#2F6FED", Icon: SlidersHorizontal },
  { title: "Industry & Strategy Data", body: "Industry profiles, strategy and multipliers.", tone: "#16a34a", Icon: Factory },
  { title: "Benchmarks & Thresholds", body: "BSC benchmarks, targets, and thresholds.", tone: "#7c3aed", Icon: BarChart3 },
  { title: "Carry-Forward Rules", body: "Carry-forward categories and decay settings.", tone: "#2F6FED", Icon: RefreshCw },
  { title: "Process & Scenarios", body: "Round settings, scenarios, and test results.", tone: "#16a34a", Icon: Play },
];

const PRE_CHECKS = [
  { name: "Configuration Validity", detail: "All required configuration settings are complete." },
  { name: "Team Submissions", detail: "Teams that have submitted decisions for this round." },
  { name: "Decision Validation", detail: "All decisions are within allowed ranges." },
  { name: "Budget Compliance", detail: "All teams are within budget constraints." },
  { name: "Engine Parameters", detail: "Scoring engine and multipliers are configured." },
  { name: "Carry-Forward Data", detail: "Carry-forward effects will be applied after processing." },
];

const CARRY_CATEGORIES = [
  {
    title: "Workforce Results",
    body: "People-related outcomes that affect future talent and performance.",
    tone: "#16a34a",
    soft: "#e6f5ec",
    Icon: Users,
    items: [
      "Employee satisfaction & engagement",
      "Turnover rate",
      "Skill levels & capabilities",
      "Leadership pipeline strength",
      "Employee relations climate",
    ],
  },
  {
    title: "Financial Results",
    body: "Financial outcomes that create momentum or constraints.",
    tone: "#2F6FED",
    soft: "#e8effb",
    Icon: BarChart3,
    items: [
      "Revenue growth",
      "Profit margin",
      "Cash balance",
      "ROA & ROE",
      "Investor confidence / stock price",
    ],
  },
  {
    title: "Knowledge & Capabilities",
    body: "Organizational knowledge and systems that build over time.",
    tone: "#7c3aed",
    soft: "#f1eafd",
    Icon: Layers3,
    items: [
      "Training effectiveness",
      "Process efficiency",
      "HR technology maturity",
      "Innovation capacity",
      "DEI progress",
    ],
  },
];

function ConfigStepHeading({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--portal-accent-blue)] text-[0.8125rem] font-bold text-white">
        {n}
      </span>
      <div>
        <h2 className="text-lg font-bold text-[var(--portal-title)]">{title}</h2>
        <p className="mt-0.5 text-sm text-[var(--portal-muted)]">{body}</p>
      </div>
    </div>
  );
}

export function SimulationConfigCenter({
  initialTab = "overview",
}: {
  initialTab?: Tab | string;
}) {
  const router = useRouter();
  const [tab, setTabState] = useState<Tab>(tabFromSlug(initialTab));
  const setTab = (next: Tab) => {
    setTabState(next);
    router.replace(`/sessions/config/${TAB_SLUGS[next]}`);
  };
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
  const [scenarioResults, setScenarioResults] = useState<
    Partial<Record<Industry, SimulationTrace>>
  >({});
  const [scenarioIndustries, setScenarioIndustries] = useState<Industry[]>([
    "Manufacturing",
    "Service",
    "High-Tech",
    "Banking",
    "Retail",
  ]);

  const [sessions, setSessions] = useState<
    Array<{
      id: string;
      name: string;
      rounds: Array<{
        id: string;
        round_number: number;
        round_type?: string;
        status?: string;
      }>;
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
              rounds?: Array<{
                id: string;
                round_number: number;
                round_type?: string;
                status?: string;
              }>;
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

  async function runScenario(industry: Industry, jumpToDiagnostics = true) {
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
      setScenarioResults((prev) => ({ ...prev, [industry]: data.trace }));
      if (jumpToDiagnostics) setTab("diagnostics");
    }
  }

  /** Runs every selected industry so the results table can compare them. */
  async function runScenarioTest() {
    for (const industry of scenarioIndustries) {
      await runScenario(industry, false);
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
        <Link href="/sessions/lab" className="text-[var(--portal-accent-blue)] hover:underline">
          Simulation Lab
        </Link>
        <span className="mx-1.5">›</span>
        <Link href="/sessions/config/overview" className="text-[var(--portal-accent-blue)] hover:underline">
          Configuration
        </Link>
        <span className="mx-1.5">›</span>
        <span className="font-medium text-[var(--portal-ink)]">
          {PAGE_COPY[tab].crumb}
        </span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--portal-title)] sm:text-3xl">
            {PAGE_COPY[tab].title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--portal-muted)]">
            {PAGE_COPY[tab].subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab !== "overview" ? (
            <Button variant="outline" onClick={() => setTab("overview")}>
              ← Back to Overview
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => void loadConfig()}>
            <FolderOpen className="mr-1.5 h-4 w-4" />
            Load Saved Configuration
          </Button>
          <Button
            className="bg-[var(--portal-accent-blue)] hover:bg-blue-700"
            onClick={() => void saveConfig()}
            disabled={saving}
          >
            <Play className="mr-1.5 h-4 w-4" />
            Save & Apply Changes
          </Button>
        </div>
      </div>

      {/* Figma renders the tabs as label + sublabel text cells in a bordered
          card (7 across, then the remaining 4) — no icons. */}
      <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-3 shadow-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-7">
          {MODULE_STRIP.map((m) => {
            const active = tab === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setTab(m.id)}
                className="min-w-0 border-b-2 pb-2 text-left transition"
                style={{
                  borderColor: active ? "var(--portal-accent-blue)" : "transparent",
                }}
              >
                <span
                  className={`block truncate text-[0.8125rem] font-semibold ${
                    active
                      ? "text-[var(--portal-accent-blue)]"
                      : "text-[var(--portal-title)]"
                  }`}
                >
                  {m.label}
                </span>
                <span className="mt-0.5 block truncate text-[0.6875rem] text-[var(--portal-muted)]">
                  {m.hint}
                </span>
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
                    <div className="mt-2 flex flex-col gap-2.5 text-sm">
                      {[
                        "Competitive (Teams Compete)",
                        "Collaborative (Teams Work Together)",
                        "Individual (No Teams)",
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
                          <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
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
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                      Decision Modules
                    </p>
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
                    {/* Figma places this beneath the list. */}
                    <p className="mt-3 text-[0.8125rem] font-semibold text-[var(--portal-accent-blue)]">
                      Select All | Clear All
                    </p>
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
            <div className="space-y-8 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 shadow-sm">
              {/* Sections follow professor_carry_forward_configuration_editable.
                  Decay rates and custom rules are not stored by the engine yet;
                  the categories below describe how prior state actually feeds
                  the next round today. */}
              <section>
                <ConfigStepHeading
                  n={1}
                  title="Carry-Forward Categories"
                  body="Enable and configure which outcomes persist and influence future rounds."
                />
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {CARRY_CATEGORIES.map((cat) => (
                    <article
                      key={cat.title}
                      className="flex flex-col rounded-xl border border-[var(--portal-sidebar-border)] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2.5">
                          <cat.Icon
                            className="h-5 w-5 shrink-0"
                            style={{ color: cat.tone }}
                            strokeWidth={2}
                          />
                          <span className="font-bold text-[var(--portal-title)]">
                            {cat.title}
                          </span>
                        </span>
                        <span
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold"
                          style={{ background: cat.soft, color: cat.tone }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: cat.tone }}
                          />
                          Enabled
                        </span>
                      </div>
                      <p className="mt-2 text-[0.8125rem] leading-snug text-[var(--portal-muted)]">
                        {cat.body}
                      </p>
                      <p className="mt-3 text-[0.8125rem] font-bold text-[var(--portal-title)]">
                        Key Carry-Forward Items
                      </p>
                      <ul className="mt-2 flex-1 space-y-2 text-[0.8125rem] text-[var(--portal-ink)]">
                        {cat.items.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <CheckCircle2
                              className="mt-0.5 h-4 w-4 shrink-0"
                              style={{ color: cat.tone }}
                              strokeWidth={2}
                            />
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => setTab("parameters")}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold"
                        style={{ borderColor: cat.tone, color: cat.tone }}
                      >
                        Edit Settings
                      </button>
                    </article>
                  ))}
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  Disabled categories will not affect future rounds. Current round
                  results remain, but no momentum will be applied.
                </p>
              </section>

              <section>
                <ConfigStepHeading
                  n={2}
                  title="Carry-Forward Decay Rates"
                  body="Results naturally diminish over time. Set how quickly the impact of past results fades."
                />
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                      <tr>
                        <th className="py-2 pr-3">Category</th>
                        <th className="py-2 pr-3">Decay Model</th>
                        <th className="py-2 pr-3">Impact Retained in Next Round</th>
                        <th className="py-2">Half-Life (Rounds)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CARRY_CATEGORIES.map((cat) => (
                        <tr
                          key={cat.title}
                          className="border-t border-[var(--portal-sidebar-border)]"
                        >
                          <td className="py-3 pr-3">
                            <span className="flex items-center gap-2.5 whitespace-nowrap text-[var(--portal-ink)]">
                              <cat.Icon
                                className="h-4 w-4 shrink-0"
                                style={{ color: cat.tone }}
                                strokeWidth={2}
                              />
                              {cat.title}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-[var(--portal-muted)]">
                            —
                          </td>
                          <td className="py-3 pr-3">
                            <span className="flex items-center gap-3">
                              <span className="h-1.5 w-32 rounded-full bg-[#eef1f4]" />
                              <span className="text-[var(--portal-muted)]">—</span>
                            </span>
                          </td>
                          <td className="py-3 text-[var(--portal-muted)]">—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  Decay models and half-lives are not stored by the engine yet.
                  Prior-round state currently carries forward in full.
                </p>
              </section>

              <section>
                <div className="flex items-start justify-between gap-3">
                  <ConfigStepHeading
                    n={3}
                    title="Custom Carry-Forward Rules (Optional)"
                    body="Add custom rules to model unique relationships between outcomes and future impacts."
                  />
                  <span className="shrink-0 rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-sm font-semibold text-[var(--portal-accent-blue)]">
                    + Add Custom Rule
                  </span>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                      <tr>
                        <th className="py-2 pr-3">Rule Name</th>
                        <th className="py-2 pr-3">Source Metric</th>
                        <th className="py-2 pr-3">Target Metric</th>
                        <th className="py-2 pr-3">Impact Type</th>
                        <th className="py-2 pr-3">Strength</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[var(--portal-sidebar-border)]">
                        <td colSpan={6} className="py-10 text-center">
                          <Layers3 className="mx-auto h-6 w-6 text-[var(--portal-muted)]" />
                          <p className="mt-2 text-[var(--portal-muted)]">
                            No custom rules configured.
                          </p>
                          <p className="text-[0.8125rem] text-[var(--portal-muted)]">
                            Custom carry-forward relationships are not a stored
                            feature yet.
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {tab === "scenarios" && (
            <div className="space-y-8 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 shadow-sm">
              {/* Sections follow scenario_test_editable. Results come from the
                  live scenario API — an industry shows — until it is run. */}
              <section>
                <ConfigStepHeading
                  n={1}
                  title="Select Test Parameters"
                  body="Choose the strategy and economy scenario for testing. The system will run each configured industry using default decisions."
                />
                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="block font-semibold text-[var(--portal-ink)]">
                        Strategy
                      </span>
                      <select
                        className={`${formSelectClassName} mt-1.5 w-full`}
                        value={scenarioStrategy}
                        onChange={(e) =>
                          setScenarioStrategy(e.target.value as Strategy)
                        }
                      >
                        {ALL_STRATEGIES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="block font-semibold text-[var(--portal-ink)]">
                        Economy Scenario
                      </span>
                      <select
                        className={`${formSelectClassName} mt-1.5 w-full`}
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
                  <aside className="rounded-xl border border-[#d7e4ff] bg-[#f5f9ff] p-4">
                    <p className="font-bold text-[var(--portal-accent-blue)]">
                      What This Does
                    </p>
                    <ul className="mt-3 space-y-2 text-[0.8125rem] text-[var(--portal-ink)]">
                      {[
                        "Runs the saved configuration for each industry.",
                        "Uses default (neutral) decisions for all HR modules.",
                        "Shows intermediate calculations and normalized metrics.",
                        "Helps you compare industries under the same conditions.",
                      ].map((line) => (
                        <li key={line} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                            strokeWidth={2}
                          />
                          <span className="leading-snug">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </aside>
                </div>
              </section>

              <section>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <ConfigStepHeading
                    n={2}
                    title="Industries to Test"
                    body="Select which industries to include in this scenario test."
                  />
                  <span className="flex shrink-0 gap-3 text-sm font-semibold text-[var(--portal-accent-blue)]">
                    <button
                      type="button"
                      onClick={() => setScenarioIndustries([...ALL_INDUSTRIES])}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setScenarioIndustries([])}
                    >
                      Clear All
                    </button>
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {ALL_INDUSTRIES.map((ind) => {
                    const on = scenarioIndustries.includes(ind);
                    return (
                      <button
                        key={ind}
                        type="button"
                        onClick={() =>
                          setScenarioIndustries((prev) =>
                            prev.includes(ind)
                              ? prev.filter((i) => i !== ind)
                              : [...prev, ind]
                          )
                        }
                        className={`flex flex-col items-center rounded-xl border p-4 ${
                          on
                            ? "border-[var(--portal-accent-blue)]"
                            : "border-[var(--portal-sidebar-border)]"
                        }`}
                      >
                        <Factory
                          className="h-5 w-5 text-[var(--portal-accent-blue)]"
                          strokeWidth={1.75}
                        />
                        <span className="mt-2 text-[0.8125rem] font-bold text-[var(--portal-title)]">
                          {ind}
                        </span>
                        <span
                          className={`mt-3 inline-flex h-4 w-4 items-center justify-center rounded border-2 ${
                            on
                              ? "border-[var(--portal-accent-blue)] bg-[var(--portal-accent-blue)] text-white"
                              : "border-[#c9ced6]"
                          }`}
                        >
                          {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Button
                  className="mt-4"
                  disabled={scenarioLoading || scenarioIndustries.length === 0}
                  onClick={() => void runScenarioTest()}
                >
                  <Play className="mr-1.5 h-4 w-4" />
                  {scenarioLoading ? "Running…" : "Run Scenario Test"}
                </Button>
              </section>

              <section>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <ConfigStepHeading
                    n={3}
                    title="Scenario Test Results Preview"
                    body="Projected outcomes using saved configuration and default decisions."
                  />
                  <button
                    type="button"
                    onClick={() => setTab("diagnostics")}
                    className="shrink-0 rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
                  >
                    View Detailed Calculations
                  </button>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                      <tr>
                        <th className="py-2 pr-3">Industry</th>
                        <th className="py-2 pr-3">Total Score (0-100)</th>
                        <th className="py-2 pr-3">Financial</th>
                        <th className="py-2 pr-3">Employee</th>
                        <th className="py-2 pr-3">Process</th>
                        <th className="py-2 pr-3">Learning</th>
                        <th className="py-2">Profit Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_INDUSTRIES.filter((i) =>
                        scenarioIndustries.includes(i)
                      ).map((ind) => {
                        const t = scenarioResults[ind];
                        const b = t?.bsc_scores;
                        return (
                          <tr
                            key={ind}
                            className="border-t border-[var(--portal-sidebar-border)]"
                          >
                            <td className="py-3 pr-3 whitespace-nowrap font-semibold text-[var(--portal-title)]">
                              {ind}
                            </td>
                            <td className="py-3 pr-3 font-semibold text-emerald-600">
                              {b ? b.total_score.toFixed(1) : "—"}
                            </td>
                            <td className="py-3 pr-3">
                              {b ? b.score_financial.toFixed(1) : "—"}
                            </td>
                            <td className="py-3 pr-3">
                              {b ? b.score_employee.toFixed(1) : "—"}
                            </td>
                            <td className="py-3 pr-3">
                              {b ? b.score_process.toFixed(1) : "—"}
                            </td>
                            <td className="py-3 pr-3">
                              {b ? b.score_learning.toFixed(1) : "—"}
                            </td>
                            <td className="py-3 text-[var(--portal-muted)]">
                              {t && t.financial_cascade.revenue
                                ? `${(
                                    (t.financial_cascade.profit /
                                      t.financial_cascade.revenue) *
                                    100
                                  ).toFixed(1)}%`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                      {scenarioIndustries.length === 0 && (
                        <tr className="border-t border-[var(--portal-sidebar-border)]">
                          <td
                            colSpan={7}
                            className="py-8 text-center text-[var(--portal-muted)]"
                          >
                            Select at least one industry to test.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  Scores are based on current benchmarks and multipliers. Results
                  are estimates for testing purposes only.
                </p>
              </section>
            </div>
          )}

          {tab === "process" && (
            <div className="space-y-8 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 shadow-sm">
              {/* Sections follow process_round_editable. Pre-checks are not
                  server-authoritative yet and processing history is not stored,
                  so those render as — rather than invented results. */}
              <section>
                <ConfigStepHeading
                  n={1}
                  title="Round to Process"
                  body="Run the next round of the simulation. The system will process all team decisions and update results based on your current configuration."
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="block text-sm">
                    <span className="block font-semibold text-[var(--portal-ink)]">
                      Session
                    </span>
                    <select
                      className={`${formSelectClassName} mt-1.5 w-full`}
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
                  <label className="block text-sm">
                    <span className="block font-semibold text-[var(--portal-ink)]">
                      Next Round to Process
                    </span>
                    <select
                      className={`${formSelectClassName} mt-1.5 w-full`}
                      value={processRoundId}
                      onChange={(e) => setProcessRoundId(e.target.value)}
                      disabled={!selectedSession}
                    >
                      <option value="">Select round…</option>
                      {selectedSession?.rounds.map((r) => (
                        <option key={r.id} value={r.id}>
                          Round {r.round_number}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="text-sm">
                    <span className="block font-semibold text-[var(--portal-ink)]">
                      Round Type
                    </span>
                    <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-[0.6875rem] font-semibold capitalize text-emerald-700">
                      {selectedSession?.rounds.find(
                        (r) => r.id === processRoundId
                      )?.round_type ?? "—"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="block font-semibold text-[var(--portal-ink)]">
                      Decision Deadline
                    </span>
                    <span className="mt-2 block text-[var(--portal-muted)]">
                      —
                    </span>
                  </div>
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  All submitted decisions will be included in this round. Teams
                  that have not submitted will use default decisions.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => void processRound()}
                  disabled={!processSessionId || !processRoundId}
                >
                  <Play className="mr-1.5 h-4 w-4" />
                  Process Next Round
                </Button>
              </section>

              <section>
                <ConfigStepHeading
                  n={2}
                  title="Pre-Processing Checks"
                  body="The system will validate all requirements before processing the round."
                />
                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                        <tr>
                          <th className="py-2 pr-3">Check</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PRE_CHECKS.map((c) => (
                          <tr
                            key={c.name}
                            className="border-t border-[var(--portal-sidebar-border)]"
                          >
                            <td className="py-3 pr-3 whitespace-nowrap font-semibold text-[var(--portal-title)]">
                              {c.name}
                            </td>
                            <td className="py-3 pr-3 text-[var(--portal-muted)]">
                              —
                            </td>
                            <td className="py-3 text-[var(--portal-muted)]">
                              {c.detail}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                      Pre-checks are not server-authoritative yet. Processing
                      validates decisions through the existing engine.
                    </p>
                  </div>
                  <aside className="rounded-xl border border-[var(--portal-sidebar-border)] p-4">
                    <p className="font-bold text-[var(--portal-title)]">
                      What Happens When You Process
                    </p>
                    <ul className="mt-3 space-y-2.5 text-[0.8125rem] text-[var(--portal-ink)]">
                      {[
                        "All submitted decisions are locked.",
                        "Outcomes are calculated using your configuration.",
                        "Scores and reports are generated.",
                        "Carry-forward effects are applied to the next round.",
                        "Teams can view the processed round's results.",
                      ].map((line) => (
                        <li key={line} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                            strokeWidth={2}
                          />
                          <span className="leading-snug">{line}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/sessions/professor-resources/reference/mechanics"
                      className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
                    >
                      Learn more about Processing Rounds
                    </Link>
                  </aside>
                </div>
              </section>

              <section>
                <ConfigStepHeading
                  n={3}
                  title="Round Processing History"
                  body="Review when each round was processed and by whom."
                />
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                      <tr>
                        <th className="py-2 pr-3">Round</th>
                        <th className="py-2 pr-3">Type</th>
                        <th className="py-2 pr-3">Processed On</th>
                        <th className="py-2 pr-3">Processed By</th>
                        <th className="py-2 pr-3">Teams</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSession && selectedSession.rounds.length > 0 ? (
                        selectedSession.rounds.map((r) => (
                          <tr
                            key={r.id}
                            className="border-t border-[var(--portal-sidebar-border)]"
                          >
                            <td className="py-3 pr-3 whitespace-nowrap">
                              Round {r.round_number}
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap capitalize">
                              {r.round_type}
                            </td>
                            <td className="py-3 pr-3 text-[var(--portal-muted)]">
                              —
                            </td>
                            <td className="py-3 pr-3 text-[var(--portal-muted)]">
                              —
                            </td>
                            <td className="py-3 pr-3 text-[var(--portal-muted)]">
                              —
                            </td>
                            <td className="py-3 pr-3">
                              <span
                                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold capitalize ${
                                  r.status === "closed"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-[#eef1f4] text-[var(--portal-muted)]"
                                }`}
                              >
                                {r.status === "closed" ? "Completed" : r.status}
                              </span>
                            </td>
                            <td className="py-3 text-[var(--portal-muted)]">—</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-t border-[var(--portal-sidebar-border)]">
                          <td
                            colSpan={7}
                            className="py-8 text-center text-[var(--portal-muted)]"
                          >
                            Select a session to see its rounds.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  Processed-on, processed-by and duration are not recorded by the
                  engine yet.
                </p>
              </section>

              <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3.5">
                <p className="flex items-start gap-3 text-sm text-[var(--portal-ink)]">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                    strokeWidth={2}
                  />
                  <span>
                    <b>Important:</b> Processing a round cannot be undone. Please
                    ensure all settings and decisions are correct before
                    proceeding.
                  </span>
                </p>
                <Link
                  href="/sessions/testing"
                  className="rounded-md border border-[var(--portal-accent-blue)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
                >
                  Go to Testing Center
                </Link>
              </section>
            </div>
          )}

          {tab === "diagnostics" && (
            <div className="space-y-8">
              {/* Sections follow the Diagnostics screen (simulation_lab_
                  configuration_editable, 0qjKhx…). Health verdicts, issue
                  counts and run history are not recorded by the engine, so
                  those render as — above the live engine panels. */}
              <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 shadow-sm">
                <ConfigStepHeading
                  n={1}
                  title="System Health Overview"
                  body="Overall status of your current configuration and simulation engine."
                />
                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {HEALTH_CARDS.map((h) => (
                      <div
                        key={h.title}
                        className="rounded-xl border border-[var(--portal-sidebar-border)] px-4 py-3.5"
                      >
                        <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-[var(--portal-title)]">
                          <h.Icon
                            className="h-4 w-4 shrink-0 text-[var(--portal-muted)]"
                            strokeWidth={2}
                          />
                          {h.title}
                        </p>
                        <p className="mt-1.5 text-lg font-bold text-[var(--portal-muted)]">
                          —
                        </p>
                        <p className="text-[0.75rem] text-[var(--portal-muted)]">
                          {h.body}
                        </p>
                      </div>
                    ))}
                  </div>
                  <aside className="rounded-xl border border-[#d7e4ff] bg-[#f5f9ff] p-4">
                    <p className="font-bold text-[var(--portal-accent-blue)]">
                      What Diagnostics Check
                    </p>
                    <ul className="mt-3 space-y-2 text-[0.8125rem] text-[var(--portal-ink)]">
                      {[
                        "Configuration completeness and validity",
                        "Engine formulas and calculation logic",
                        "Data integrity and relationships",
                        "Scenario and multiplier consistency",
                        "Benchmark and threshold alignment",
                        "Carry-forward and round logic",
                      ].map((line) => (
                        <li key={line} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                            strokeWidth={2}
                          />
                          <span className="leading-snug">{line}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/sessions/professor-resources/reference/mechanics"
                      className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
                    >
                      Learn more about Diagnostics
                    </Link>
                  </aside>
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  Last diagnostic run: — · Diagnostic run history is not stored.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 shadow-sm">
                <ConfigStepHeading
                  n={2}
                  title="Diagnostics Tools"
                  body="Use these tools to test specific areas of the simulation engine."
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {DIAGNOSTIC_TOOLS.map((t) => (
                    <article
                      key={t.title}
                      className="flex flex-col rounded-xl border border-[var(--portal-sidebar-border)] p-4"
                    >
                      <t.Icon
                        className="h-5 w-5 text-violet-600"
                        strokeWidth={1.75}
                      />
                      <p className="mt-2 text-[0.8125rem] font-bold text-[var(--portal-title)]">
                        {t.title}
                      </p>
                      <p className="mt-1 flex-1 text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                        {t.body}
                      </p>
                      <button
                        type="button"
                        onClick={() => setTab(t.goTo)}
                        className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
                      >
                        Open Tool
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 shadow-sm">
                <ConfigStepHeading
                  n={3}
                  title="Diagnostic Results (Recent)"
                  body="View the most recent diagnostic results and issues."
                />
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                      <tr>
                        <th className="py-2 pr-3">Check Area</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Issues Found</th>
                        <th className="py-2 pr-3">Severity</th>
                        <th className="py-2">Last Checked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DIAGNOSTIC_AREAS.map((area) => (
                        <tr
                          key={area}
                          className="border-t border-[var(--portal-sidebar-border)]"
                        >
                          <td className="py-3 pr-3 whitespace-nowrap text-[var(--portal-ink)]">
                            {area}
                          </td>
                          <td className="py-3 pr-3 text-[var(--portal-muted)]">
                            —
                          </td>
                          <td className="py-3 pr-3 text-[var(--portal-muted)]">
                            —
                          </td>
                          <td className="py-3 pr-3 text-[var(--portal-muted)]">
                            —
                          </td>
                          <td className="py-3 text-[var(--portal-muted)]">—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  Diagnostic results are not persisted. The live engine panels
                  below reflect the current configuration.
                </p>
              </section>

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
            <div className="space-y-8 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 shadow-sm">
              {/* Sections follow export_configuration_editable. The app exports
                  scenario results as JSON or CSV; per-scope selection, file
                  metadata and sharing controls are not stored settings. */}
              <section>
                <ConfigStepHeading
                  n={1}
                  title="Select Export Scope"
                  body="Choose what you want to include in the export file."
                />
                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {EXPORT_SCOPES.map((sc) => (
                      <article
                        key={sc.title}
                        className="flex flex-col items-center rounded-xl border border-[var(--portal-sidebar-border)] p-4 text-center"
                      >
                        <sc.Icon
                          className="h-6 w-6"
                          style={{ color: sc.tone }}
                          strokeWidth={1.75}
                        />
                        <p className="mt-2.5 text-[0.8125rem] font-bold text-[var(--portal-title)]">
                          {sc.title}
                        </p>
                        <p className="mt-1 flex-1 text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                          {sc.body}
                        </p>
                        <span className="mt-3 inline-flex h-4 w-4 items-center justify-center rounded bg-[var(--portal-accent-blue)] text-white">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      </article>
                    ))}
                  </div>
                  <aside className="rounded-xl border border-[#d7e4ff] bg-[#f5f9ff] p-4">
                    <p className="font-bold text-[var(--portal-accent-blue)]">
                      What&apos;s Included
                    </p>
                    <ul className="mt-3 space-y-2 text-[0.8125rem] text-[var(--portal-ink)]">
                      {[
                        "All configuration modules",
                        "Industry and strategy definitions",
                        "Economic assumptions",
                        "Benchmarks and thresholds",
                        "Carry-forward settings",
                        "Round and scenario settings",
                      ].map((line) => (
                        <li key={line} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                            strokeWidth={2}
                          />
                          <span className="leading-snug">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </aside>
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  Sensitive data (student decisions and results) is never
                  included in a configuration export.
                </p>
              </section>

              <section>
                <ConfigStepHeading
                  n={2}
                  title="Export Format"
                  body="Choose the format for your export file."
                />
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <article className="flex flex-col rounded-xl border-2 border-[var(--portal-accent-blue)] p-4">
                    <p className="font-bold text-[var(--portal-title)]">
                      JSON (Recommended)
                    </p>
                    <p className="mt-1 text-[0.8125rem] text-[var(--portal-muted)]">
                      Complete configuration in a structured JSON file.
                    </p>
                    <ul className="mt-3 flex-1 space-y-2 text-[0.8125rem]">
                      {[
                        "Preserves all relationships",
                        "Best for importing and system use",
                      ].map((l) => (
                        <li key={l} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                            strokeWidth={2}
                          />
                          {l}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-center text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                      .json
                    </p>
                    <Button
                      className="mt-3"
                      onClick={() => void exportScenarios("json")}
                    >
                      Export Now
                    </Button>
                  </article>
                  <article className="flex flex-col rounded-xl border border-[var(--portal-sidebar-border)] p-4">
                    <p className="font-bold text-[var(--portal-title)]">
                      CSV (Summary Only)
                    </p>
                    <p className="mt-1 text-[0.8125rem] text-[var(--portal-muted)]">
                      Summary tables for review and documentation.
                    </p>
                    <ul className="mt-3 flex-1 space-y-2 text-[0.8125rem]">
                      {["Human-readable format", "Best for analysis and reporting"].map(
                        (l) => (
                          <li key={l} className="flex items-start gap-2.5">
                            <CheckCircle2
                              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                              strokeWidth={2}
                            />
                            {l}
                          </li>
                        )
                      )}
                    </ul>
                    <p className="mt-3 text-center text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                      .csv
                    </p>
                    <Button
                      variant="outline"
                      className="mt-3"
                      onClick={() => void exportScenarios("csv")}
                    >
                      Export Now
                    </Button>
                  </article>
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  A ZIP archive bundle, file naming and version metadata are not
                  produced by the exporter yet.
                </p>
              </section>

              <section>
                <ConfigStepHeading
                  n={3}
                  title="Security & Access"
                  body="Control who can use this exported configuration."
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Sharing Level", "Instructor Only (Private)"],
                    ["Password Protection (Optional)", "—"],
                    ["Expiration (Optional)", "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="text-sm">
                      <span className="block font-semibold text-[var(--portal-ink)]">
                        {label}
                      </span>
                      <span className="mt-1.5 block rounded-md border border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-3 py-2 text-[var(--portal-muted)]">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  Exports download directly to your machine. Sharing, password
                  protection and expiry are not stored settings.
                </p>
              </section>
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

      {/* Figma closes every configuration screen with this amber note. */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3.5">
        <p className="flex items-start gap-3 text-sm text-[var(--portal-ink)]">
          <Sun className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" strokeWidth={2} />
          Configuration changes affect future rounds only. Test scenarios in the
          Testing Center before applying major changes.
        </p>
        <Link
          href="/sessions/testing"
          className="rounded-md border border-[var(--portal-accent-blue)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
        >
          Go to Testing Center
        </Link>
      </section>
    </div>
  );
}
