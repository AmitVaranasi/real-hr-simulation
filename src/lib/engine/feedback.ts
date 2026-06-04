import type {
  BSCScores,
  FeedbackPayload,
  FinancialMetrics,
  HRMetrics,
  IndustryConfig,
  MetricFeedback,
  StrategyConfig,
} from "./types";
import { formatCurrency, formatPercent } from "../utils";

type Status = "excellent" | "moderate" | "poor" | "critical";

const SUMMARIES: Record<string, string> = {
  financial:
    "Financial perspective reflects training ROI, hiring efficiency, compensation ratio, and budget discipline.",
  employee:
    "Employee perspective captures satisfaction, retention, engagement, and DEI outcomes.",
  process:
    "Internal process perspective measures hiring speed, turnover, absenteeism, and review coverage.",
  learning:
    "Learning & growth perspective evaluates training, succession, HR technology, and DEI maturity.",
};

const FEEDBACK_TEMPLATES: Record<string, Partial<Record<Status, string>>> = {
  cost_per_hire: {
    excellent:
      "Your cost per hire of {value} is well below the $4,500 benchmark. Efficient recruiting frees budget for other HR initiatives.",
    moderate:
      "Cost per hire of {value} is acceptable but could improve. Consider adjusting screening rigor or focusing recruitment on fewer, higher-impact roles.",
    poor:
      "Cost per hire of {value} exceeds the $10,000 threshold. Review whether screening or diversity sourcing is creating unnecessary expense.",
    critical:
      "Cost per hire of {value} is critically high and is consuming discretionary budget.",
  },
  employee_satisfaction: {
    excellent:
      "Employee satisfaction of {value} is outstanding. Compensation, training, and culture investments are paying off.",
    moderate:
      "Satisfaction at {value} is acceptable but not competitive. Consider compensation, flexibility, or conflict approaches.",
    poor:
      "Satisfaction of {value} signals workforce dissatisfaction and may drive turnover.",
    critical:
      "Satisfaction of {value} is critically low. Expect rising turnover and declining productivity.",
  },
  turnover_rate: {
    excellent:
      "Turnover at {value} is excellent. Strong retention preserves knowledge and reduces replacement costs.",
    moderate:
      "Turnover of {value} is manageable but each departure costs roughly 50% of annual salary to replace.",
    poor:
      "Turnover of {value} is damaging productivity and revenue.",
    critical:
      "Turnover of {value} is a crisis — align compensation, engagement, and culture immediately.",
  },
  training_roi: {
    excellent: "Training ROI of {value} shows strong return on learning investments.",
    moderate: "Training ROI of {value} is moderate — consider more targeted programs or higher coverage.",
    poor: "Training ROI of {value} is weak or negative. Revisit program mix and per-employee spend.",
    critical: "Training spend is not translating into productivity gains.",
  },
  engagement_level: {
    excellent: "Engagement at {value} reflects a motivated workforce.",
    moderate: "Engagement at {value} has room to grow through recognition and development.",
    poor: "Engagement at {value} is low — review voice mechanisms and conflict approach.",
    critical: "Engagement at {value} is critically low.",
  },
  dei_score: {
    excellent: "DEI maturity of {value} is strong across hiring, programs, and culture.",
    moderate: "DEI score of {value} is developing — expand diversity goals or leadership commitment.",
    poor: "DEI score of {value} needs improvement across recruitment and development choices.",
    critical: "DEI outcomes are weak despite integrated decision levers.",
  },
  budget_adherence: {
    excellent: "Budget adherence of {value} shows disciplined allocation.",
    moderate: "Budget adherence of {value} indicates some over- or under-spending.",
    poor: "Budget adherence of {value} reflects significant misalignment with the $500K pool.",
    critical: "Budget adherence of {value} is severely off target.",
  },
  time_to_fill: {
    excellent: "Time to fill of {value} is fast — vacancies close quickly.",
    moderate: "Time to fill of {value} is acceptable; HR technology or screening changes can help.",
    poor: "Time to fill of {value} is slow and may hurt operations.",
    critical: "Time to fill of {value} is critically slow.",
  },
  absenteeism_rate: {
    excellent: "Absenteeism at {value} is well controlled.",
    moderate: "Absenteeism at {value} is moderate — culture and flexibility still matter.",
    poor: "Absenteeism at {value} is elevated and costly.",
    critical: "Absenteeism at {value} is a serious workforce health signal.",
  },
  review_coverage: {
    excellent: "Review coverage of {value} ensures accountability and feedback.",
    moderate: "Review coverage of {value} could improve with more frequent reviews or 360° feedback.",
    poor: "Review coverage of {value} leaves many employees without structured feedback.",
    critical: "Review coverage of {value} is inadequate.",
  },
  training_effectiveness: {
    excellent: "Training effectiveness of {value} shows programs are lifting capability.",
    moderate: "Training effectiveness of {value} is moderate — add programs or increase coverage.",
    poor: "Training effectiveness of {value} is low relative to spend.",
    critical: "Training effectiveness of {value} is critically low.",
  },
  succession_pipeline: {
    excellent: "Succession pipeline strength of {value} protects leadership continuity.",
    moderate: "Succession pipeline of {value} is developing.",
    poor: "Succession pipeline of {value} is weak.",
    critical: "Succession pipeline of {value} needs urgent investment.",
  },
  compensation_ratio: {
    excellent: "Compensation ratio of {value} is lean relative to revenue.",
    moderate: "Compensation ratio of {value} is within a typical range.",
    poor: "Compensation ratio of {value} is high and pressures profit.",
    critical: "Compensation ratio of {value} is unsustainably high.",
  },
  hiring_quality: {
    excellent: "Hiring quality of {value} indicates strong selection and onboarding.",
    moderate: "Hiring quality of {value} is acceptable but can improve with rigor and training.",
    poor: "Hiring quality of {value} suggests weak selection or preparation.",
    critical: "Hiring quality of {value} is critically low.",
  },
  productivity: {
    excellent: "Workforce productivity index of {value} is strong.",
    moderate: "Productivity index of {value} is moderate — training and engagement drive gains.",
    poor: "Productivity index of {value} is limiting revenue growth.",
    critical: "Productivity index of {value} is critically low.",
  },
};

