import { requireInstructor } from "@/lib/api/auth";
import { decisionToRow } from "@/lib/db/decisions";
import { createDefaultDecision } from "@/lib/engine/defaults";
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
  const { status, economy_condition } = body;

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("instructor_id", user!.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
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

  if (status === "open") {
    const { data: teams } = await supabase
      .from("teams")
      .select("id")
      .eq("session_id", sessionId);

    if (teams) {
      for (const team of teams) {
        const { data: existing } = await supabase
          .from("decisions")
          .select("id")
          .eq("team_id", team.id)
          .eq("round_id", roundId)
          .maybeSingle();

        if (!existing) {
          const defaults = createDefaultDecision();
          await supabase.from("decisions").insert(
            decisionToRow(
              { ...defaults, team_id: team.id, round_id: roundId },
              team.id,
              roundId
            )
          );
        }
      }
    }
  }

  if (status === "closed") {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    await fetch(
      `${baseUrl}/api/sessions/${sessionId}/rounds/${roundId}/compute`,
      { method: "POST", headers: { cookie: request.headers.get("cookie") ?? "" } }
    );
  }

  return NextResponse.json({ round });
}
