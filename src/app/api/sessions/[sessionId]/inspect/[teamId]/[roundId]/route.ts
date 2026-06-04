import { requireInstructor } from "@/lib/api/auth";
import { computeTeamOutcome, priorMetricsFromOutcome } from "@/lib/db/compute";
import { rowToDecision } from "@/lib/db/decisions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EconomyCondition, SimulationTrace, Team } from "@/lib/engine/types";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ sessionId: string; teamId: string; roundId: string }>;
  }
) {
  const { sessionId, teamId, roundId } = await params;
  const { error, user } = await requireInstructor();
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

  const { data: session } = await admin
    .from("sessions")
    .select("id, name, instructor_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.instructor_id !== user!.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: team } = await admin
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("session_id", sessionId)
    .single();

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
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

  const { data: decision } = await admin
    .from("decisions")
    .select("*")
    .eq("team_id", teamId)
    .eq("round_id", roundId)
    .maybeSingle();

  const { data: storedOutcome } = await admin
    .from("outcomes")
    .select("trace_json")
    .eq("team_id", teamId)
    .eq("round_id", roundId)
    .maybeSingle();

  let trace: SimulationTrace | null =
    (storedOutcome?.trace_json as SimulationTrace | null) ?? null;

  if (!trace && decision) {
    const roundNumber = Number(round.round_number);
    const { data: priorRound } = await admin
      .from("rounds")
      .select("id")
      .eq("session_id", sessionId)
      .eq("round_number", roundNumber - 1)
      .maybeSingle();

    let priorMetrics = null;
    if (priorRound) {
      const { data: priorOutcome } = await admin
        .from("outcomes")
        .select("*")
        .eq("team_id", teamId)
        .eq("round_id", priorRound.id)
        .maybeSingle();
      priorMetrics = priorMetricsFromOutcome(priorOutcome);
    }

    const computed = computeTeamOutcome(
      decision,
      team as Team,
      round.economy_condition as EconomyCondition,
      priorMetrics
    );
    trace = computed.trace;
  }

  if (!trace) {
    return NextResponse.json(
      { error: "No decision or computed outcome for this team/round" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    session: { id: session.id, name: session.name },
    team: {
      id: team.id,
      name: team.name,
      industry: team.industry,
      strategy: team.strategy,
    },
    round: {
      id: round.id,
      round_number: round.round_number,
      round_type: round.round_type,
      economy_condition: round.economy_condition,
    },
    decision: decision ? rowToDecision(decision) : null,
    trace,
  });
}
