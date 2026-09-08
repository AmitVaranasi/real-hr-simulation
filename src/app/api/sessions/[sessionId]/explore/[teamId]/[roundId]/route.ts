import { requireInstructor } from "@/lib/api/auth";
import { computeTeamOutcome, priorMetricsFromOutcome } from "@/lib/db/compute";
import { decisionToRow, rowToDecision } from "@/lib/db/decisions";
import { withSimulationConfig } from "@/lib/db/simulation-config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Decision, EconomyCondition, Team } from "@/lib/engine/types";
import { NextResponse } from "next/server";

/**
 * Professor Instructional Exploration — what-if preview for one team.
 *
 * Iteration 5 §13 fixes the architecture, and this route is the middle of it:
 *
 *   Team Decision State -> Temporary Professor Instructional Copy ->
 *   Existing Simulation Engine / Preview Logic -> What-If Result -> Discard
 *
 * "Do not create a separate simulation engine for professor what-if analysis",
 * so this calls the same `computeTeamOutcome` the live round uses, against the
 * team's real prior state.
 *
 * §12 constrains what it may touch. This handler performs NO writes at all:
 * the team's decisions, submission timestamps, outcomes, team state and round
 * are read and never modified, so exploration cannot overwrite a student
 * decision, count as a student edit, affect scoring, or enter the academic
 * record.
 */
export async function POST(
  request: Request,
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
    .select("id, instructor_id")
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

  const { data: storedDecision } = await admin
    .from("decisions")
    .select("*")
    .eq("team_id", teamId)
    .eq("round_id", roundId)
    .maybeSingle();
  if (!storedDecision) {
    return NextResponse.json(
      { error: "This team has no decisions for that round yet." },
      { status: 404 }
    );
  }

  // The temporary instructional copy: the team's saved decision with the
  // professor's overrides layered on top. It exists only for this request.
  const body = (await request.json().catch(() => ({}))) as {
    overrides?: Partial<Decision>;
  };
  const actual = rowToDecision(storedDecision);
  const explored: Decision = { ...actual, ...(body.overrides ?? {}) };

  // Prior state comes from the real previous round, so the what-if sits in the
  // team's actual trajectory rather than a synthetic one.
  const { data: priorRound } = await admin
    .from("rounds")
    .select("id")
    .eq("session_id", sessionId)
    .eq("round_number", Number(round.round_number) - 1)
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

  const economy = round.economy_condition as EconomyCondition;
  const { actualOutcome, exploredOutcome } = await withSimulationConfig(
    async () => ({
      // The stored row goes in untouched; the instructional copy is encoded
      // the same way a real decision would be, so both sides of the
      // comparison travel the identical engine path.
      actualOutcome: computeTeamOutcome(
        storedDecision,
        team as Team,
        economy,
        priorMetrics
      ),
      exploredOutcome: computeTeamOutcome(
        decisionToRow(explored, teamId, roundId),
        team as Team,
        economy,
        priorMetrics
      ),
    })
  );

  return NextResponse.json({
    // Explicit so the client can state it to the professor on screen.
    recorded: false,
    team: { id: team.id, name: team.name, industry: team.industry, strategy: team.strategy },
    round: {
      id: round.id,
      round_number: round.round_number,
      round_type: round.round_type,
      economy_condition: round.economy_condition,
    },
    actual: actualOutcome.outcome,
    explored: exploredOutcome.outcome,
    decision: actual,
  });
}
