import { requireAuth } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  if (profile?.role !== "student") {
    return NextResponse.json(
      { error: "Only students can join teams" },
      { status: 403 }
    );
  }

  const { join_code } = await request.json();
  if (!join_code) {
    return NextResponse.json({ error: "join_code required" }, { status: 400 });
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*, sessions(id, name)")
    .eq("join_code", join_code.toLowerCase().trim())
    .single();

  if (teamError || !team) {
    return NextResponse.json({ error: "Invalid join code" }, { status: 404 });
  }

  const { data: myTeams } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user!.id);

  const teamIds = (myTeams ?? []).map((m) => m.team_id);
  let alreadyInSession = false;
  if (teamIds.length > 0) {
    const { data: theirTeams } = await supabase
      .from("teams")
      .select("session_id")
      .in("id", teamIds);
    alreadyInSession = (theirTeams ?? []).some(
      (t) => t.session_id === team.session_id
    );
  }

  if (alreadyInSession) {
    return NextResponse.json(
      { error: "You are already on a team in this session" },
      { status: 400 }
    );
  }

  const { error: joinError } = await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: user!.id,
  });

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 });
  }

  return NextResponse.json({ team });
}
