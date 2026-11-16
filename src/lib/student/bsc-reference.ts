/**
 * Single source for the "Understanding the HR Balance Scorecard" reference
 * pages (Resources → Simulation Reference Center).
 *
 * Prof. Cooper's design rule for these pages: students must never be told a
 * metric counts toward their score unless the engine actually scores it. So
 * the scored metrics and their in-perspective weights are read from the
 * engine's own SCORING_BENCHMARKS, and the decision-to-perspective map below
 * lists only effects the engine implements (checked against
 * src/lib/engine/metrics.ts and budget.ts). A test keeps this file and the
 * engine in step.
 */
import { SCORING_BENCHMARKS } from "@/lib/engine/benchmarks";
import { getStrategyConfig } from "@/lib/engine/config";
import type { Strategy } from "@/lib/engine/types";

export type PerspectiveId = "financial" | "employee" | "process" | "learning";

export const BSC_BASE_PATH = "/resources/reference/balanced-scorecard";

export const BSC_TABS = [
  { slug: "", label: "BSC Overview" },
  { slug: "four-perspectives", label: "The Four Perspectives" },
  { slug: "key-metrics", label: "Key HR Metrics" },
  { slug: "how-it-works", label: "How It Works in the Simulation" },
  { slug: "using-results", label: "Using the Results" },
] as const;

export type BscTabSlug = (typeof BSC_TABS)[number]["slug"];

export function bscTabHref(slug: BscTabSlug): string {
  return slug ? `${BSC_BASE_PATH}/${slug}` : BSC_BASE_PATH;
}

export function isBscTabSlug(value: string): value is BscTabSlug {
  return BSC_TABS.some((t) => t.slug === value);
}

export type PerspectiveInfo = {
  id: PerspectiveId;
  title: string;
  /** Conceptual question behind the perspective. */
  question: string;
  /** One-line definition used on cards. */
  short: string;
  /** Broader HR context (The Four Perspectives, middle column). */
  concept: string;
  /** "What It Means in the Simulation". */
  meaning: string;
  /** Short description used on the Key HR Metrics panels. */
  metricsIntro: string;
};

export const PERSPECTIVES: PerspectiveInfo[] = [
  {
    id: "financial",
    title: "Financial",
    question: "Are we using HR financial resources responsibly?",
    short: "HR financial stewardship and contribution.",
    concept:
      "Evaluates whether HR resources are used effectively and responsibly, balancing HR investments against the resources available.",
    meaning:
      "Your HR decisions influence how effectively financial resources are allocated and used. Measures such as cost per hire, training ROI, compensation ratio, and budget adherence help evaluate HR financial stewardship. These decisions may also influence broader organizational outcomes, including productivity and profitability.",
    metricsIntro:
      "Measure how efficiently and responsibly HR spends and invests the organization's resources.",
  },
  {
    id: "employee",
    title: "Employee",
    question: "How are employees experiencing our decisions?",
    short: "Workforce experience and outcomes.",
    concept:
      "Measures how HR decisions affect the people in the organization, whose experience shapes its stability and performance.",
    meaning:
      "Your decisions influence satisfaction, engagement, retention, and workforce conditions. These outcomes help indicate how employees are experiencing your HR strategy.",
    metricsIntro:
      "Capture the workforce experience, engagement, and stability of your employees.",
  },
  {
    id: "process",
    title: "Internal Process",
    question: "How effectively are HR processes operating?",
    short: "Effectiveness of HR processes.",
    concept:
      "Examines how efficiently and reliably HR activities are carried out, the mechanisms through which decisions become outcomes.",
    meaning:
      "Your decisions influence how effectively HR activities are executed, including hiring, performance management, and other operational processes.",
    metricsIntro:
      "Evaluate how efficiently and reliably core HR processes run.",
  },
  {
    id: "learning",
    title: "Learning & Growth",
    question: "Are we developing capabilities for the future?",
    short: "Workforce capability and HR development.",
    concept:
      "Focuses on developing the workforce and strengthening the organization's ability to perform in future rounds.",
    meaning:
      "Your decisions influence workforce development, organizational capability, and readiness for future challenges. Investments in this perspective may produce benefits over multiple rounds.",
    metricsIntro:
      "Assess how well the organization builds people, capabilities, and future capacity.",
  },
];

