import { requireInstructorOrAdmin } from "@/lib/api/auth";
import {
  computeTeamOutcome,
  outcomeToDbRow,
  priorMetricsFromOutcome,
  teamStateUpdateFromOutcome,
} from "@/lib/db/compute";
import { withSimulationConfig } from "@/lib/db/simulation-config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EconomyCondition, Team } from "@/lib/engine/types";
import { NextResponse } from "next/server";

/** Manual round processing from Simulation Configuration Center (V3). */
export async function POST(request: Request) {
  const { error } = await requireInstructorOrAdmin();
  if (error) return error;

  const { sessionId, roundId } = await request.json();
  if (!sessionId || !roundId) {
    return NextResponse.json(
      { error: "sessionId and roundId required" },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Admin client unavailable" },
      { status: 500 }
    );
  }

  const { data: round } = await admin
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .eq("session_id", sessionId)
    .single();

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  const economy = round.economy_condition as EconomyCondition;
  const roundNumber = Number(round.round_number);

  const { data: priorRound } = await admin
    .from("rounds")
    .select("id")
    .eq("session_id", sessionId)
    .eq("round_number", roundNumber - 1)
    .maybeSingle();

  const { data: teams } = await admin
    .from("teams")
    .select("*")
    .eq("session_id", sessionId);

  const results = await withSimulationConfig(async () => {
    const computed = [];
    for (const team of teams ?? []) {
      const { data: decision } = await admin
        .from("decisions")
        .select("*")
        .eq("team_id", team.id)
        .eq("round_id", roundId)
        .single();

      if (!decision) continue;

      let priorMetrics = null;
      if (priorRound) {
        const { data: priorOutcome } = await admin
          .from("outcomes")
          .select("*")
          .eq("team_id", team.id)
          .eq("round_id", priorRound.id)
          .maybeSingle();
        priorMetrics = priorMetricsFromOutcome(priorOutcome);
      }

      const { outcome, trace, newCarryover } = computeTeamOutcome(
        decision,
        team as Team,
        economy,
        priorMetrics
      );

      await admin.from("outcomes").upsert(
        {
          ...outcomeToDbRow(team.id, roundId, outcome),
          trace_json: trace,
        },
        { onConflict: "team_id,round_id" }
      );

      await admin
        .from("teams")
        .update(teamStateUpdateFromOutcome(outcome, newCarryover))
        .eq("id", team.id);

      computed.push({
        team_id: team.id,
        team_name: team.name,
        total_score: outcome.bsc_scores.total_score,
      });
    }
    return computed;
  });

  return NextResponse.json({ computed: results.length, results });
}
