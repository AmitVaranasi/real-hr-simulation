import { requireInstructor } from "@/lib/api/auth";
import { buildLeaderboard } from "@/lib/leaderboard";
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

  const { released } = await request.json();

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("instructor_id", user!.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .update({ leaderboard_released: Boolean(released) })
    .eq("id", roundId)
    .eq("session_id", sessionId)
    .select()
    .single();

  if (roundError) {
    return NextResponse.json({ error: roundError.message }, { status: 500 });
  }

  return NextResponse.json({ round });
}

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ sessionId: string; roundId: string }> }
) {
  const { sessionId, roundId } = await params;
  const { error, supabase } = await requireInstructor();
  if (error) return error;

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, industry, strategy")
    .eq("session_id", sessionId);

  const { data: outcomes } = await supabase
    .from("outcomes")
    .select("team_id, total_score, instructor_override, revenue, stock_price")
    .eq("round_id", roundId);

  const entries = buildLeaderboard(teams ?? [], outcomes ?? []);

  return NextResponse.json({ entries });
}