export function perspectiveById(id: PerspectiveId): PerspectiveInfo {
  return PERSPECTIVES.find((p) => p.id === id)!;
}

export type MetricKind = "scored" | "supporting" | "kpi";

export type ReferenceMetric = {
  /** Matches the engine benchmark id for scored metrics. */
  id: string;
  name: string;
  definition: string;
  whyItMatters: string;
  direction: "higher" | "lower";
  kind: MetricKind;
  /** Scored metrics only. */
  perspective?: PerspectiveId;
  /** Share of its perspective score (0–1), from the engine. */
  weight?: number;
  /** Where students see the value. */
  reportedIn: string;
};

/** Student-facing wording for each engine-scored metric, keyed by benchmark id. */
const SCORED_COPY: Record<
  string,
  Pick<ReferenceMetric, "name" | "definition" | "whyItMatters">
> = {
  training_roi: {
    name: "Training ROI",
    definition: "Return on the money invested in training programs.",
    whyItMatters:
      "Shows whether training spending is producing value, not just how much was spent.",
  },
  cost_per_hire: {
    name: "Cost per Hire",
    definition: "Average cost to recruit and hire one employee.",
    whyItMatters:
      "Lower is more efficient, but cutting it too far can weaken hiring quality.",
  },
  compensation_ratio: {
    name: "Compensation Ratio",
    definition: "Total compensation as a percentage of revenue.",
    whyItMatters:
      "Shows how much of the organization's revenue goes to pay and benefits.",
  },
  budget_adherence: {
    name: "Budget Adherence",
    definition: "How closely HR spending stays within the available budget.",
    whyItMatters:
      "Overspending is penalized; staying within budget shows disciplined resource use.",
  },
  employee_satisfaction: {
    name: "Employee Satisfaction",
    definition: "Overall rating of the employee experience.",
    whyItMatters:
      "Low satisfaction tends to come before higher turnover and absenteeism.",
  },
  retention: {
    name: "Retention",
    definition:
      "Percentage of employees who stay (100% minus the turnover rate).",
    whyItMatters:
      "Stable teams keep their skills and avoid replacement costs.",
  },
  engagement_level: {
    name: "Engagement",
    definition: "Level of commitment and discretionary effort.",
    whyItMatters:
      "Engaged employees are more productive and less likely to leave.",
  },
  dei_score_employee: {
    name: "DEI Score",
    definition: "Progress toward a more inclusive and equitable workplace.",
    whyItMatters:
      "Reflects whether employees across groups share in a fair experience.",
  },
  time_to_fill: {
    name: "Time to Fill",
    definition: "Average number of days to fill an open position.",
    whyItMatters:
      "Slow hiring leaves work uncovered and delays the value of new hires.",
  },
  turnover_rate: {
    name: "Turnover Rate",
    definition:
      "Percentage of employees who leave the organization during the round.",
    whyItMatters:
      "Higher turnover signals instability and adds recruitment and replacement costs.",
  },
  absenteeism_rate: {
    name: "Absenteeism",
    definition: "Share of work time lost to unplanned absence.",
    whyItMatters:
      "Rising absence is often an early sign of strain in workforce conditions.",
  },
  review_coverage: {
    name: "Review Coverage",
    definition: "Percentage of employees with completed performance reviews.",
    whyItMatters:
      "Without reviews, performance problems and development needs go unseen.",
  },
  training_effectiveness: {
    name: "Training Effectiveness",
    definition: "Improvement in skills and performance after training.",
    whyItMatters:
      "Measures whether development actually builds capability.",
  },
  succession_pipeline: {
    name: "Succession Pipeline",
    definition: "Readiness of internal talent to step into key roles.",
    whyItMatters:
      "A strong pipeline protects the organization when key people leave.",
  },
  hr_tech_score: {
    name: "HR Technology",
    definition: "Effectiveness of the organization's HR systems.",
    whyItMatters:
      "Better systems speed up HR processes and support the employee experience.",
  },
  dei_score_learning: {
    name: "DEI Score",
    definition: "Progress toward a more inclusive and equitable workplace.",
    whyItMatters:
      "Inclusive practices widen the talent the organization can develop.",
  },
};

