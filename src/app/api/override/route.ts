import { requireInstructor } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const { error, user } = await requireInstructor();
  if (error) return error;

  const { team_id, round_id, override_score, reason } = await request.json();

  if (!team_id || !round_id || override_score === undefined) {
    return NextResponse.json(
      { error: "team_id, round_id, override_score required" },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Admin unavailable" },
      { status: 500 }
    );
  }

  const { data: team } = await admin
    .from("teams")
    .select("session_id")
    .eq("id", team_id)
    .single();

  const { data: session } = await admin
    .from("sessions")
    .select("instructor_id")
    .eq("id", team?.session_id)
    .single();

  if (session?.instructor_id !== user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error: updateError } = await admin
    .from("outcomes")
    .update({
      instructor_override: override_score,
      override_reason: reason ?? null,
    })
    .eq("team_id", team_id)
    .eq("round_id", round_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ outcome: data });
}
