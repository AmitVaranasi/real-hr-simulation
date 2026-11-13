import type {
  RoundListItem,
  WorkforceBriefData,
} from "@/components/results/WorkforceBriefView";
import { getStrategyConfig } from "@/lib/engine/config";
import type { Strategy } from "@/lib/engine/types";

/**
 * The single mapping from a scored `outcomes` row to the Workforce Brief.
 *
 * The student results page, the student Workforce Brief index and the
 * professor's read-only Workforce Brief all go through this function, so a
 * professor and a student looking at the same team and round see the same
 * numbers.
 */
export function outcomeToBriefData(
  team: { name: string; industry: string; strategy: string },
  outcome: Record<string, unknown>,
  roundNumber: number
): Omit<WorkforceBriefData, "rounds" | "roundsTotal" | "selectedRoundId"> {
  const weights = getStrategyConfig(
    (team.strategy || "Focus") as Strategy
  ).bsc_weights;
  const n = (key: string) => Number(outcome[key] ?? 0);

  return {
    teamName: team.name,
    industry: team.industry,
    strategy: team.strategy,
    roundNumber,
    roundStatus: "closed",
    totalScore: Number(outcome.instructor_override ?? outcome.total_score ?? 0),
    scoreFinancial: n("score_financial"),
    scoreEmployee: n("score_employee"),
    scoreProcess: n("score_process"),
    scoreLearning: n("score_learning"),
    maxFinancial: weights.financial,
    maxEmployee: weights.employee,
    maxProcess: weights.process,
    maxLearning: weights.learning,
    revenue: n("revenue"),
    profit: n("profit"),
    stockPrice: n("stock_price"),
    marketShare: n("market_share"),
    profitMargin: n("profit_margin"),
    headcount: n("headcount"),
    requiredHeadcount: 420,
    turnoverRate: n("turnover_rate"),
    averageSalary: n("total_compensation") / Math.max(1, n("headcount")) || 0,
    compensationRatio: n("compensation_ratio"),
    satisfaction: n("employee_satisfaction"),
    engagement: n("engagement_level"),
    costPerHire: n("cost_per_hire"),
    timeToFill: n("time_to_fill"),
    hiringQuality: n("hiring_quality"),
    turnoverCost: n("turnover_cost"),
    absenteeismRate: n("absenteeism_rate"),
    trainingRoi: n("training_roi"),
    trainingEffectiveness: n("training_effectiveness"),
    successionPipeline: n("succession_pipeline"),
    reviewCoverage: n("review_coverage"),
    productivityIndex: n("productivity"),
    budgetAdherence: n("budget_adherence"),
    deiScore: n("dei_score"),
    hrTechScore: n("hr_tech_score"),
  };
}

export function formatRoundDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type RoundJoin = {
  id?: string;
  round_number?: number;
  closed_at?: string | null;
} | null;

/** Outcomes (joined with `rounds`) → the brief's round list, oldest first. */
export function outcomesToRoundList(
  outcomes: Array<Record<string, unknown>>,
  hrefFor: (roundId: string) => string
): RoundListItem[] {
  return outcomes
    .map((o) => {
      const r = o.rounds as RoundJoin;
      const roundId = String(o.round_id ?? r?.id ?? "");
      return {
        id: String(o.id),
        roundId,
        roundNumber: r?.round_number ?? 0,
        dateLabel: formatRoundDate(
          r?.closed_at ?? (o.computed_at as string | undefined)
        ),
        href: hrefFor(roundId),
      };
    })
    .sort((a, b) => a.roundNumber - b.roundNumber);
}
