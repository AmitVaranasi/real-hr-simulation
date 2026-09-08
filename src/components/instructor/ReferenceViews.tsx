import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronDown,
  CircleDollarSign,
  Clock,
  Cog,
  GraduationCap,
  Info,
  Layers,
  PieChart,
  RefreshCw,
  Scale,
  Settings2,
  SlidersHorizontal,
  Target,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import {
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  type CourseRailState,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import {
  ReferenceCards,
  ReferenceFilters,
} from "@/components/instructor/ResourcesHub";
import { INDUSTRY_CONFIGS, STRATEGY_CONFIGS } from "@/lib/engine/config";
import type { Industry, Strategy } from "@/lib/engine/types";

const INDUSTRIES = Object.keys(INDUSTRY_CONFIGS) as Industry[];
const STRATEGIES = Object.keys(STRATEGY_CONFIGS) as Strategy[];

/* Layouts transcribed from metrics_reference_editable,
   professor_scoring_formulas_editable, professor_simulation_mechanics_editable
   and industry_strategy_reference_editable. Content is the live engine's, not
   Figma's sample rows. */

function ReferenceShell({
  title,
  subtitle,
  crumb,
  activeCard,
  tabs,
  searchPlaceholder,
  filters,
  rail,
  children,
  helpTitle,
}: {
  title: string;
  subtitle: string;
  crumb: string;
  activeCard: string;
  tabs: string[];
  searchPlaceholder?: string;
  filters?: string[];
  rail: CourseRailState;
  children: ReactNode;
  helpTitle: string;
}) {
  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Quick Actions"
          course={rail}
          tools={[
            {
              title: "Simulation Reference",
              icon: <Layers className="h-4 w-4" strokeWidth={1.75} />,
              body: "Back to the reference categories.",
              action: "View Reference",
              href: "/sessions/professor-resources/reference",
            },
            {
              title: "Formula Inspect",
              icon: <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />,
              body: "Trace a calculation for a team and round.",
              action: "Open Formula Inspect",
              href: "/sessions/config",
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Resources", href: "/sessions/professor-resources" },
          {
            label: "Simulation Reference",
            href: "/sessions/professor-resources/reference",
          },
          { label: crumb },
        ]}
      />

      <ReferenceCards active={activeCard} />

      <div className="flex w-full min-w-0 items-end gap-5 overflow-x-auto border-b border-[var(--portal-sidebar-border)]">
        {tabs.map((t, i) => (
          <span
            key={t}
            className={`relative whitespace-nowrap pb-2.5 text-sm font-semibold ${
              i === 0
                ? "text-[var(--portal-accent-blue)]"
                : "text-[var(--portal-muted)]"
            }`}
          >
            {t}
            {i === 0 ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t bg-[var(--portal-accent-blue)]" />
            ) : null}
          </span>
        ))}
      </div>

      {filters ? (
        <ReferenceFilters
          searchPlaceholder={searchPlaceholder ?? "Search..."}
          selects={filters}
        />
      ) : null}

      {children}

      <ProfessorHelpBanner
        title={helpTitle}
        body="Check the Professor Guide or contact support through the Help Center."
        href="/sessions/help"
        action="Go to Help Center"
      />
    </ProfessorPageGrid>
  );
}

function InfoPanel({
  title,
  body,
  action,
  href,
}: {
  title: string;
  body: string;
  action: string;
  href: string;
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d7e4ff] bg-[#f5f9ff] px-4 py-3.5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--portal-accent-blue)] text-white">
          <Info className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--portal-title)]">{title}</p>
          <p className="mt-0.5 text-sm text-[var(--portal-muted)]">{body}</p>
        </div>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-md border border-[var(--portal-accent-blue)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
      >
        {action}
      </Link>
    </section>
  );
}

/* ---------------------------------------------------------------- Metrics */

const PERSPECTIVE_TONE: Record<string, string> = {
  Financial: "#16a34a",
  Employee: "#f59e0b",
  "Internal Process": "#2F6FED",
  "Learning & Growth": "#7c3aed",
};

const CATEGORY_TONE: Record<string, string> = {
  Financial: "bg-emerald-50 text-emerald-700",
  Workforce: "bg-orange-50 text-[var(--portal-brand)]",
  "Learning & Growth": "bg-violet-50 text-violet-700",
  Scorecard: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
};

