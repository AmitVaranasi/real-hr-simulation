import { requireInstructor } from "@/lib/api/auth";
import {
  computeTeamOutcome,
  outcomeToDbRow,
  teamStateUpdateFromOutcome,
} from "@/lib/db/compute";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EconomyCondition, Team } from "@/lib/engine/types";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  {
    params,
  }: { params: Promise<{ sessionId: string; roundId: string }> }
) {
  const { sessionId, roundId } = await params;
  const { error } = await requireInstructor();
  if (error) return error;

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Admin client unavailable" },
      { status: 500 }
    );
  }

  const { data: round, error: roundError } = await admin
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .eq("session_id", sessionId)
    .single();

  if (roundError || !round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  const economy = round.economy_condition as EconomyCondition;

  const { data: teams, error: teamsError } = await admin
    .from("teams")
    .select("*")
    .eq("session_id", sessionId);

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 });
  }

  const results = [];

  for (const team of teams ?? []) {
    const { data: decision } = await admin
      .from("decisions")
      .select("*")
      .eq("team_id", team.id)
      .eq("round_id", roundId)
      .single();

    if (!decision) continue;

    const { outcome, trace, newCarryover } = computeTeamOutcome(
      decision,
      team as Team,
      economy
    );

    const outcomeRow = {
      ...outcomeToDbRow(team.id, roundId, outcome),
      trace_json: trace,
    };

    await admin.from("outcomes").upsert(outcomeRow, {
      onConflict: "team_id,round_id",
    });

    await admin
      .from("teams")
      .update(teamStateUpdateFromOutcome(outcome, newCarryover))
      .eq("id", team.id);

    results.push({
      team_id: team.id,
      team_name: team.name,
      total_score: outcome.bsc_scores.total_score,
    });
  }

  return NextResponse.json({ computed: results.length, results });
}
