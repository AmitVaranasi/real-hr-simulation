import { requireInstructor } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("instructor_id", user!.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("session_id", sessionId);

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("session_id", sessionId)
    .order("round_number");

  const teamIds = (teams ?? []).map((t) => t.id);

  const { data: outcomes } =
    teamIds.length > 0
      ? await supabase.from("outcomes").select("*").in("team_id", teamIds)
      : { data: [] };

  const { data: decisions } =
    teamIds.length > 0
      ? await supabase.from("decisions").select("*").in("team_id", teamIds)
      : { data: [] };

  const { data: reflections } =
    teamIds.length > 0
      ? await supabase.from("reflections").select("*").in("team_id", teamIds)
      : { data: [] };

  return NextResponse.json({
    session,
    teams: teams ?? [],
    rounds: rounds ?? [],
    outcomes: outcomes ?? [],
    decisions: decisions ?? [],
    reflections: reflections ?? [],
  });
}
