import { requireAuth } from "@/lib/api/auth";
import { writeAdminAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  leaveBlockedStatus,
  leaveEligibility,
} from "@/lib/student/leave-team";
import { NextResponse } from "next/server";

/**
 * Leave the current team.
 *
 * Rules live in docs/leave-team-policy.md. Removes the team_members row and
 * nothing else — decisions and reflections stay with the team.
 */
export async function POST() {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  if (profile?.role !== "student") {
    return NextResponse.json(
      { error: "Only students can leave teams" },
      { status: 403 }
    );
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("id, team_id, teams(id, name, session_id)")
    .eq("user_id", user!.id)
    .maybeSingle();

  const team =
    (membership?.teams as unknown as {
      id: string;
      name: string;
      session_id: string;
    } | null) ?? null;

  // A team belongs to exactly one session, so counting by team_id already
  // scopes this to "submitted in this session".
  let submittedDecisionCount = 0;
  if (team) {
    const { count } = await supabase
      .from("decisions")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team.id)
      .eq("is_submitted", true);
    submittedDecisionCount = count ?? 0;
  }

  const verdict = leaveEligibility({
    hasTeam: Boolean(membership && team),
    submittedDecisionCount,
  });

  if (!verdict.allowed) {
    return NextResponse.json(
      { error: verdict.message, reason: verdict.reason },
      { status: leaveBlockedStatus(verdict.reason) }
    );
  }

  // Service role: the v7 DELETE policy may not be applied on every
  // environment, and the join route already switches teams this way.
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server is missing service role configuration" },
      { status: 500 }
    );
  }

  const { error: deleteError } = await admin
    .from("team_members")
    .delete()
    .eq("id", membership!.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await writeAdminAudit({
    actorId: user!.id,
    action: "team.leave",
    targetType: "team",
    targetId: team!.id,
    meta: { team_name: team!.name, session_id: team!.session_id },
  });

  return NextResponse.json({ left: true, team_id: team!.id });
}
