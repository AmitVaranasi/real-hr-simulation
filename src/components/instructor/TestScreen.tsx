"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Check,
  CheckCircle2,
  Cog,
  Download,
  FileCog,
  FlaskConical,
  HelpCircle,
  Info,
  MoveHorizontal,
  Play,
  RefreshCw,
  Save,
  Search,
  Settings,
  Sun,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProfessorPageGrid,
  type CourseRailState,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import {
  formInputClassName,
  formSelectClassName,
} from "@/components/ui/form-controls";
import { INDUSTRY_CONFIGS, STRATEGY_CONFIGS } from "@/lib/engine/config";
import type { Industry, Strategy } from "@/lib/engine/types";

/* Each test screen in the Figma set (multiplier_impact_test_editable_checked,
   decision_sensitivity_test_editable_checked, stress_test_editable_checked,
   carry_forward_test_editable_checked, custom_test_editable_checked,
   scenario_test_editable) shares this skeleton and differs in steps 1 and 2.
   Results and test history are not stored by the engine, so step 4 shows the
   result shape with — rather than invented figures. */

const INDUSTRIES = Object.keys(INDUSTRY_CONFIGS) as Industry[];
const STRATEGIES = Object.keys(STRATEGY_CONFIGS) as Strategy[];

const MODULE_LABELS: Array<{ key: string; label: string; category: string }> = [
  { key: "recruitment", label: "Recruitment & Selection Effectiveness", category: "Recruitment & Selection" },
  { key: "performance", label: "Performance Management Impact", category: "Performance Management" },
  { key: "training", label: "Training & Development Effectiveness", category: "Training & Development" },
  { key: "relations", label: "Employee Relations Effectiveness", category: "Employee Relations" },
  { key: "compensation", label: "Compensation & Benefits Impact", category: "Compensation & Benefits" },
  { key: "org_design", label: "Org Design & Change Impact", category: "Org Design & Change" },
  { key: "dei", label: "DEI Initiatives Impact", category: "DEI Initiatives" },
];

export type TestId =
  | "scenario"
  | "multiplier"
  | "sensitivity"
  | "stress"
  | "carry-forward"
  | "custom";

const TESTS: Record<
  TestId,
  {
    title: string;
    subtitle: string;
    Icon: typeof FlaskConical;
    step1: string;
    step1Body: string;
    about: string[];
    resultColumns: string[];
    resultRowsLabel: string;
  }
