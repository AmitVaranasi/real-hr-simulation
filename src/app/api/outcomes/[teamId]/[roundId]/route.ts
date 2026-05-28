import { requireAuth } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string; roundId: string }> }
) {
  const { teamId, roundId } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  if (profile?.role === "student") {
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user!.id)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data: outcome, error: dbError } = await supabase
    .from("outcomes")
    .select("*")
    .eq("team_id", teamId)
    .eq("round_id", roundId)
    .maybeSingle();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  if (!outcome) {
    return NextResponse.json({ error: "No outcomes yet" }, { status: 404 });
  }

  return NextResponse.json({ outcome });
}
