"use client";

import Link from "next/link";
import { BSCScorecard } from "@/components/results/BSCScorecard";
import { FeedbackPanel } from "@/components/results/FeedbackPanel";
import { HRCoachPlaceholder } from "@/components/results/HRCoachPlaceholder";
import { LearningInsightsPanel } from "@/components/results/LearningInsightsPanel";
import { OutcomeMetricTable } from "@/components/results/MetricTable";
import { TrendChart } from "@/components/results/TrendChart";
import { ReflectionDisplay } from "@/components/reflection/ReflectionDisplay";
import { ReflectionForm } from "@/components/reflection/ReflectionForm";
import { FinancialCard } from "@/components/shared/FinancialCard";
import { ReportsSubnav } from "@/components/student/ReportsSubnav";
import { Button } from "@/components/ui/button";
import { getStrategyConfig } from "@/lib/engine/config";
import type { BSCScores, FeedbackPayload, Strategy } from "@/lib/engine/types";
import { generateTeamPdf, outcomeToPdfData } from "@/lib/export/pdf";

interface ResultsViewProps {
  teamId: string;
  roundId: string;
  roundNumber: number;
  sessionName: string;
  team: { name: string; industry: string; strategy: string };
  outcome: Record<string, unknown>;
  priorOutcome?: Record<string, unknown> | null;
  reflection?: { content: string; submitted_at: string } | null;
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
  priorOutcome,
  reflection,
  trendData,
}: ResultsViewProps) {
  const displayScore = Number(
    outcome.instructor_override ?? outcome.total_score
  );

  const bsc: BSCScores = {
    score_financial: Number(outcome.score_financial),
    score_employee: Number(outcome.score_employee),
    score_process: Number(outcome.score_process),
    score_learning: Number(outcome.score_learning),
    total_score: displayScore,
    strategy_bonus: Number(outcome.strategy_bonus),
    industry_penalty: Number(outcome.industry_penalty),
  };

  const feedback = outcome.feedback_json as FeedbackPayload | undefined;
  const strategyConfig = getStrategyConfig(team.strategy as Strategy);

  function handlePdf() {
    const data = outcomeToPdfData(sessionName, team, roundNumber, outcome);
    if (reflection) data.reflection = reflection.content;
    generateTeamPdf(data);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#e67e22]">
          Reports & HR Analytics
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#0f172a] sm:text-3xl">
          The Workforce Brief — Round {roundNumber}
        </h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          {sessionName} · {team.name} · {team.industry} · {team.strategy}
        </p>
      </div>

      <ReportsSubnav activeHref="/reports/workforce-brief" />

      {outcome.instructor_override != null && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Instructor adjusted score: {Number(outcome.instructor_override).toFixed(1)}
          {outcome.override_reason
            ? ` — ${String(outcome.override_reason)}`
            : ""}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/reports/workforce-brief"
          className="text-sm font-medium text-[#e67e22] hover:underline"
        >
          ← All Workforce Briefs
        </Link>
        <Button variant="outline" size="sm" onClick={handlePdf}>
          Download PDF Report
        </Button>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold uppercase tracking-wide text-[#0f172a]">
          HR Balance Scorecard
        </h2>
        <BSCScorecard scores={bsc} bscWeights={strategyConfig.bsc_weights} />
      </section>

      {trendData && trendData.length >= 2 && <TrendChart data={trendData} />}

      <section>
        <h2 className="mb-3 text-lg font-semibold uppercase tracking-wide text-[#0f172a]">
          Strategic Performance Metrics KPIs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FinancialCard
            label="Revenue"
            value={Number(outcome.revenue)}
            priorValue={
              priorOutcome ? Number(priorOutcome.revenue) : undefined
            }
          />
          <FinancialCard
            label="Profit"
            value={Number(outcome.profit)}
            priorValue={priorOutcome ? Number(priorOutcome.profit) : undefined}
          />
          <FinancialCard
            label="Stock Price"
            value={Number(outcome.stock_price)}
            priorValue={
              priorOutcome ? Number(priorOutcome.stock_price) : undefined
            }
            format="number"
          />
          <FinancialCard
            label="Market Share"
            value={Number(outcome.market_share)}
            format="percent"
          />
          <FinancialCard
            label="Profit Margin"
            value={Number(outcome.profit_margin)}
            format="percent"
          />
          <FinancialCard
            label="Headcount"
            value={Number(outcome.headcount)}
            format="number"
          />
        </div>
      </section>

      {feedback && (
        <section>
          <h2 className="mb-3 text-lg font-semibold uppercase tracking-wide text-[#0f172a]">
            Feedback: Perspective Summaries
          </h2>
          <FeedbackPanel feedback={feedback} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold uppercase tracking-wide text-[#0f172a]">
          Workforce Performance Metrics
        </h2>
        <OutcomeMetricTable outcome={outcome} />
      </section>

      {feedback?.learning_insights && (
        <section>
          <h2 className="mb-3 text-lg font-semibold uppercase tracking-wide text-[#0f172a]">
            Feedback: Workforce Performance Metrics
          </h2>
          <LearningInsightsPanel insights={feedback.learning_insights} />
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <HRCoachPlaceholder />
        <section>
          {reflection ? (
            <ReflectionDisplay
              content={reflection.content}
              submittedAt={reflection.submitted_at}
            />
          ) : (
            <ReflectionForm teamId={teamId} roundId={roundId} />
          )}
        </section>
      </div>
    </div>
  );
}
