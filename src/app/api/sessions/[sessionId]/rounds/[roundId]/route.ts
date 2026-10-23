import { requireInstructor } from "@/lib/api/auth";
import { processRound } from "@/lib/db/process-round";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ sessionId: string; roundId: string }> }
) {
  const { sessionId, roundId } = await params;
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const body = await request.json();
  const { status, economy_condition, decision_deadline } = body;

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("instructor_id", user!.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (status === "open") {
    // Rounds carry state forward, so they must run in order: refuse to open a
    // round while any earlier round in the session is still pending or open.
    const { data: target } = await supabase
      .from("rounds")
      .select("round_number")
      .eq("id", roundId)
      .eq("session_id", sessionId)
      .single();
    const { data: earlierUnclosed } = await supabase
      .from("rounds")
      .select("round_number")
      .eq("session_id", sessionId)
      .lt("round_number", target?.round_number ?? 0)
      .neq("status", "closed")
      .limit(1);
    if (earlierUnclosed?.length) {
      return NextResponse.json(
        {
          error: `Close round ${earlierUnclosed[0].round_number} before opening this one.`,
        },
        { status: 409 }
      );
    }
  }

  const updates: Record<string, unknown> = {};
  if (status === "open") {
    updates.status = "open";
    updates.opened_at = new Date().toISOString();
  } else if (status === "closed") {
    updates.status = "closed";
    updates.closed_at = new Date().toISOString();
  }
  if (economy_condition) {
    updates.economy_condition = economy_condition;
  }
  // Iteration 5 §7: the deadline is set here, in Round Management. `null`
  // clears it back to the neutral "no deadline established" state.
  if (decision_deadline !== undefined) {
    updates.decision_deadline = decision_deadline;
  }

  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .update(updates)
    .eq("id", roundId)
    .eq("session_id", sessionId)
    .select()
    .single();

  if (roundError) {
    return NextResponse.json({ error: roundError.message }, { status: 500 });
  }

  if (status === "closed") {
    // The round is closed first so no decision can change while it is scored.
    // If scoring fails, reopen it so the instructor can retry instead of being
    // left with a closed round and no results. Scored in-process rather than
    // over HTTP, so it never depends on NEXT_PUBLIC_APP_URL or deployment
    // protection in front of our own API.
    try {
      const processed = await processRound(
        createAdminClient(),
        sessionId,
        round
      );
      return NextResponse.json({
        round,
        processed: { computed: processed.results.length, ...processed },
      });
    } catch (e) {
      await supabase
        .from("rounds")
        .update({ status: "open", closed_at: null })
        .eq("id", roundId)
        .eq("session_id", sessionId);
      return NextResponse.json(
        {
          error: `Round could not be processed and has been reopened: ${
            e instanceof Error ? e.message : "unknown error"
          }`,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ round });
}