/** Fields the engine writes to `outcomes` after a round is processed. */
const METRIC_ROWS: Array<{
  name: string;
  field: string;
  body: string;
  category: keyof typeof CATEGORY_TONE;
  perspective: keyof typeof PERSPECTIVE_TONE;
  calc: string;
  direction: "up" | "down";
  usedIn: string;
  Icon: typeof CircleDollarSign;
}> = [
  { name: "Revenue", field: "revenue", body: "Total income generated from operations.", category: "Financial", perspective: "Financial", calc: "Base revenue × productivity × economy multiplier", direction: "up", usedIn: "Financial Score, Reports", Icon: CircleDollarSign },
  { name: "Profit", field: "profit", body: "Net income after all expenses.", category: "Financial", perspective: "Financial", calc: "Revenue − Total Expenses", direction: "up", usedIn: "Financial Score, Reports", Icon: TrendingUp },
  { name: "Profit Margin", field: "profit_margin", body: "Profitability as a percentage of revenue.", category: "Financial", perspective: "Financial", calc: "(Profit / Revenue) × 100", direction: "up", usedIn: "Financial Score, Reports", Icon: PieChart },
  { name: "Cashflow", field: "cashflow", body: "Net cash position for the round.", category: "Financial", perspective: "Financial", calc: "—", direction: "up", usedIn: "Financial Score", Icon: CircleDollarSign },
  { name: "Stock Price", field: "stock_price", body: "Market valuation signal for the company.", category: "Financial", perspective: "Financial", calc: "—", direction: "up", usedIn: "Financial Score, Reports", Icon: BarChart3 },
  { name: "Market Share", field: "market_share", body: "Share of the industry the team holds.", category: "Financial", perspective: "Financial", calc: "—", direction: "up", usedIn: "Financial Score", Icon: PieChart },
  { name: "Total Budget Spent", field: "total_budget_spent", body: "Discretionary HR budget consumed this round.", category: "Financial", perspective: "Internal Process", calc: "Σ (module spend)", direction: "down", usedIn: "Budget adherence", Icon: Scale },
  { name: "Employee Satisfaction", field: "employee_satisfaction", body: "Overall employee satisfaction score.", category: "Workforce", perspective: "Employee", calc: "Prior satisfaction adjusted by decisions", direction: "up", usedIn: "Employee Score, Reports", Icon: UserRound },
  { name: "Engagement Level", field: "engagement_level", body: "How engaged the workforce is.", category: "Workforce", perspective: "Employee", calc: "—", direction: "up", usedIn: "Employee Score", Icon: Users },
  { name: "Turnover Rate", field: "turnover_rate", body: "Percentage of employees who leave the organization.", category: "Workforce", perspective: "Employee", calc: "Prior turnover + band penalty − satisfaction effect", direction: "down", usedIn: "Employee Score, Reports", Icon: ArrowDown },
  { name: "Retention", field: "retention", body: "Share of employees retained across the round.", category: "Workforce", perspective: "Employee", calc: "100 − Turnover Rate", direction: "up", usedIn: "Employee Score", Icon: Users },
  { name: "Cost per Hire", field: "cost_per_hire", body: "Average cost to fill an open role.", category: "Workforce", perspective: "Internal Process", calc: "Base cost ÷ recruitment multiplier", direction: "down", usedIn: "Process Score", Icon: CircleDollarSign },
  { name: "Time to Fill", field: "time_to_fill", body: "Average days to fill an open role.", category: "Workforce", perspective: "Internal Process", calc: "Base days ÷ recruitment multiplier", direction: "down", usedIn: "Process Score", Icon: Clock },
  { name: "Hiring Quality", field: "hiring_quality", body: "Quality of hires made this round.", category: "Workforce", perspective: "Internal Process", calc: "Derived from decisions and turnover", direction: "up", usedIn: "Process Score", Icon: Target },
  { name: "Training ROI", field: "training_roi", body: "Return on investment for training programs.", category: "Learning & Growth", perspective: "Learning & Growth", calc: "Training benefit × training multiplier", direction: "up", usedIn: "Learning Score, Reports", Icon: GraduationCap },
  { name: "DEI Score", field: "dei_score", body: "Diversity, equity and inclusion index.", category: "Learning & Growth", perspective: "Learning & Growth", calc: "—", direction: "up", usedIn: "Learning Score", Icon: Users },
  { name: "Financial Score", field: "score_financial", body: "Balanced Scorecard financial perspective.", category: "Scorecard", perspective: "Financial", calc: "Raw financial × (weight ÷ 25)", direction: "up", usedIn: "Total Score", Icon: CircleDollarSign },
  { name: "Employee Score", field: "score_employee", body: "Balanced Scorecard employee perspective.", category: "Scorecard", perspective: "Employee", calc: "Raw employee × (weight ÷ 25)", direction: "up", usedIn: "Total Score", Icon: UserRound },
  { name: "Process Score", field: "score_process", body: "Balanced Scorecard internal process perspective.", category: "Scorecard", perspective: "Internal Process", calc: "Raw process × (weight ÷ 25)", direction: "up", usedIn: "Total Score", Icon: Cog },
  { name: "Learning Score", field: "score_learning", body: "Balanced Scorecard learning & growth perspective.", category: "Scorecard", perspective: "Learning & Growth", calc: "Raw learning × (weight ÷ 25)", direction: "up", usedIn: "Total Score", Icon: GraduationCap },
  { name: "Total Score", field: "total_score", body: "Overall Balanced Scorecard result for the round.", category: "Scorecard", perspective: "Financial", calc: "Σ of the four perspective scores", direction: "up", usedIn: "Leaderboard, Reports", Icon: BarChart3 },
];