function metricStatus(
  value: number,
  excellent: number,
  poor: number,
  higherIsBetter: boolean
): Status {
  if (higherIsBetter) {
    if (value >= excellent) return "excellent";
    if (value >= (excellent + poor) / 2) return "moderate";
    if (value >= poor) return "poor";
    return "critical";
  }
  if (value <= excellent) return "excellent";
  if (value <= (excellent + poor) / 2) return "moderate";
  if (value <= poor) return "poor";
  return "critical";
}

function feedbackText(
  key: string,
  status: Status,
  formattedValue: string
): string {
  const tpl =
    FEEDBACK_TEMPLATES[key]?.[status] ??
    FEEDBACK_TEMPLATES[key]?.moderate ??
    `{name} is {value} ({status}). Review related HR decisions.`;
  return tpl
    .replace(/\{value\}/g, formattedValue)
    .replace(/\{name\}/g, key.replace(/_/g, " "))
    .replace(/\{status\}/g, status);
}

export function generateRoundSummary(
  bsc: BSCScores,
  metrics: HRMetrics,
  priorMetrics?: HRMetrics | null
): string {
  const parts: string[] = [];
  const improvements: string[] = [];
  const declines: string[] = [];

  if (priorMetrics) {
    if (metrics.employee_satisfaction > priorMetrics.employee_satisfaction + 2) {
      improvements.push("employee satisfaction");
    }
    if (metrics.engagement_level > priorMetrics.engagement_level + 2) {
      improvements.push("engagement");
    }
    if (metrics.turnover_rate < priorMetrics.turnover_rate - 2) {
      improvements.push("turnover");
    }
    if (metrics.training_roi > priorMetrics.training_roi + 5) {
      improvements.push("training ROI");
    }
    if (metrics.hiring_quality > priorMetrics.hiring_quality + 5) {
      improvements.push("hiring quality");
    }

    if (metrics.employee_satisfaction < priorMetrics.employee_satisfaction - 2) {
      declines.push("employee satisfaction");
    }
    if (metrics.turnover_rate > priorMetrics.turnover_rate + 2) {
      declines.push("turnover");
    }
    if (metrics.dei_score < priorMetrics.dei_score - 5) {
      declines.push("DEI maturity");
    }
  }

  if (improvements.length > 0) {
    parts.push(`This round, ${improvements.join(" and ")} improved.`);
  }
  if (declines.length > 0) {
    parts.push(
      `However, ${declines.join(" and ")} declined — review decisions in those areas.`
    );
  }

  const perspectives = [
    { name: "Financial", score: bsc.score_financial },
    { name: "Employee", score: bsc.score_employee },
    { name: "Internal Process", score: bsc.score_process },
    { name: "Learning & Growth", score: bsc.score_learning },
  ];
  const weakest = [...perspectives].sort((a, b) => a.score - b.score)[0];
  parts.push(
    `For next round, prioritize ${weakest.name} (scored ${weakest.score.toFixed(1)}) for the largest upside.`
  );

  return parts.join(" ");
}

