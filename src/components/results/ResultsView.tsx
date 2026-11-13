"use client";

import { WorkforceBriefClient } from "@/components/results/WorkforceBriefClient";
import type { RoundListItem } from "@/components/results/WorkforceBriefView";
import { outcomeToBriefData } from "@/lib/results/workforce-brief-data";

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
  roundsTotal?: number;
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
  roundsTotal,
}: ResultsViewProps) {
  return (
    <WorkforceBriefClient
      data={{
        ...outcomeToBriefData(team, outcome, roundNumber),
        rounds,
        roundsTotal,
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