export function MetricsReferenceView({ rail }: { rail: CourseRailState }) {
  return (
    <ReferenceShell
      rail={rail}
      title="Metrics Reference"
      subtitle="Complete definitions and calculations for all performance metrics used in the simulation."
      crumb="Metrics Reference"
      activeCard="metrics"
      tabs={["Overview", "All Metrics", "By Category", "Financial", "Workforce", "Learning & Growth", "Process"]}
      searchPlaceholder="Search metrics by name or keyword..."
      filters={["All Categories", "All Perspectives"]}
      helpTitle="Need help understanding a metric?"
    >
      <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="px-4 py-4">
          <h2 className="font-bold text-[var(--portal-title)]">
            Metrics Overview{" "}
            <span className="font-normal text-[var(--portal-muted)]">
              {METRIC_ROWS.length} metrics
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-3 py-3 whitespace-nowrap">Metric</th>
                <th className="px-3 py-3 whitespace-nowrap">Category</th>
                <th className="px-3 py-3 whitespace-nowrap">Perspective</th>
                <th className="px-3 py-3 whitespace-nowrap">Calculation Summary</th>
                <th className="px-3 py-3 whitespace-nowrap">Direction</th>
                <th className="px-3 py-3 whitespace-nowrap">Used In</th>
                <th className="px-3 py-3 whitespace-nowrap">More Info</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_ROWS.map((m) => (
                <tr
                  key={m.field}
                  className="border-t border-[var(--portal-sidebar-border)] align-top"
                >
                  <td className="px-3 py-3">
                    <span className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4f7fb] text-[var(--portal-accent-blue)]">
                        <m.Icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-[var(--portal-title)]">
                          {m.name}
                        </span>
                        <span className="block text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                          {m.body}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${CATEGORY_TONE[m.category]}`}
                    >
                      {m.category}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: PERSPECTIVE_TONE[m.perspective] }}
                      />
                      {m.perspective}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[var(--portal-ink)]">{m.calc}</td>
                  <td className="px-3 py-3">
                    {m.direction === "up" ? (
                      <ArrowUp className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-rose-500" strokeWidth={2.5} />
                    )}
                  </td>
                  <td className="px-3 py-3 text-[var(--portal-muted)]">
                    {m.usedIn}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href="/sessions/professor-resources/reference/formulas"
                      className="font-semibold text-[var(--portal-accent-blue)] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--portal-sidebar-border)] px-4 py-3 text-center">
          <Link
            href="/sessions/professor-resources/reference/formulas"
            className="text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View All {METRIC_ROWS.length} Metrics
          </Link>
        </div>
      </section>
    </ReferenceShell>
  );
}

