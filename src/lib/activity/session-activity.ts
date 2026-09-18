import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Session-scoped activity feed (supabase/migration-v10-session-activity.sql).
 *
 * future-fixes.md "Notify teammates when someone leaves": rather than email,
 * both the self-serve leave route and the instructor roster-move route write
 * a row here, and the instructor session page reads it back as a "recent
 * activity" list. Mirrors the shape of writeAdminAudit in
 * src/lib/admin/audit.ts, including the "never break the primary action"
 * failure mode — a feed write failing should not fail the leave/move itself.
 */

export type SessionActivityEventType = "team.leave" | "team.roster_move";

export type SessionActivityEvent = {
  id: string;
  session_id: string;
  event_type: SessionActivityEventType;
  actor_id: string | null;
  subject_id: string | null;
  from_team_id: string | null;
  to_team_id: string | null;
  message: string;
  created_at: string;
};

export async function writeSessionActivity(opts: {
  sessionId: string;
  eventType: SessionActivityEventType;
  actorId: string | null;
  subjectId?: string | null;
  fromTeamId?: string | null;
  toTeamId?: string | null;
  message: string;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("session_activity").insert({
      session_id: opts.sessionId,
      event_type: opts.eventType,
      actor_id: opts.actorId,
      subject_id: opts.subjectId ?? null,
      from_team_id: opts.fromTeamId ?? null,
      to_team_id: opts.toTeamId ?? null,
      message: opts.message,
    });
  } catch {
    // The feed is informational; it must never break a leave or a move.
  }
}

/** Most recent activity for a session, newest first. */
export async function listSessionActivity(
  sessionId: string,
  limit = 20
): Promise<SessionActivityEvent[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("session_activity")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as SessionActivityEvent[];
  } catch {
    return [];
  }
}
