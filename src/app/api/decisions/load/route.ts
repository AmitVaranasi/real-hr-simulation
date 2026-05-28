import { requireAuth } from "@/lib/api/auth";
import { priorStateFromIndustry } from "@/lib/engine/config";
import type { Industry } from "@/lib/engine/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const roundId = new URL(request.url).searchParams.get("round_id");
  if (!roundId) {
    return NextResponse.json({ error: "round_id required" }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(*)")
    .eq("user_id", user!.id)
    .single();

  const team = membership?.teams as unknown as {
    id: string;
    industry: Industry;
    headcount: number | null;
  } | null;

  if (!team) {
    return NextResponse.json({ error: "No team" }, { status: 404 });
  }

  const { data: decision } = await supabase
    .from("decisions")
    .select("*")
    .eq("team_id", team.id)
    .eq("round_id", roundId)
    .maybeSingle();

  if (!decision) {
    return NextResponse.json({ error: "No decision" }, { status: 404 });
  }

  const prior = priorStateFromIndustry(team.industry ?? "Manufacturing");

  return NextResponse.json({
    team_id: team.id,
    industry: team.industry,
    headcount: team.headcount ?? prior.headcount,
    decision,
  });
}
