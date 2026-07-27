import { requireInstructor } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const { data: session, error: dbError } = await supabase
    .from("sessions")
    .select("*, rounds(*), teams(*)")
    .eq("id", sessionId)
    .eq("instructor_id", user!.id)
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 404 });
  }
  return NextResponse.json({ session });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const body = await request.json();
  const allowed: Record<string, unknown> = {};
  if (typeof body.name === "string") allowed.name = body.name;
  if (typeof body.course_code === "string" || body.course_code === null) {
    allowed.course_code = body.course_code;
  }
  if (typeof body.semester === "string" || body.semester === null) {
    allowed.semester = body.semester;
  }
  if (typeof body.status === "string") allowed.status = body.status;
  if (typeof body.announcement === "string" || body.announcement === null) {
    allowed.announcement = body.announcement;
  }
  if (typeof body.rounds_total === "number") {
    allowed.rounds_total = body.rounds_total;
  }
  if (typeof body.practice_rounds === "number") {
    allowed.practice_rounds = body.practice_rounds;
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error: dbError } = await supabase
    .from("sessions")
    .update(allowed)
    .eq("id", sessionId)
    .eq("instructor_id", user!.id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({ session: data });
}
