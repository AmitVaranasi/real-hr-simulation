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

function statusFromScore(score: number, max = 25): Status {
  const pct = (score / max) * 100;
  if (pct >= 80) return "excellent";
  if (pct >= 55) return "moderate";
  if (pct >= 35) return "poor";
  return "critical";
}

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

export function generateFeedback(
  metrics: HRMetrics,
  _financials: FinancialMetrics,
  bsc: BSCScores,
  _industry: IndustryConfig,
  _strategy: StrategyConfig
): FeedbackPayload {
  const retention = 100 - metrics.turnover_rate;

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
  ];

  const metricFeedbacks: MetricFeedback[] = metricDefs.map((def) => {
    const value = metrics[def.key] as number;
    const status = metricStatus(
      value,
      def.excellent,
      def.poor,
      def.higher
    );
    return {
      metric_name: def.key,
      display_name: def.name,
      value,
      formatted_value: def.format(value),
      benchmark_excellent: def.excellent,
      benchmark_moderate: def.moderate,
      benchmark_poor: def.poor,
      status,
      feedback_text: `${def.name} is ${def.format(value)} (${status}). Review related HR module decisions to improve this metric.`,
      perspective: def.perspective,
    };
  });

  const perspectives = [
    {
      perspective: "financial" as const,
      display_name: "Financial",
      score: bsc.score_financial,
      max: 30,
    },
    {
      perspective: "employee" as const,
      display_name: "Customer / Employee",
      score: bsc.score_employee,
      max: 35,
    },
    {
      perspective: "process" as const,
      display_name: "Internal Process",
      score: bsc.score_process,
      max: 30,
    },
    {
      perspective: "learning" as const,
      display_name: "Learning & Growth",
      score: bsc.score_learning,
      max: 35,
    },
  ].map((p) => ({
    perspective: p.perspective,
    display_name: p.display_name,
    score: p.score,
    max_score: p.max,
    summary: SUMMARIES[p.perspective],
    top_strength:
      p.score >= 20
        ? `Strong performance in ${p.display_name} (${p.score.toFixed(1)}/${p.max}).`
        : `Room to grow in ${p.display_name}.`,
    top_weakness:
      p.score < 15
        ? `Prioritize investments that improve ${p.display_name} metrics.`
        : `Maintain momentum while optimizing spend.`,
  }));

  void retention;

  return { metrics: metricFeedbacks, perspectives };
}
