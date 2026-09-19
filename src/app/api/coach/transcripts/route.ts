import { requireInstructor } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/coach/transcripts?team_id=... — instructor visibility into a
 * team's AI coach exchanges. Instructors grade these students on the
 * decisions the coach was consulted on, so every coach_messages row for a
 * team in a session the instructor owns is readable here. Uses the admin
 * client (service role) after an explicit ownership check, mirroring the
 * pattern in the existing session-inspect route, rather than relying only
 * on RLS.
 */
export async function GET(request: Request) {
  const { error, user } = await requireInstructor();
  if (error) return error;

  const teamId = new URL(request.url).searchParams.get("team_id");
  if (!teamId) {
    return NextResponse.json({ error: "team_id required" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Admin client unavailable" },
      { status: 500 }
    );
  }

  const { data: team } = await admin
    .from("teams")
    .select("id, name, session_id, sessions(instructor_id)")
    .eq("id", teamId)
    .single();

  const session = team?.sessions as unknown as { instructor_id: string } | null;
  if (!team || !session || session.instructor_id !== user!.id) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const { data: messages, error: dbError } = await admin
    .from("coach_messages")
    .select(
      "id, round_id, user_id, role, content, input_tokens, output_tokens, cache_read_input_tokens, stop_reason, created_at, profiles(display_name)"
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const totalInputTokens = (messages ?? []).reduce(
    (sum, m) => sum + (m.input_tokens ?? 0),
    0
  );
  const totalOutputTokens = (messages ?? []).reduce(
    (sum, m) => sum + (m.output_tokens ?? 0),
    0
  );

  return NextResponse.json({
    team: { id: team.id, name: team.name },
    messages: messages ?? [],
    usage: { totalInputTokens, totalOutputTokens },
  });
}
