"use client";

import { useState } from "react";
import {
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Factory,
  FileCog,
  Download,
  FlaskConical,
  HelpCircle,
  Info,
  MoveHorizontal,
  PlayCircle,
  Search,
  Settings,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { TestingLaboratory } from "@/components/instructor/TestingLaboratory";
import {
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  type CourseRailState,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import { formSelectClassName } from "@/components/ui/form-controls";

export const TEST_TYPES = [
  {
    id: "scenario",
    title: "Scenario Test",
    body: "Test outcomes under different economic and competitive scenarios.",
  },
  {
    id: "multiplier",
    title: "Multiplier Impact Test",
    body: "Evaluate the effect of strategy and industry multipliers.",
  },
  {
    id: "sensitivity",
    title: "Decision Sensitivity Test",
    body: "Analyze how decision changes impact key metrics.",
  },
  {
    id: "stress",
    title: "Stress Test",
    body: "Push the system to extreme conditions to test stability.",
  },
  {
    id: "carry-forward",
    title: "Carry-Forward Test",
    body: "Validate carry-forward rules across multiple rounds.",
  },
  {
    id: "custom",
    title: "Custom Test",
    body: "Build a custom test with specific variables and rules.",
  },
] as const;


/* Parameters, tips and step copy transcribed from testing_center_editable_checked. */
const TEST_ICONS: Record<string, typeof FlaskConical> = {
  scenario: FlaskConical,
  multiplier: BarChart3,
  sensitivity: Target,
  stress: Zap,
  "carry-forward": MoveHorizontal,
  custom: Search,
};

const SCENARIOS = [
  { id: "boom", label: "Boom Economy", body: "Strong growth, high demand" },
  { id: "moderate", label: "Moderate Growth", body: "Steady growth, moderate demand" },
  { id: "recession", label: "Recession", body: "Economic decline, reduced demand" },
  { id: "stagflation", label: "Stagflation", body: "High inflation, low growth" },
  { id: "disruption", label: "Global Disruption", body: "Supply chain and market shock" },
];

const INTENSITY = ["Low", "Moderate", "High"];

const OPTIONS = [
  "Include Benchmark Comparison",
  "Apply All Multipliers",
  "Use Current Carry-Forward Rules",
  "Show Detailed Calculations",
];

const TIPS = [
  "Test major changes before applying them.",
  "Compare multiple scenarios to understand range of outcomes.",
  "Use stress tests to validate system stability.",
];

function StepHeading({
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

export function TestingCenterHub({
  rail,
  selected,
}: {
  rail: CourseRailState;
  selected?: string;
}) {
  const current =
    TEST_TYPES.find((t) => t.id === selected) ?? TEST_TYPES[0];
  const [scenarios, setScenarios] = useState<string[]>([
    "boom",
    "moderate",
    "recession",
  ]);
  const [intensity, setIntensity] = useState(1);
  const [rounds, setRounds] = useState("5 Rounds (Standard)");
  const [teamsInTest, setTeamsInTest] = useState("All teams in this course");
  const [options, setOptions] = useState<string[]>([
    "Include Benchmark Comparison",
    "Apply All Multipliers",
    "Use Current Carry-Forward Rules",
  ]);

  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Quick Actions"
          course={rail}
          tools={[
            {
              title: "Export Test Results",
              icon: <Download className="h-4 w-4" strokeWidth={1.75} />,
              body: "Download the latest scenario run from the existing exporter.",
              action: "Export",
              href: "/sessions/config/export",
            },
            {
              title: "Process Round",
              icon: <PlayCircle className="h-4 w-4" strokeWidth={1.75} />,
              body: "After tests pass, process through the live engine.",
              action: "Go to Process Round",
              href: "/sessions/config/process-round",
            },
            {
              title: "Help & Documentation",
              icon: <HelpCircle className="h-4 w-4" strokeWidth={1.75} />,
              body: "Which test should I use?",
              action: "Open Help Center",
              href: "/sessions/help",
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title={selected ? current.title : "Testing Center"}
        subtitle={
          selected
            ? current.body
            : "Test scenarios, stress the engine, and validate how configuration changes impact outcomes before applying them to your course."
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Simulation Lab", href: "/sessions/lab" },
          { label: "Testing Center", href: "/sessions/testing" },
          ...(selected ? [{ label: current.title }] : []),
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/sessions/lab"
              className="rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)]"
            >
              ← Back to Overview
            </Link>
            <Link
              href="/sessions/config/overview"
              className="rounded-md border border-[var(--portal-sidebar-border)] px-3.5 py-2 text-sm font-semibold"
            >
              Load Saved Configuration
            </Link>
            <Link
              href={`/sessions/testing/${current.id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-white"
            >
              <PlayCircle className="h-4 w-4" strokeWidth={2} />
              Run New Test
            </Link>
          </div>
        }
      />

      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-3 text-sm shadow-sm">
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            { label: "Last Test Run", value: "—", Icon: Clock },
            { label: "Configuration Version", value: "—", Icon: FileCog },
            { label: "Engine Version", value: "—", Icon: Settings },
            { label: "Default Industry", value: "—", Icon: Factory },
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
                <p
                  className={`font-semibold ${
                    ok ? "text-emerald-700" : ""
                  }`}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <StepHeading
          n={1}
          title="Choose Test Type"
          body="Select the type of test you want to run."
        />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {TEST_TYPES.map((test) => {
            const active = current.id === test.id;
            const Icon = TEST_ICONS[test.id];
            return (
              <Link
                key={test.id}
                href={`/sessions/testing/${test.id}`}
                className={`flex flex-col rounded-xl border p-3.5 ${
                  active
                    ? "border-[var(--portal-accent-blue)] bg-white ring-1 ring-[var(--portal-accent-blue)]"
                    : "border-[var(--portal-sidebar-border)] bg-white"
                }`}
              >
                <Icon
                  className="h-5 w-5 text-[var(--portal-accent-blue)]"
                  strokeWidth={1.75}
                />
                <p className="mt-2 text-[0.8125rem] font-bold leading-tight text-[var(--portal-title)]">
                  {test.title}
                </p>
                <p className="mt-1.5 flex-1 text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                  {test.body}
                </p>
                {/* Radio affordance — testing_center_editable_checked. */}
                <span
                  className={`mt-3 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    active
                      ? "border-[var(--portal-accent-blue)]"
                      : "border-[#c9ced6]"
                  }`}
                  aria-hidden="true"
                >
                  {active ? (
                    <span className="h-2 w-2 rounded-full bg-[var(--portal-accent-blue)]" />
                  ) : null}
                </span>
              </Link>
            );
          })}
        </div>
        <p className="mt-4 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
          <Info className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />
          {current.title} — these tests will not affect your live course. The
          runner uses the existing scenario API; it is not a second engine.
        </p>
      </section>

      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <StepHeading
          n={2}
          title="Configure Test Parameters"
          body="Set the parameters for your selected test."
        />
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <div>
            <p className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
              Select Scenarios
            </p>
            <ul className="mt-2 divide-y divide-[var(--portal-sidebar-border)]">
              {SCENARIOS.map((s) => (
                <li key={s.id} className="py-2.5">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--portal-accent-blue)]"
                      checked={scenarios.includes(s.id)}
                      onChange={() =>
                        setScenarios((prev) =>
                          prev.includes(s.id)
                            ? prev.filter((x) => x !== s.id)
                            : [...prev, s.id]
                        )
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-[0.8125rem] font-semibold text-[var(--portal-title)]">
                        {s.label}
                      </span>
                      <span className="block text-[0.75rem] text-[var(--portal-muted)]">
                        {s.body}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
                Competitive Intensity
              </p>
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--portal-accent-blue)]"
                aria-label="Competitive intensity"
              />
              <div className="mt-1 flex justify-between text-[0.75rem] text-[var(--portal-muted)]">
                {INTENSITY.map((label, i) => (
                  <span
                    key={label}
                    className={
                      i === intensity
                        ? "font-bold text-[var(--portal-accent-blue)]"
                        : ""
                    }
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
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
            <label className="block">
              <span className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
                Teams in Test
              </span>
              <select
                className={`${formSelectClassName} mt-1.5 w-full`}
                value={teamsInTest}
                onChange={(e) => setTeamsInTest(e.target.value)}
              >
                <option>All teams in this course</option>
                <option>Single sample team</option>
              </select>
            </label>
          </div>

          <div>
            <p className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
              Additional Options
            </p>
            <ul className="mt-2 space-y-3">
              {OPTIONS.map((o) => (
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
        </div>
        <p className="mt-4 rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[0.8125rem] text-[var(--portal-muted)]">
          <Info className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />
          These settings will not affect your live course. Tests run in a safe
          environment.
        </p>
      </section>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <StepHeading
            n={3}
            title="Run Test"
            body="Review your settings and run the test."
          />
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Test Type", current.title],
              ["Scenarios", `${scenarios.length} Selected`],
              ["Rounds", rounds.replace(" (Standard)", "")],
              ["Teams", teamsInTest],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[0.75rem] font-semibold text-[var(--portal-muted)]">
                  {label}
                </dt>
                <dd className="mt-0.5 text-[0.8125rem] font-bold text-[var(--portal-title)]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 border-t border-[var(--portal-sidebar-border)] pt-4">
            <TestingLaboratory embedded />
          </div>
        </section>
        <aside className="rounded-xl border border-violet-200 bg-violet-50/60 p-5">
          <p className="flex items-center gap-2 font-bold text-violet-800">
            <Sparkles className="h-4 w-4" strokeWidth={2} />
            Tips
          </p>
          <ul className="mt-3 space-y-2 text-[0.8125rem] text-violet-900">
            {TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  strokeWidth={2.5}
                />
                <span className="leading-snug">{tip}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/sessions/help"
            className="mt-4 inline-block text-[0.8125rem] font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            Learn more about Testing Center
          </Link>
        </aside>
      </div>

      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <StepHeading
          n={4}
          title="Recent Test Results"
          body="View and compare your most recent test results."
        />
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="py-2 pr-4 whitespace-nowrap">Test Name</th>
                <th className="py-2 pr-4 whitespace-nowrap">Type</th>
                <th className="py-2 pr-4 whitespace-nowrap">Run On</th>
                <th className="py-2 pr-4 whitespace-nowrap">Teams</th>
                <th className="py-2 pr-4 whitespace-nowrap">Rounds</th>
                <th className="py-2 pr-4 whitespace-nowrap">Status</th>
                <th className="py-2 pr-4 whitespace-nowrap">Key Insight</th>
                <th className="py-2 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[var(--portal-sidebar-border)]">
                <td
                  colSpan={8}
                  className="py-8 text-center text-[var(--portal-muted)]"
                >
                  Test history is not stored yet. Run a scenario above to
                  inspect results for this session only.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <ProfessorHelpBanner
        title="Tests are disposable"
        body="Run major changes here before processing a live round."
        href="/sessions/config/process-round"
        action="Go to Process Round"
      />
    </ProfessorPageGrid>
  );
}
