import {
  computeTeamOutcome,
  loadRoundStart,
  outcomeToDbRow,
  teamStateUpdateFromOutcome,
} from "@/lib/db/compute";
import { withSimulationConfig } from "@/lib/db/simulation-config";
import { ENGINE_VERSION } from "@/lib/engine/version";
import type {
  EconomyCondition,
  SimulationTrace,
  Team,
} from "@/lib/engine/types";
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

/** A team whose stored result for the round was kept as it was. */
export type PreservedTeam = {
  team_id: string;
  team_name: string;
  total_score: number;
};

/** True when a stored result was scored under earlier rules than today's. */
export function scoredUnderEarlierRules(
  outcome: Record<string, unknown> | null | undefined
): boolean {
  if (!outcome) return false;
  const version = (outcome.trace_json as SimulationTrace | null)?.engine_version;
  return (version ?? 1) < ENGINE_VERSION;
}

/**
 * Score one round for every team in the session and persist the outcomes.
 *
 * Only submitted decisions are scored; a draft or a missing decision leaves
 * that team without an outcome for the round, and its next round starts from
 * its last scored state. Safe to run more than once: each team starts from its
 * stored earlier outcomes, not from the live `teams` row.
 *
 * A result already stored under earlier scoring rules is never overwritten:
 * rule changes apply from the next round a team is scored in, and results
 * students have already seen stay as they were. Such teams come back in
 * `preserved`.
 */
export async function processRound(
  admin: SupabaseClient,
  sessionId: string,
  round: { id: string; round_number: number; economy_condition: string }
): Promise<{
  results: ProcessedTeam[];
  skipped: SkippedTeam[];
  preserved: PreservedTeam[];
}> {
  const roundNumber = Number(round.round_number);
  const economy = round.economy_condition as EconomyCondition;

  const [
    { data: teams, error: teamsError },
    { data: decisions, error: decisionsError },
    { data: existing, error: existingError },
  ] = await Promise.all([
    admin.from("teams").select("*").eq("session_id", sessionId),
    admin.from("decisions").select("*").eq("round_id", round.id),
    admin
      .from("outcomes")
      .select("team_id, total_score, trace_json")
      .eq("round_id", round.id),
  ]);
  if (teamsError) throw new Error(teamsError.message);
  if (decisionsError) throw new Error(decisionsError.message);
  if (existingError) throw new Error(existingError.message);

  const existingByTeam = new Map(
    (existing ?? []).map((o) => [o.team_id as string, o])
  );

  const decisionByTeam = new Map(
    (decisions ?? []).map((d) => [d.team_id as string, d])
  );

  return withSimulationConfig(async () => {
    const results: ProcessedTeam[] = [];
    const skipped: SkippedTeam[] = [];
    const preserved: PreservedTeam[] = [];

    for (const team of (teams ?? []) as Team[]) {
      const stored = existingByTeam.get(team.id);
      if (scoredUnderEarlierRules(stored)) {
        preserved.push({
          team_id: team.id,
          team_name: team.name,
          total_score: Number(stored?.total_score ?? 0),
        });
        continue;
      }

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

    return { results, skipped, preserved };
  });
}