/* --------------------------------------------------------------- Formulas */

const SCORING_COMPONENTS = [
  { name: "Raw Perspective Score", body: "Benchmark-scored result for each Balanced Scorecard perspective.", formula: "score(metric) → 0–25 per benchmark band", impact: "Base Score", tone: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]", Icon: Scale },
  { name: "Balanced Scorecard (BSC)", body: "Performance across four perspectives: Financial, Employee, Internal Process, Learning & Growth.", formula: "BSC = Financial + Employee + Process + Learning", impact: "Core Driver", tone: "bg-emerald-50 text-emerald-700", Icon: PieChart },
  { name: "Strategy Weighting", body: "Each strategy re-weights the four perspectives.", formula: "score = raw × (strategy weight ÷ 25)", impact: "High Impact", tone: "bg-violet-50 text-violet-700", Icon: Target },
  { name: "Industry Multiplier", body: "Per-module multipliers set by the chosen industry.", formula: "metric × industry module_multiplier", impact: "High Impact", tone: "bg-orange-50 text-[var(--portal-brand)]", Icon: BarChart3 },
  { name: "Economic Factor", body: "Boom, Normal or Recession multipliers on revenue and expenses.", formula: "revenue × economy.revenue, expense × economy.expense", impact: "Variable", tone: "bg-rose-50 text-rose-700", Icon: TrendingUp },
  { name: "Bonus Conditions", body: "Strategy-specific bonuses added when conditions are met.", formula: "+3 pts to the named perspective", impact: "Final Result", tone: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]", Icon: Settings2 },
];

