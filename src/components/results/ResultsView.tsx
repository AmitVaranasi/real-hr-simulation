"use client";

import { WorkforceBriefClient } from "@/components/results/WorkforceBriefClient";
import type { RoundListItem } from "@/components/results/WorkforceBriefView";
import { getStrategyConfig } from "@/lib/engine/config";
import type { Strategy } from "@/lib/engine/types";

interface ResultsViewProps {
  teamId: string;
  roundId: string;
  roundNumber: number;
  sessionName: string;
  team: { name: string; industry: string; strategy: string };
  outcome: Record<string, unknown>;
  priorOutcome?: Record<string, unknown> | null;
  reflection?: { content: string; submitted_at: string } | null;
  rounds?: RoundListItem[];
  trendData?: Array<{
    round: string;
    total: number;
    financial: number;
    employee: number;
    process: number;
    learning: number;
  }>;
}

export function ResultsView({
  teamId,
  roundId,
  roundNumber,
  sessionName,
  team,
  outcome,
  reflection,
  rounds = [],
}: ResultsViewProps) {
  const strategyConfig = getStrategyConfig(team.strategy as Strategy);
  const weights = strategyConfig.bsc_weights;

  return (
    <WorkforceBriefClient
      data={{
        teamName: team.name,
        industry: team.industry,
        strategy: team.strategy,
        roundNumber,
        roundStatus: "closed",
        totalScore: Number(
          outcome.instructor_override ?? outcome.total_score ?? 0
        ),
        scoreFinancial: Number(outcome.score_financial ?? 0),
        scoreEmployee: Number(outcome.score_employee ?? 0),
        scoreProcess: Number(outcome.score_process ?? 0),
        scoreLearning: Number(outcome.score_learning ?? 0),
        maxFinancial: weights.financial,
        maxEmployee: weights.employee,
        maxProcess: weights.process,
        maxLearning: weights.learning,
        revenue: Number(outcome.revenue ?? 0),
        profit: Number(outcome.profit ?? 0),
        stockPrice: Number(outcome.stock_price ?? 0),
        marketShare: Number(outcome.market_share ?? 0),
        profitMargin: Number(outcome.profit_margin ?? 0),
        headcount: Number(outcome.headcount ?? 0),
        requiredHeadcount: 420,
        turnoverRate: Number(outcome.turnover_rate ?? 0),
        averageSalary:
          Number(outcome.total_compensation ?? 0) /
            Math.max(1, Number(outcome.headcount ?? 1)) || 0,
        compensationRatio: Number(outcome.compensation_ratio ?? 0),
        satisfaction: Number(outcome.employee_satisfaction ?? 0),
        engagement: Number(outcome.engagement_level ?? 0),
        costPerHire: Number(outcome.cost_per_hire ?? 0),
        timeToFill: Number(outcome.time_to_fill ?? 0),
        hiringQuality: Number(outcome.hiring_quality ?? 0),
        turnoverCost: Number(outcome.turnover_cost ?? 0),
        absenteeismRate: Number(outcome.absenteeism_rate ?? 0),
        trainingRoi: Number(outcome.training_roi ?? 0),
        trainingEffectiveness: Number(outcome.training_effectiveness ?? 0),
        successionPipeline: Number(outcome.succession_pipeline ?? 0),
        reviewCoverage: Number(outcome.review_coverage ?? 0),
        productivityIndex: Number(outcome.productivity ?? 0),
        budgetAdherence: Number(outcome.budget_adherence ?? 0),
        deiScore: Number(outcome.dei_score ?? 0),
        hrTechScore: Number(outcome.hr_tech_score ?? 0),
        rounds,
        selectedRoundId: roundId,
        reflectionContent: reflection?.content ?? null,
      }}
      teamId={teamId}
      roundId={roundId}
      sessionName={sessionName}
      team={team}
      outcome={outcome}
    />
  );
}