/** Metrics the engine scores, in engine order, with engine weights. */
export const SCORED_METRICS: ReferenceMetric[] = SCORING_BENCHMARKS.map((b) => {
  const copy = SCORED_COPY[b.id];
  if (!copy) throw new Error(`No reference wording for scored metric ${b.id}`);
  return {
    id: b.id,
    ...copy,
    direction: b.direction,
    kind: "scored" as const,
    perspective: b.perspective,
    weight: b.weight,
    reportedIn: "Workforce Brief",
  };
});

export function scoredMetricsFor(perspective: PerspectiveId): ReferenceMetric[] {
  return SCORED_METRICS.filter((m) => m.perspective === perspective);
}

/** Calculated and reported, but not part of any perspective score. */
export const SUPPORTING_METRICS: ReferenceMetric[] = [
  {
    id: "hiring_quality",
    name: "Hiring Quality",
    definition: "Performance and retention of new hires.",
    whyItMatters:
      "Shows whether recruitment brings in the right people, not just enough people.",
    direction: "higher",
    kind: "supporting",
    reportedIn: "Workforce Brief",
  },
  {
    id: "productivity",
    name: "Productivity",
    definition: "Output of the workforce relative to its size.",
    whyItMatters:
      "Links training, engagement, retention, leadership and technology to output.",
    direction: "higher",
    kind: "supporting",
    reportedIn: "Workforce Brief",
  },
  {
    id: "turnover_cost",
    name: "Turnover Cost",
    definition: "Total cost of replacing employees who left.",
    whyItMatters:
      "Puts a price on turnover; it is deducted from profit.",
    direction: "lower",
    kind: "supporting",
    reportedIn: "Workforce Brief",
  },
];

/** Broader business results, reported separately from the scorecard. */
export const ORGANIZATIONAL_KPIS: ReferenceMetric[] = [
  {
    id: "revenue",
    name: "Revenue",
    definition: "Total income from the organization's operations.",
    whyItMatters:
      "Influenced by HR performance, industry and the economy.",
    direction: "higher",
    kind: "kpi",
    reportedIn: "Workforce Brief and Financial Reports",
  },
  {
    id: "profit_margin",
    name: "Profit Margin",
    definition: "Profit as a percentage of revenue.",
    whyItMatters:
      "Can improve through cost reduction even when revenue does not grow.",
    direction: "higher",
    kind: "kpi",
    reportedIn: "Workforce Brief and Financial Reports",
  },
  {
    id: "market_share",
    name: "Market Share",
    definition: "The organization's share of its market.",
    whyItMatters: "Shows position relative to competitors.",
    direction: "higher",
    kind: "kpi",
    reportedIn: "Workforce Brief",
  },
  {
    id: "stock_price",
    name: "Stock Price",
    definition: "Market value of one share of the company.",
    whyItMatters: "Reflects how investors view overall performance.",
    direction: "higher",
    kind: "kpi",
    reportedIn: "Workforce Brief",
  },
];

/** Metrics scored in more than one perspective (by name). */
export function sharedScoredMetrics(): Array<{
  name: string;
  perspectives: PerspectiveId[];
}> {
  const byName = new Map<string, PerspectiveId[]>();
  for (const m of SCORED_METRICS) {
    // Retention is scored as 100 − turnover, so it shares turnover's driver.
    const key =
      m.id === "retention" || m.id === "turnover_rate"
        ? "Turnover (as Retention and Turnover Rate)"
        : m.name;
    byName.set(key, [...(byName.get(key) ?? []), m.perspective!]);
  }
  return [...byName.entries()]
    .filter(([, ps]) => ps.length > 1)
    .map(([name, perspectives]) => ({ name, perspectives }));
}