export function generateFeedback(
  metrics: HRMetrics,
  _financials: FinancialMetrics,
  bsc: BSCScores,
  _industry: IndustryConfig,
  strategy: StrategyConfig,
  priorMetrics?: HRMetrics | null
): FeedbackPayload {
  const metricDefs: Array<{
    key: keyof HRMetrics;
    name: string;
    format: (v: number) => string;
    excellent: number;
    moderate: number;
    poor: number;
    higher: boolean;
    perspective: MetricFeedback["perspective"];
  }> = [
    {
      key: "cost_per_hire",
      name: "Cost Per Hire",
      format: (v) => formatCurrency(v),
      excellent: 4500,
      moderate: 7500,
      poor: 10000,
      higher: false,
      perspective: "financial",
    },
    {
      key: "time_to_fill",
      name: "Time to Fill",
      format: (v) => `${v.toFixed(0)} days`,
      excellent: 30,
      moderate: 45,
      poor: 60,
      higher: false,
      perspective: "process",
    },
    {
      key: "turnover_rate",
      name: "Turnover Rate",
      format: (v) => formatPercent(v),
      excellent: 10,
      moderate: 20,
      poor: 30,
      higher: false,
      perspective: "process",
    },
    {
      key: "employee_satisfaction",
      name: "Employee Satisfaction",
      format: (v) => `${v.toFixed(0)}/100`,
      excellent: 85,
      moderate: 70,
      poor: 55,
      higher: true,
      perspective: "employee",
    },
    {
      key: "training_roi",
      name: "Training ROI",
      format: (v) => formatPercent(v),
      excellent: 20,
      moderate: 7.5,
      poor: 0,
      higher: true,
      perspective: "financial",
    },
    {
      key: "engagement_level",
      name: "Engagement",
      format: (v) => `${v.toFixed(0)}/100`,
      excellent: 85,
      moderate: 70,
      poor: 55,
      higher: true,
      perspective: "employee",
    },
    {
      key: "dei_score",
      name: "DEI Score",
      format: (v) => `${v.toFixed(0)}/100`,
      excellent: 85,
      moderate: 67,
      poor: 50,
      higher: true,
      perspective: "employee",
    },
    {
      key: "budget_adherence",
      name: "Budget Adherence",
      format: (v) => formatPercent(v),
      excellent: 95,
      moderate: 75,
      poor: 60,
      higher: true,
      perspective: "financial",
    },
    {
      key: "absenteeism_rate",
      name: "Absenteeism",
      format: (v) => `${v.toFixed(1)} days/ee`,
      excellent: 4,
      moderate: 8,
      poor: 12,
      higher: false,
      perspective: "process",
    },
    {
      key: "review_coverage",
      name: "Review Coverage",
      format: (v) => formatPercent(v),
      excellent: 95,
      moderate: 80,
      poor: 65,
      higher: true,
      perspective: "process",
    },
    {
      key: "training_effectiveness",
      name: "Training Effectiveness",
      format: (v) => formatPercent(v),
      excellent: 20,
      moderate: 10,
      poor: 5,
      higher: true,
      perspective: "learning",
    },
    {
      key: "succession_pipeline",
      name: "Succession Pipeline",
      format: (v) => formatPercent(v),
      excellent: 80,
      moderate: 55,
      poor: 30,
      higher: true,
      perspective: "learning",
    },
    {
      key: "compensation_ratio",
      name: "Compensation Ratio",
      format: (v) => formatPercent(v),
      excellent: 30,
      moderate: 40,
      poor: 50,
      higher: false,
      perspective: "financial",
    },
    {
      key: "hiring_quality",
      name: "Hiring Quality",
      format: (v) => `${v.toFixed(0)}/100`,
      excellent: 80,
      moderate: 60,
      poor: 40,
      higher: true,
      perspective: "process",
    },
    {
      key: "productivity",
      name: "Productivity Index",
      format: (v) => formatPercent(v * 100),
      excellent: 0.55,
      moderate: 0.4,
      poor: 0.3,
      higher: true,
      perspective: "financial",
    },
    {
      key: "hr_tech_score",
      name: "HR Technology",
      format: (v) => `${v.toFixed(0)}/100`,
      excellent: 85,
      moderate: 60,
      poor: 30,
      higher: true,
      perspective: "learning",
    },
  ];

  const metricFeedbacks: MetricFeedback[] = metricDefs.map((def) => {
    const value = metrics[def.key] as number;
    const status = metricStatus(
      value,
      def.excellent,
      def.poor,
      def.higher
    );
    const formatted = def.format(value);
    return {
      metric_name: def.key,
      display_name: def.name,
      value,
      formatted_value: formatted,
      benchmark_excellent: def.excellent,
      benchmark_moderate: def.moderate,
      benchmark_poor: def.poor,
      status,
      feedback_text: feedbackText(def.key, status, formatted),
      perspective: def.perspective,
    };
  });

  const w = strategy.bsc_weights;
  const perspectives = [
    {
      perspective: "financial" as const,
      display_name: "Financial",
      score: bsc.score_financial,
      max: w.financial,
    },
    {
      perspective: "employee" as const,
      display_name: "Customer / Employee",
      score: bsc.score_employee,
      max: w.employee,
    },
    {
      perspective: "process" as const,
      display_name: "Internal Process",
      score: bsc.score_process,
      max: w.process,
    },
    {
      perspective: "learning" as const,
      display_name: "Learning & Growth",
      score: bsc.score_learning,
      max: w.learning,
    },
  ].map((p) => ({
    perspective: p.perspective,
    display_name: p.display_name,
    score: p.score,
    max_score: p.max,
    summary: SUMMARIES[p.perspective],
    top_strength:
      p.score >= p.max * 0.65
        ? `Strong performance in ${p.display_name} (${p.score.toFixed(1)}/${p.max}).`
        : `Room to grow in ${p.display_name}.`,
    top_weakness:
      p.score < p.max * 0.45
        ? `Prioritize investments that improve ${p.display_name} metrics.`
        : `Maintain momentum while optimizing spend.`,
  }));

  const round_summary = generateRoundSummary(bsc, metrics, priorMetrics);

  return { metrics: metricFeedbacks, perspectives, round_summary };
}
