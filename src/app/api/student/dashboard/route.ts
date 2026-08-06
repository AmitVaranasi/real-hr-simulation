import { requireAuth } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  if (profile?.role === "instructor" || profile?.role === "admin") {
    return NextResponse.json({ error: "Students only" }, { status: 403 });
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select(
      "team_id, teams(id, name, industry, strategy, session_id, sessions(name, course_code, semester))"
    )
    .eq("user_id", user!.id)
    .maybeSingle();

  const team = membership?.teams as unknown as {
    id: string;
    name: string;
    industry: string | null;
    strategy: string | null;
    session_id: string;
    sessions: {
      name: string;
      course_code: string | null;
      semester: string | null;
    };
  } | null;

  if (!team) {
    return NextResponse.json({
      hasTeam: false,
      openRound: null,
      decision: null,
      simulation: null,
    });
  }

  const { data: openRound } = await supabase
    .from("rounds")
    .select("id, round_number, round_type, status, economy_condition")
    .eq("session_id", team.session_id)
    .eq("status", "open")
    .maybeSingle();

  let decision: { exists: boolean; is_submitted: boolean } | null = null;
  if (openRound) {
    const { data: row } = await supabase
      .from("decisions")
      .select("is_submitted")
      .eq("team_id", team.id)
      .eq("round_id", openRound.id)
      .maybeSingle();
    decision = row
      ? { exists: true, is_submitted: !!row.is_submitted }
      : { exists: false, is_submitted: false };
  }

  const course = [
    team.sessions?.name,
    team.sessions?.course_code,
    team.sessions?.semester,
  ]
    .filter(Boolean)
    .join(" · ");

  const roundLabel = openRound
    ? `Round ${openRound.round_number} — ${openRound.status.toUpperCase()}`
    : "Not Open — Waiting for Instructor";

  return NextResponse.json({
    hasTeam: true,
    openRound: openRound ?? null,
    decision,
    simulation: {
      company: team.name,
      course: course || team.sessions?.name || "—",
      industry: team.industry ?? "—",
      strategy: team.strategy ?? "—",
      roundLabel,
      roundNumber: openRound?.round_number ?? null,
      roundStatus: openRound ? "Open" : "Waiting",
      economy: openRound?.economy_condition ?? null,
    },
  });
}