> = {
  scenario: {
    title: "Scenario Test",
    subtitle:
      "Test outcomes under different economic and competitive scenarios to preview results before applying changes.",
    Icon: FlaskConical,
    step1: "Select Scenarios to Test",
    step1Body: "Choose which industries to include in this scenario test.",
    about: [
      "Runs the saved configuration for each industry.",
      "Uses default (neutral) decisions for all HR modules.",
      "Helps you compare industries under the same conditions.",
    ],
    resultColumns: ["Industry", "Total Score", "Financial", "Employee", "Process", "Learning"],
    resultRowsLabel: "industry",
  },
  multiplier: {
    title: "Multiplier Impact Test",
    subtitle:
      "Evaluate how industry and strategy multipliers influence outcomes. Compare your current multipliers against baseline (1.00) to ensure appropriate impact and balance.",
    Icon: BarChart3,
    step1: "Select Multipliers to Test",
    step1Body: "Choose which multipliers you want to evaluate.",
    about: [
      "Multipliers with strong influence",
      "Potentially overpowering effects",
      "Appropriate balance across areas",
      "Sensitivity to multiplier changes",
    ],
    resultColumns: [
      "Multiplier",
      "Current Value",
      "Baseline (1.00)",
      "Primary Outcome Impact",
      "Impact Level",
      "Assessment",
    ],
    resultRowsLabel: "multiplier",
  },
  sensitivity: {
    title: "Decision Sensitivity Test",
    subtitle:
      "Analyze how changes to a specific decision or input level influence key outcome metrics. This test helps identify overly sensitive or under-sensitive decisions in your configuration.",
    Icon: Target,
    step1: "Select Decision to Test",
    step1Body: "Choose the decision you want to analyze.",
    about: [
      "Applies incremental changes to the selected decision while keeping all others constant.",
      "Reveals how sensitive key outcomes are to changes in this decision.",
    ],
    resultColumns: ["Change", "Training", "Productivity", "Engagement", "Profit Margin", "Turnover Rate"],
    resultRowsLabel: "step",
  },
  stress: {
    title: "Stress Test",
    subtitle:
      "Push the simulation engine to extreme conditions to confirm it stays stable and produces sensible results.",
    Icon: Zap,
    step1: "Select Stress Conditions",
    step1Body: "Choose which extreme conditions to apply.",
    about: [
      "Applies extreme values at the edges of allowed ranges.",
      "Confirms the engine does not produce invalid results.",
      "Highlights conditions that destabilise scoring.",
    ],
    resultColumns: ["Condition", "Applied Value", "Total Score", "Profit Margin", "Stability"],
    resultRowsLabel: "condition",
  },
  "carry-forward": {
    title: "Carry-Forward Test",
    subtitle:
      "Validate how outcomes from one round carry into the next across multiple rounds.",
    Icon: MoveHorizontal,
    step1: "Select Carry-Forward Categories",
    step1Body: "Choose which categories to trace across rounds.",
    about: [
      "Runs consecutive rounds using the saved configuration.",
      "Shows how prior-round state seeds the next round.",
      "Highlights compounding or fading effects.",
    ],
    resultColumns: ["Round", "Workforce", "Financial", "Knowledge", "Total Score"],
    resultRowsLabel: "round",
  },
  custom: {
    title: "Custom Test",
    subtitle:
      "Build a custom test with specific variables and rules to answer your own what-if questions.",
    Icon: Search,
    step1: "Define Test Variables",
    step1Body: "Choose the variables and rules for this custom test.",
    about: [
      "Combine any industry, strategy and economy.",
      "Adjust rounds and team counts freely.",
      "Useful for one-off questions not covered by the standard tests.",
    ],
    resultColumns: ["Variable", "Value", "Total Score", "Profit Margin", "Notes"],
    resultRowsLabel: "variable",
  },
};

const ADDITIONAL_OPTIONS = [
  "Apply Current Carry-Forward Rules",
  "Include Benchmark Comparison",
  "Show Detailed Calculations",
];

