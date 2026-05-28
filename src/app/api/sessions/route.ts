import { requireInstructor } from "@/lib/api/auth";
import { priorStateFromIndustry } from "@/lib/engine/config";
import type { Industry } from "@/lib/engine/types";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const { data, error: dbError } = await supabase
    .from("sessions")
    .select("*, rounds(*)")
    .eq("instructor_id", user!.id)
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({ sessions: data });
}

export async function POST(request: Request) {
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const body = await request.json();
  const {
    name,
    course_code,
    semester,
    rounds_total = 3,
    practice_rounds = 1,
  } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      instructor_id: user!.id,
      name,
      course_code: course_code ?? null,
      semester: semester ?? null,
      rounds_total,
      practice_rounds,
      status: "setup",
    })
    .select()
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  const rounds = [];
  for (let i = 1; i <= practice_rounds; i++) {
    rounds.push({
      session_id: session.id,
      round_number: i,
      round_type: "practice",
      status: "pending",
    });
  }
  for (let i = 1; i <= rounds_total; i++) {
    rounds.push({
      session_id: session.id,
      round_number: practice_rounds + i,
      round_type: "competitive",
      status: "pending",
    });
  }

  const { data: createdRounds, error: roundsError } = await supabase
    .from("rounds")
    .insert(rounds)
    .select();

  if (roundsError) {
    return NextResponse.json({ error: roundsError.message }, { status: 500 });
  }

  return NextResponse.json({ session, rounds: createdRounds }, { status: 201 });
}
