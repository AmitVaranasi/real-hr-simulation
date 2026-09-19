import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { findPlatformById } from "@/lib/lti/platform-registry";
import { findOrCreateLineItem, postScore } from "@/lib/lti/ags";
import { buildLeaderboard } from "@/lib/leaderboard";

/**
 * Instructor-triggered AGS grade passback for one session: for every Canvas
 * resource-link placement pointing at this session, posts each team's
 * current score to every launched team member's gradebook cell. Score is
 * the same total_score the in-app leaderboard uses (instructor override
 * takes precedence, matching what students already see), out of 100.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("instructor_id", user!.id)
    .single();
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const admin = createAdminClient();

  const { data: resourceLinks } = await admin
    .from("lti_resource_links")
    .select("*")
    .eq("session_id", sessionId);
  if (!resourceLinks || resourceLinks.length === 0) {
    return NextResponse.json({ posted: 0, skipped: 0, errors: [] });
  }

  const { data: teams } = await supabase.from("teams").select("*").eq("session_id", sessionId);
  const { data: outcomes } = await supabase
    .from("outcomes")
    .select("*")
    .in("team_id", (teams ?? []).map((t) => t.id));
  const leaderboard = buildLeaderboard(teams ?? [], outcomes ?? []);
  const scoreByTeam = new Map(leaderboard.map((e) => [e.team_id, e.latest_score]));

  let posted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const link of resourceLinks) {
    const platform = await findPlatformById(link.platform_id);
    if (!platform) {
      errors.push(`Platform ${link.platform_id} for resource link ${link.id} not found`);
      continue;
    }
    if (!link.ags_lineitems_url) {
      errors.push(
        `Resource link ${link.id} has no AGS lineitems URL (grades scope may not be granted)`
      );
      continue;
    }

    for (const team of teams ?? []) {
      const score = scoreByTeam.get(team.id);
      if (score == null) {
        skipped += 1;
        continue;
      }

      const { data: members } = await admin
        .from("team_members")
        .select("user_id")
        .eq("team_id", team.id);

      for (const member of members ?? []) {
        const { data: identity } = await admin
          .from("lti_identities")
          .select("lti_sub")
          .eq("platform_id", platform.id)
          .eq("profile_id", member.user_id)
          .maybeSingle();
        if (!identity) {
          // This student never launched via LTI for this platform — nothing
          // to post to.
          skipped += 1;
          continue;
        }

        try {
          const lineitemUrl = await findOrCreateLineItem({
            platform,
            lineitemsUrl: link.ags_lineitems_url,
            resourceLinkRowId: link.id,
            resourceLinkId: link.resource_link_id,
            teamId: team.id,
            label: team.name,
            scoreMaximum: 100,
          });
          await postScore({
            platform,
            lineitemUrl,
            userId: identity.lti_sub,
            scoreGiven: score,
            scoreMaximum: 100,
          });
          posted += 1;
        } catch (e) {
          errors.push(
            `Failed to post score for team ${team.id}, user ${identity.lti_sub}: ${
              e instanceof Error ? e.message : String(e)
            }`
          );
        }
      }
    }
  }

  return NextResponse.json({ posted, skipped, errors });
}
