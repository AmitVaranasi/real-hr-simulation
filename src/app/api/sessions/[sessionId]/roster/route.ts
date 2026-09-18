import { requireInstructor } from "@/lib/api/auth";
import { writeAdminAudit } from "@/lib/admin/audit";
import { writeSessionActivity } from "@/lib/activity/session-activity";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  canMoveStudent,
  rosterMoveBlockedStatus,
} from "@/lib/instructor/roster-move";
import { NextResponse } from "next/server";

/**
 * Move a student from one team to another within the same session.
 *
 * future-fixes.md "Instructor-initiated removal of a student": this is the
 * override for the case src/lib/student/leave-team.ts deliberately refuses
 * — a team that has already submitted decisions. Unlike that self-serve
 * path there is no submission check here at all; an instructor may always
 * move a student. Writes the same audit shape the leave route writes, plus
 * a session_activity row so the move shows up on the session page.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const { studentId, fromTeamId, toTeamId } = await request.json();
  if (!studentId || !fromTeamId || !toTeamId) {
    return NextResponse.json(
      { error: "studentId, fromTeamId, and toTeamId are required" },
      { status: 400 }
    );
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("instructor_id", user!.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("session_id", sessionId)
    .in("id", [fromTeamId, toTeamId]);

  const fromTeam = teams?.find((t) => t.id === fromTeamId) ?? null;
  const toTeam = teams?.find((t) => t.id === toTeamId) ?? null;

  const { data: membership } = await supabase
    .from("team_members")
    .select("id, team_id")
    .eq("user_id", studentId)
    .eq("team_id", fromTeamId)
    .maybeSingle();

  const verdict = canMoveStudent({
    sourceTeamExists: Boolean(fromTeam),
    targetTeamExists: Boolean(toTeam),
    isMemberOfSourceTeam: Boolean(membership),
    sourceTeamId: fromTeamId,
    targetTeamId: toTeamId,
  });

  if (!verdict.allowed) {
    return NextResponse.json(
      { error: verdict.message, reason: verdict.reason },
      { status: rosterMoveBlockedStatus(verdict.reason) }
    );
  }

  // Service role: mirrors POST /api/teams/leave — RLS on team_members is
  // written for self-service by the row's own user, not for an instructor
  // acting on someone else's behalf.
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server is missing service role configuration" },
      { status: 500 }
    );
  }

  const { error: updateError } = await admin
    .from("team_members")
    .update({ team_id: toTeamId })
    .eq("id", membership!.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await writeAdminAudit({
    actorId: user!.id,
    action: "team.roster_move",
    targetType: "team_member",
    targetId: studentId,
    meta: {
      session_id: sessionId,
      from_team_id: fromTeamId,
      from_team_name: fromTeam?.name,
      to_team_id: toTeamId,
      to_team_name: toTeam?.name,
    },
  });

  await writeSessionActivity({
    sessionId,
    eventType: "team.roster_move",
    actorId: user!.id,
    subjectId: studentId,
    fromTeamId,
    toTeamId,
    message: `Instructor moved a student from ${fromTeam?.name ?? "a team"} to ${toTeam?.name ?? "a team"}.`,
  });

  return NextResponse.json({ moved: true, team_id: toTeamId });
}
