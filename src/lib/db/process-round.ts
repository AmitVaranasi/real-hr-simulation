import {
  computeTeamOutcome,
  loadRoundStart,
  outcomeToDbRow,
  teamStateUpdateFromOutcome,
} from "@/lib/db/compute";
import { withSimulationConfig } from "@/lib/db/simulation-config";
import type { EconomyCondition, Team } from "@/lib/engine/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ProcessedTeam = {
  team_id: string;
  team_name: string;
  total_score: number;
};

export type SkippedTeam = {
  team_id: string;
  team_name: string;
  reason: "draft" | "no_decision";
};

/**
 * Score one round for every team in the session and persist the outcomes.
 *
 * Only submitted decisions are scored; a draft or a missing decision leaves
 * that team without an outcome for the round, and its next round starts from
 * its last scored state. Safe to run more than once: each team starts from its
 * stored earlier outcomes, not from the live `teams` row.
 */
export async function processRound(
  admin: SupabaseClient,
  sessionId: string,
  round: { id: string; round_number: number; economy_condition: string }
): Promise<{ results: ProcessedTeam[]; skipped: SkippedTeam[] }> {
  const roundNumber = Number(round.round_number);
  const economy = round.economy_condition as EconomyCondition;

  const [{ data: teams, error: teamsError }, { data: decisions, error: decisionsError }] =
    await Promise.all([
      admin.from("teams").select("*").eq("session_id", sessionId),
      admin.from("decisions").select("*").eq("round_id", round.id),
    ]);
  if (teamsError) throw new Error(teamsError.message);
  if (decisionsError) throw new Error(decisionsError.message);

  const decisionByTeam = new Map(
    (decisions ?? []).map((d) => [d.team_id as string, d])
  );

  return withSimulationConfig(async () => {
    const results: ProcessedTeam[] = [];
    const skipped: SkippedTeam[] = [];

    for (const team of (teams ?? []) as Team[]) {
      const decision = decisionByTeam.get(team.id);
      if (!decision?.is_submitted) {
        skipped.push({
          team_id: team.id,
          team_name: team.name,
          reason: decision ? "draft" : "no_decision",
        });
        continue;
      }

      const { startTeam, priorMetrics, hasLaterOutcome } = await loadRoundStart(
        admin,
        team,
        sessionId,
        roundNumber
      );
      const { outcome, trace, newCarryover } = computeTeamOutcome(
        decision,
        startTeam,
        economy,
        priorMetrics
      );

      const { error: outcomeError } = await admin.from("outcomes").upsert(
        { ...outcomeToDbRow(team.id, round.id, outcome), trace_json: trace },
        { onConflict: "team_id,round_id" }
      );
      if (outcomeError) {
        throw new Error(`Saving results for ${team.name}: ${outcomeError.message}`);
      }

      // Re-processing an earlier round must not rewind a team that has
      // already been scored in a later one.
      if (!hasLaterOutcome) {
        const { error: teamError } = await admin
          .from("teams")
          .update(teamStateUpdateFromOutcome(outcome, newCarryover))
          .eq("id", team.id);
        if (teamError) {
          throw new Error(`Updating ${team.name}: ${teamError.message}`);
        }
      }

      results.push({
        team_id: team.id,
        team_name: team.name,
        total_score: outcome.bsc_scores.total_score,
      });
    }

    return { results, skipped };
  });
}
