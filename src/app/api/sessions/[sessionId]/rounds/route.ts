import { requireInstructor } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const roundType =
    body.round_type === "practice" ? "practice" : "competitive";

  const { data: session } = await supabase
    .from("sessions")
    .select("id, rounds_total, practice_rounds, status")
    .eq("id", sessionId)
    .eq("instructor_id", user!.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: existing, error: listError } = await supabase
    .from("rounds")
    .select("round_number")
    .eq("session_id", sessionId)
    .order("round_number", { ascending: false })
    .limit(1);

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const nextNumber = (existing?.[0]?.round_number ?? 0) + 1;
  const { data: round, error: insertError } = await supabase
    .from("rounds")
    .insert({
      session_id: sessionId,
      round_number: nextNumber,
      round_type: roundType,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const sessionPatch: Record<string, unknown> = { status: "active" };
  if (roundType === "practice") {
    sessionPatch.practice_rounds = Number(session.practice_rounds ?? 0) + 1;
  } else {
    sessionPatch.rounds_total = Number(session.rounds_total ?? 0) + 1;
  }

  await supabase
    .from("sessions")
    .update(sessionPatch)
    .eq("id", sessionId)
    .eq("instructor_id", user!.id);

  return NextResponse.json({ round }, { status: 201 });
}