export function TestScreen({
  rail,
  test,
}: {
  rail: CourseRailState;
  test: TestId;
}) {
  const cfg = TESTS[test];
  const [industry, setIndustry] = useState<Industry>(INDUSTRIES[0]);
  const [strategy, setStrategy] = useState<Strategy>(STRATEGIES[0]);
  const [economy, setEconomy] = useState("normal");
  const [rounds, setRounds] = useState("5 Rounds (Standard)");
  const [teams, setTeams] = useState("All teams in this course");
  const [options, setOptions] = useState<string[]>(ADDITIONAL_OPTIONS.slice(0, 2));
  const [selected, setSelected] = useState<string[]>(
    test === "multiplier"
      ? MODULE_LABELS.map((m) => m.key)
      : test === "scenario"
        ? [...INDUSTRIES]
        : []
  );
  const [decisionModule, setDecisionModule] = useState("training");
  const [rangeFrom, setRangeFrom] = useState("-20");
  const [rangeTo, setRangeTo] = useState("+20");
  const [rangeStep, setRangeStep] = useState("5");

  const multipliers = INDUSTRY_CONFIGS[industry].module_multipliers as Record<
    string,
    number
  >;

  function toggle(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  return (
    <ProfessorPageGrid
      rail={
        <>
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Configuration Summary
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Industry", industry],
                ["Strategy", strategy],
                ["Economy", economy],
                ["Rounds", rounds.replace(" (Standard)", "")],
                ["Teams", teams],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-[var(--portal-muted)]">{k}</dt>
                  <dd className="text-right font-semibold text-[var(--portal-title)]">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href="/sessions/config/overview"
              className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View Full Summary
            </Link>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Engine Health
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              {[
                ["Engine Status", "Operational"],
                ["Calculation Accuracy", "—"],
                ["Response Time", "—"],
                ["Last Checked", "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    strokeWidth={2}
                  />
                  <div className="min-w-0">
                    <dt className="font-medium text-[var(--portal-ink)]">{k}</dt>
                    <dd className="text-[var(--portal-muted)]">{v}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Quick Actions
            </h2>
            <ul className="mt-3 space-y-3 text-sm">
              {[
                { label: "Save Test as Template", body: "Reuse this test", Icon: Save },
                { label: "View Test History", body: "See all past tests", Icon: RefreshCw },
                { label: "Export Test Results", body: "Download this report", Icon: Download },
                { label: "Help & Documentation", body: "Learn about testing", Icon: HelpCircle, href: "/sessions/help" },
              ].map(({ label, body, Icon, href }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <Icon
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]"
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0">
                    {href ? (
                      <Link
                        href={href}
                        className="block font-semibold text-[var(--portal-accent-blue)] hover:underline"
                      >
                        {label}
                      </Link>
                    ) : (
                      <span className="block font-semibold text-[var(--portal-title)]">
                        {label}
                      </span>
                    )}
                    <span className="block text-[0.75rem] text-[var(--portal-muted)]">
                      {body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      }
    >
      <ProfessorPageHeader
        title={cfg.title}
        subtitle={cfg.subtitle}
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Simulation Lab", href: "/sessions/lab" },
          { label: "Testing Center", href: "/sessions/testing" },
          { label: cfg.title },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/sessions/testing"
              className="rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)]"
            >
              ← Back to Testing Center
            </Link>
            <span className="rounded-md border border-[var(--portal-sidebar-border)] px-3.5 py-2 text-sm font-semibold">
              Load Saved Test
            </span>
            <Link
              href="/sessions/config/scenario-test"
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-white"
            >
              <Play className="h-4 w-4" strokeWidth={2} />
              Run {cfg.title}
            </Link>
          </div>
        }
      />

      {/* Engine/config strip */}
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-3 text-sm shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Configuration Version", value: "—", Icon: FileCog },
            { label: "Engine Version", value: "—", Icon: Cog },
            { label: "Industry", value: industry, Icon: BarChart3 },
            { label: "Strategy", value: strategy, Icon: Target },
            { label: "Economy", value: economy, Icon: Settings },
            { label: "Status", value: "Engine Ready", Icon: CheckCircle2, ok: true },
          ].map(({ label, value, Icon, ok }) => (
            <div key={label} className="flex items-start gap-2.5">
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  ok ? "text-emerald-600" : "text-[var(--portal-accent-blue)]"
                }`}
                strokeWidth={1.75}
              />
              <div className="min-w-0">
                <p className="text-[0.6875rem] font-bold uppercase leading-tight text-[var(--portal-muted)]">
                  {label}
                </p>
                <p className={`font-semibold ${ok ? "text-emerald-700" : ""}`}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Step 1 — per test */}
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <TestStep n={1} title={cfg.step1} body={cfg.step1Body} />

        {test === "multiplier" ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                <tr>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Multiplier</th>
                  <th className="py-2 pr-3">Current Value</th>
                  <th className="py-2 pr-3">Baseline (1.00)</th>
                  <th className="py-2 pr-3">% Above / Below</th>
                  <th className="py-2">Test</th>
                </tr>
              </thead>
              <tbody>
                {MODULE_LABELS.map((m) => {
                  const v = multipliers[m.key] ?? 1;
                  const pct = Math.round((v - 1) * 100);
                  return (
                    <tr
                      key={m.key}
                      className="border-t border-[var(--portal-sidebar-border)]"
                    >
                      <td className="py-3 pr-3 whitespace-nowrap">{m.category}</td>
                      <td className="py-3 pr-3 text-[var(--portal-muted)]">
                        {m.label}
                      </td>
                      <td className="py-3 pr-3 tabular-nums">{v.toFixed(2)}</td>
                      <td className="py-3 pr-3 tabular-nums text-[var(--portal-muted)]">
                        1.00
                      </td>
                      <td
                        className={`py-3 pr-3 tabular-nums font-semibold ${
                          pct > 0
                            ? "text-emerald-600"
                            : pct < 0
                              ? "text-rose-600"
                              : "text-[var(--portal-muted)]"
                        }`}
                      >
                        {pct > 0 ? "+" : ""}
                        {pct}%
                      </td>
                      <td className="py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[var(--portal-accent-blue)]"
                          checked={selected.includes(m.key)}
                          onChange={() => toggle(m.key)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Baseline (1.00) represents neutral impact with no multiplier effect.
              Values come from the selected industry&apos;s configuration.
            </p>
          </div>
        ) : test === "sensitivity" ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <label className="block text-sm">
              <span className="block font-semibold text-[var(--portal-ink)]">
                Decision Module
              </span>
              <select
                className={`${formSelectClassName} mt-1.5 w-full`}
                value={decisionModule}
                onChange={(e) => setDecisionModule(e.target.value)}
              >
                {MODULE_LABELS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.category}
                  </option>
                ))}
              </select>
            </label>
            <div className="text-sm">
              <span className="block font-semibold text-[var(--portal-ink)]">
                Current Multiplier
              </span>
              <p className="mt-1.5 text-lg font-bold text-[var(--portal-title)]">
                {(multipliers[decisionModule] ?? 1).toFixed(2)}
              </p>
              <p className="text-[0.75rem] text-[var(--portal-muted)]">
                for {industry}
              </p>
            </div>
            <aside className="rounded-xl border border-[#d7e4ff] bg-[#f5f9ff] p-4">
              <p className="font-bold text-[var(--portal-accent-blue)]">
                About This Test
              </p>
              <ul className="mt-2 space-y-2 text-[0.8125rem] text-[var(--portal-ink)]">
                {cfg.about.map((a) => (
                  <li key={a} className="leading-snug">
                    {a}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {(test === "scenario" ? INDUSTRIES : STEP1_ITEMS[test]).map((item) => {
              const on = selected.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(item)}
                  className={`flex flex-col items-center rounded-xl border p-4 text-center ${
                    on
                      ? "border-[var(--portal-accent-blue)]"
                      : "border-[var(--portal-sidebar-border)]"
                  }`}
                >
                  <cfg.Icon
                    className="h-5 w-5 text-[var(--portal-accent-blue)]"
                    strokeWidth={1.75}
                  />
                  <span className="mt-2 text-[0.8125rem] font-bold text-[var(--portal-title)]">
                    {item}
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
        )}
      </section>

      {/* Step 2 */}
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <TestStep
          n={2}
          title="Configure Test Parameters"
          body="Set the environment and simulation parameters for this test."
        />
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="block font-semibold text-[var(--portal-ink)]">
                Industry
              </span>
              <select
                className={`${formSelectClassName} mt-1.5 w-full`}
                value={industry}
                onChange={(e) => setIndustry(e.target.value as Industry)}
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="block font-semibold text-[var(--portal-ink)]">
                Strategy
              </span>
              <select
                className={`${formSelectClassName} mt-1.5 w-full`}
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as Strategy)}
              >
                {STRATEGIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-4">
            {test === "sensitivity" ? (
              <div>
                <p className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
                  Test Range
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    ["From", rangeFrom, setRangeFrom],
                    ["To", rangeTo, setRangeTo],
                    ["Step", rangeStep, setRangeStep],
                  ].map(([label, value, setter]) => (
                    <label key={label as string} className="block text-sm">
                      <span className="block text-[0.75rem] font-semibold text-[var(--portal-muted)]">
                        {label as string}
                      </span>
                      <input
                        className={`${formInputClassName} mt-1 w-full`}
                        value={value as string}
                        onChange={(e) =>
                          (setter as (v: string) => void)(e.target.value)
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <label className="block text-sm">
              <span className="block font-semibold text-[var(--portal-ink)]">
                Rounds to Simulate
              </span>
              <select
                className={`${formSelectClassName} mt-1.5 w-full`}
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
              >
                <option>5 Rounds (Standard)</option>
                <option>3 Rounds</option>
                <option>1 Round</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="block font-semibold text-[var(--portal-ink)]">
                Economy Scenario
              </span>
              <select
                className={`${formSelectClassName} mt-1.5 w-full`}
                value={economy}
                onChange={(e) => setEconomy(e.target.value)}
              >
                <option value="boom">Boom</option>
                <option value="normal">Normal</option>
                <option value="recession">Recession</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="block font-semibold text-[var(--portal-ink)]">
                Teams in Test
              </span>
              <select
                className={`${formSelectClassName} mt-1.5 w-full`}
                value={teams}
                onChange={(e) => setTeams(e.target.value)}
              >
                <option>All teams in this course</option>
                <option>Single sample team</option>
              </select>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
                Additional Options
              </p>
              <ul className="mt-2 space-y-3">
                {ADDITIONAL_OPTIONS.map((o) => (
                  <li key={o}>
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--portal-accent-blue)]"
                        checked={options.includes(o)}
                        onChange={() =>
                          setOptions((prev) =>
                            prev.includes(o)
                              ? prev.filter((x) => x !== o)
                              : [...prev, o]
                          )
                        }
                      />
                      <span className="text-[0.8125rem] text-[var(--portal-ink)]">
                        {o}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            {test !== "sensitivity" ? (
              <aside className="rounded-xl border border-[#d7e4ff] bg-[#f5f9ff] p-4">
                <p className="font-bold text-[var(--portal-accent-blue)]">
                  About This Test
                </p>
                <ul className="mt-2 space-y-2 text-[0.8125rem] text-[var(--portal-ink)]">
                  {cfg.about.map((a) => (
                    <li key={a} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--portal-accent-blue)]" />
                      <span className="leading-snug">{a}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
          </div>
        </div>
      </section>

      {/* Step 3 */}
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <TestStep n={3} title="Run Test" body="Review settings and run the test." />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <dl className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Test Type", cfg.title],
              ["Industry", industry],
              ["Strategy", strategy],
              ["Rounds", rounds.replace(" (Standard)", "")],
              [
                test === "multiplier" || test === "scenario"
                  ? "Selected"
                  : "Economy",
                test === "multiplier" || test === "scenario"
                  ? `${selected.length} Selected`
                  : economy,
              ],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[0.75rem] font-semibold text-[var(--portal-muted)]">
                  {k}
                </dt>
                <dd className="mt-0.5 text-[0.8125rem] font-bold text-[var(--portal-title)]">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <Link href="/sessions/config/scenario-test">
            <Button>
              <Play className="mr-1.5 h-4 w-4" />
              Run {cfg.title}
            </Button>
          </Link>
        </div>
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          Only the scenario runner is wired to the engine today. Running this
          test opens Scenario Test in the Configuration centre.
        </p>
      </section>

      {/* Step 4 */}
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <TestStep
          n={4}
          title="Test Result Summary"
          body={`Impact on key outcomes (${rounds.replace(" (Standard)", "")}, ${teams.toLowerCase()}).`}
        />
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                {cfg.resultColumns.map((c) => (
                  <th key={c} className="py-2 pr-3 whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[var(--portal-sidebar-border)]">
                <td
                  colSpan={cfg.resultColumns.length}
                  className="py-10 text-center text-[var(--portal-muted)]"
                >
                  No results yet — this test has no dedicated engine, and test
                  results are not stored.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3.5">
        <p className="flex items-start gap-3 text-sm text-[var(--portal-ink)]">
          <Sun className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" strokeWidth={2} />
          Testing helps ensure your configuration creates the learning experience
          you intend. Run tests after major changes or before processing rounds.
        </p>
        <Link
          href="/sessions/config/process-round"
          className="rounded-md border border-[var(--portal-accent-blue)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
        >
          Go to Process Round
        </Link>
      </section>
    </ProfessorPageGrid>
  );
}

const STEP1_ITEMS: Record<string, string[]> = {
  stress: [
    "Maximum Budget",
    "Zero Budget",
    "Extreme Turnover",
    "Peak Demand",
    "Deep Recession",
  ],
  "carry-forward": ["Workforce Results", "Financial Results", "Knowledge & Capabilities"],
  custom: ["Industry", "Strategy", "Economy", "Budget", "Rounds"],
  scenario: [],
};

function TestStep({
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
        <h2 className="font-bold text-[var(--portal-title)]">{title}</h2>
        <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
          {body}
        </p>
      </div>
    </div>
  );
}
