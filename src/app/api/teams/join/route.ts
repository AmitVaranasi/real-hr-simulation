import { requireAuth } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Join a team by code.
 * One active team at a time: joining another session switches the student.
 */
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
    .eq("join_code", String(join_code).toLowerCase().trim())
    .single();

  if (teamError || !team) {
    return NextResponse.json({ error: "Invalid join code" }, { status: 404 });
  }

  const { data: myMemberships } = await supabase
    .from("team_members")
    .select("id, team_id, teams(id, session_id, name)")
    .eq("user_id", user!.id);

  const memberships = myMemberships ?? [];
  if (memberships.some((m) => m.team_id === team.id)) {
    return NextResponse.json(
      { error: "You are already on this team" },
      { status: 400 }
    );
  }

  const sameSession = memberships.some((m) => {
    const t = m.teams as unknown as { session_id: string } | null;
    return t?.session_id === team.session_id;
  });
  if (sameSession) {
    return NextResponse.json(
      { error: "You are already on a team in this session" },
      { status: 400 }
    );
  }

  const switched = memberships.length > 0;

  // Service role: students have INSERT but not DELETE on team_members under RLS.
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server is missing service role configuration" },
      { status: 500 }
    );
  }

  if (switched) {
    const { error: leaveError } = await admin
      .from("team_members")
      .delete()
      .eq("user_id", user!.id);
    if (leaveError) {
      return NextResponse.json({ error: leaveError.message }, { status: 500 });
    }
  }

  const { error: joinError } = await admin.from("team_members").insert({
    team_id: team.id,
    user_id: user!.id,
  });

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 });
  }

  return NextResponse.json({ team, switched });
}