export function ScoringFormulasView({ rail }: { rail: CourseRailState }) {
  return (
    <ReferenceShell
      rail={rail}
      title="Scoring & Formulas"
      subtitle="Scoring logic, formulas, and weightings that drive results in the simulation."
      crumb="Scoring & Formulas"
      activeCard="formulas"
      tabs={["Scoring Overview", "Balanced Scorecard (BSC)", "Strategy & Industry", "Budget & Constraints", "Carry-Forward Effects", "Decision Weights"]}
      helpTitle="Need help understanding the scoring?"
    >
      <InfoPanel
        title="How Overall Performance is Calculated"
        body="The simulation combines your HR decisions, strategy, industry, budget, and economic factors to produce final results."
        action="View Calculation Flow"
        href="/sessions/config"
      />

      <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="px-4 py-4">
          <h2 className="font-bold text-[var(--portal-title)]">
            Scoring Components
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Component</th>
                <th className="px-4 py-3 whitespace-nowrap">Description</th>
                <th className="px-4 py-3 whitespace-nowrap">Formula / Calculation</th>
                <th className="px-4 py-3 whitespace-nowrap">Impact</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {SCORING_COMPONENTS.map((c) => (
                <tr
                  key={c.name}
                  className="border-t border-[var(--portal-sidebar-border)] align-top"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2.5">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4f7fb] text-[var(--portal-accent-blue)]">
                        <c.Icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className="font-semibold text-[var(--portal-title)]">
                        {c.name}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--portal-muted)]">
                    {c.body}
                  </td>
                  <td className="px-4 py-3">
                    <code className="font-mono text-[0.8125rem] italic text-[var(--portal-ink)]">
                      {c.formula}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${c.tone}`}
                    >
                      {c.impact}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronDown className="inline h-4 w-4 text-[var(--portal-muted)]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex items-center justify-between gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-3.5 shadow-sm">
        <p className="font-bold text-[var(--portal-title)]">
          Detailed Calculation Flow (Step-by-Step)
        </p>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--portal-muted)]" />
      </section>
    </ReferenceShell>
  );
}

/* -------------------------------------------------------------- Mechanics */

const FLOW_STEPS = [
  { n: 1, title: "Set Up", body: "Instructor sets industry, strategy, economic conditions, and round structure.", tone: "bg-emerald-50 text-emerald-600", Icon: Settings2 },
  { n: 2, title: "Make Decisions", body: "Teams make HR decisions across 7 decision areas within their budget.", tone: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]", Icon: Users },
  { n: 3, title: "Engine Processing", body: "Decisions are processed using scoring logic, multipliers, and economic factors.", tone: "bg-violet-50 text-violet-600", Icon: Cog },
  { n: 4, title: "Results Generated", body: "Metrics and financial statements are calculated for the round.", tone: "bg-orange-50 text-[var(--portal-brand)]", Icon: BarChart3 },
  { n: 5, title: "Next Round", body: "Results become the new state and teams plan for the next round.", tone: "bg-emerald-50 text-emerald-600", Icon: RefreshCw },
];

const KEY_MECHANICS = [
  { title: "Decisions Locked Each Round", body: "Decisions are locked after the deadline. No changes can be made once submitted.", tone: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]", Icon: Clock },
  { title: "State-Based Engine", body: "The simulation uses a state-based model. Outcomes from one round affect the starting state of the next round.", tone: "bg-emerald-50 text-emerald-600", Icon: Layers },
  { title: "Cumulative Effects", body: "Many decisions have carry-forward effects that continue to impact results in future rounds.", tone: "bg-violet-50 text-violet-600", Icon: TrendingUp },
  { title: "Economic Conditions", body: "Economic factors can change between rounds and impact financial performance and some HR metrics.", tone: "bg-orange-50 text-[var(--portal-brand)]", Icon: CircleDollarSign },
  { title: "Budget Constraints", body: "Total HR spending must stay within your allocated budget. Overages result in penalties.", tone: "bg-rose-50 text-rose-600", Icon: Scale },
  { title: "Instructor Controls", body: "Instructors can adjust simulation settings, metrics visibility, and report timing.", tone: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]", Icon: SlidersHorizontal },
];

export function SimulationMechanicsView({ rail }: { rail: CourseRailState }) {
  return (
    <ReferenceShell
      rail={rail}
      title="Simulation Mechanics"
      subtitle="Understand how the simulation engine works, including state changes, timing, and economic factors."
      crumb="Simulation Mechanics"
      activeCard="mechanics"
      tabs={["How It Works", "Rounds & Timing", "State Transitions", "Economic Factors", "Decision Processing", "Results & Reporting", "Other Rules"]}
      helpTitle="Need more details?"
    >
      <InfoPanel
        title="Simulation Overview"
        body="The simulation models a dynamic organization over multiple rounds. Your HR decisions influence key performance drivers, which impact financial results and organizational outcomes."
        action="View Engine Diagram"
        href="/sessions/config"
      />

      <section>
        <h2 className="font-bold text-[var(--portal-title)]">
          Simulation Flow (At a Glance)
        </h2>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start">
          {FLOW_STEPS.map((s, i) => (
            <div key={s.n} className="flex min-w-0 flex-1 items-start gap-3">
              {i > 0 ? (
                <span className="mt-8 hidden shrink-0 text-[var(--portal-muted)] lg:block">
                  →
                </span>
              ) : null}
              <div className="min-w-0 flex-1 text-center">
                <span
                  className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full ${s.tone}`}
                >
                  <s.Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <p className="mt-2.5 text-[0.8125rem] font-bold text-[var(--portal-title)]">
                  {s.n}. {s.title}
                </p>
                <p className="mt-1 text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-[var(--portal-title)]">Key Mechanics</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KEY_MECHANICS.map((m) => (
            <article
              key={m.title}
              className="flex items-start gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm"
            >
              <span
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${m.tone}`}
              >
                <m.Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
                  {m.title}
                </p>
                <p className="mt-1 text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                  {m.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </ReferenceShell>
  );
}

/* --------------------------------------------------------------- Industry */

function Rating({ level, tone }: { level: number; tone: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-3.5 w-1.5 rounded-sm"
            style={{ background: i < level ? tone : "#e6e9ee" }}
          />
        ))}
      </span>
      <span className="whitespace-nowrap text-[0.75rem] text-[var(--portal-muted)]">
        {level >= 4 ? "Very High" : level === 3 ? "High" : level === 2 ? "Medium" : "Low"}
      </span>
    </span>
  );
}

const STRATEGY_TONE: Record<
  string,
  { badge: string; ring: string; pill: string; label: string }
> = {
  "Cost Leadership": { badge: "CL", ring: "border-emerald-500 text-emerald-600", pill: "bg-emerald-50 text-emerald-700", label: "Efficiency Focused" },
  Differentiation: { badge: "D", ring: "border-violet-500 text-violet-600", pill: "bg-violet-50 text-violet-700", label: "Innovation Focused" },
  Innovation: { badge: "I", ring: "border-[var(--portal-accent-blue)] text-[var(--portal-accent-blue)]", pill: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]", label: "Growth Focused" },
  "Customer Intimacy": { badge: "CI", ring: "border-rose-500 text-rose-600", pill: "bg-rose-50 text-rose-700", label: "Customer Focused" },
  Focus: { badge: "F", ring: "border-orange-500 text-[var(--portal-brand)]", pill: "bg-orange-50 text-[var(--portal-brand)]", label: "Targeted Approach" },
};

export function IndustryStrategyView({ rail }: { rail: CourseRailState }) {
  return (
    <ReferenceShell
      rail={rail}
      title="Industry & Strategy"
      subtitle="Industry characteristics, strategy multipliers, and competitive dynamics that influence performance."
      crumb="Industry & Strategy"
      activeCard="industry"
      tabs={["Industry Overview", "Industry Profiles", "Strategy Overview", "Strategy Multipliers", "Competitive Dynamics"]}
      helpTitle="Need help understanding industry or strategy?"
    >
      <InfoPanel
        title="Industry Overview"
        body="Each industry has unique characteristics that influence how HR decisions impact outcomes. Strategy choices further modify performance based on alignment with industry demands."
        action="How Industry & Strategy Work"
        href="/sessions/config/industries"
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
          <div className="px-4 py-4">
            <h2 className="font-bold text-[var(--portal-title)]">
              Industry Comparison
            </h2>
            <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
              The {INDUSTRIES.length} industries configured in this simulation.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                <tr>
                  <th className="px-3 py-3 whitespace-nowrap">Industry</th>
                  <th className="px-3 py-3 whitespace-nowrap">Base Headcount</th>
                  <th className="px-3 py-3 whitespace-nowrap">Base Turnover</th>
                  <th className="px-3 py-3 whitespace-nowrap">Training Emphasis</th>
                  <th className="px-3 py-3 whitespace-nowrap">DEI Emphasis</th>
                </tr>
              </thead>
              <tbody>
                {INDUSTRIES.map((industry) => {
                  const c = INDUSTRY_CONFIGS[industry];
                  const band = (v: number, hi: number, mid: number) =>
                    v >= hi ? 3 : v >= mid ? 2 : 1;
                  return (
                    <tr
                      key={industry}
                      className="border-t border-[var(--portal-sidebar-border)]"
                    >
                      <td className="px-3 py-3 whitespace-nowrap font-semibold text-[var(--portal-title)]">
                        {industry}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {c.base_headcount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {c.base_turnover}%
                      </td>
                      <td className="px-3 py-3">
                        <Rating
                          level={band(c.module_multipliers.training, 1.25, 1.1)}
                          tone="#16a34a"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Rating
                          level={band(c.module_multipliers.dei, 1.1, 1.0)}
                          tone="#f97316"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[var(--portal-sidebar-border)] px-4 py-3 text-center">
            <Link
              href="/sessions/config/industries"
              className="text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View All Industry Profiles
            </Link>
          </div>
        </section>

        <aside className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[var(--portal-title)]">
            Strategy Summary
          </h2>
          <ul className="mt-4 space-y-4">
            {STRATEGIES.map((strategy) => {
              const tone =
                STRATEGY_TONE[strategy] ?? STRATEGY_TONE["Cost Leadership"];
              const w = STRATEGY_CONFIGS[strategy].bsc_weights;
              return (
                <li key={strategy} className="flex items-start gap-3">
                  <span
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-[0.8125rem] font-bold ${tone.ring}`}
                  >
                    {tone.badge}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
                        {strategy}
                      </p>
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[0.625rem] font-semibold ${tone.pill}`}
                      >
                        {tone.label}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                      Weights — Financial {w.financial}, Employee {w.employee},
                      Process {w.process}, Learning {w.learning}.
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link
            href="/sessions/config/strategies"
            className="mt-4 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View All Strategies
          </Link>
        </aside>
      </div>
    </ReferenceShell>
  );
}