export type DecisionAreaLink = {
  area: string;
  /**
   * Scored metric ids (benchmark ids) this area moves directly in the
   * current engine. Checked by a test that changes each area's inputs.
   */
  moves: string[];
  note?: string;
};

/**
 * Engine-verified links from each decision area to the scored metrics it
 * moves. Every area also spends budget, which moves Budget Adherence
 * (Financial); that is stated on the page instead of repeated per row.
 */
export const DECISION_AREA_LINKS: DecisionAreaLink[] = [
  {
    area: "Recruitment & Selection",
    moves: ["cost_per_hire", "time_to_fill"],
  },
  {
    area: "Performance Management",
    moves: ["review_coverage", "engagement_level", "absenteeism_rate", "succession_pipeline"],
  },
  {
    area: "Training & Development",
    moves: [
      "training_effectiveness",
      "succession_pipeline",
      "training_roi",
      "employee_satisfaction",
      "engagement_level",
      "retention",
      "turnover_rate",
    ],
  },
  {
    area: "Employee Relations",
    moves: [
      "employee_satisfaction",
      "engagement_level",
      "retention",
      "turnover_rate",
      "absenteeism_rate",
    ],
  },
  {
    area: "Compensation & Benefits",
    moves: [
      "compensation_ratio",
      "employee_satisfaction",
      "engagement_level",
      "retention",
      "turnover_rate",
      "time_to_fill",
      "hr_tech_score",
    ],
  },
  {
    area: "Org Design & Change",
    moves: [],
    note: "These choices change your budget, and different designs can raise or lower costs. Weigh what each choice costs against the value you expect it to bring.",
  },
  {
    area: "DEI Initiatives",
    moves: [],
    note: "These initiative levels change your budget. Weigh their cost against the value you expect them to bring to your workforce and culture.",
  },
];

/** Perspectives an area moves, in scorecard order. */
export function perspectivesMovedBy(link: DecisionAreaLink): PerspectiveId[] {
  const hit = new Set(
    link.moves.map((id) => SCORED_METRICS.find((m) => m.id === id)!.perspective!)
  );
  return PERSPECTIVES.map((p) => p.id).filter((id) => hit.has(id));
}

/** Display names of the metrics an area moves, without repeats. */
export function metricNamesMovedBy(link: DecisionAreaLink): string[] {
  return [
    ...new Set(link.moves.map((id) => SCORED_METRICS.find((m) => m.id === id)!.name)),
  ];
}

export type PerspectiveWeights = Record<PerspectiveId, number>;

/** The team's strategy weights, or null when the strategy is unknown. */
export function strategyWeights(strategy: string | null | undefined): PerspectiveWeights | null {
  if (!strategy) return null;
  try {
    const w = getStrategyConfig(strategy as Strategy).bsc_weights;
    return {
      financial: w.financial,
      employee: w.employee,
      process: w.process,
      learning: w.learning,
    };
  } catch {
    return null;
  }
}

export const ALL_STRATEGIES: Strategy[] = [
  "Cost Leadership",
  "Differentiation",
  "Innovation",
  "Customer Intimacy",
  "Focus",
];

/** Perspective weights for every strategy. Call inside withSimulationConfig. */
export function currentStrategyWeights(): Partial<Record<Strategy, PerspectiveWeights>> {
  const out: Partial<Record<Strategy, PerspectiveWeights>> = {};
  for (const s of ALL_STRATEGIES) {
    const w = strategyWeights(s);
    if (w) out[s] = w;
  }
  return out;
}

/** Everything the reference pages read from the live configuration. */
export type BscReferenceData = {
  strategy: string | null;
  strategyWeights: Partial<Record<Strategy, PerspectiveWeights>>;
};
