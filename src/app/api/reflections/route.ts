import { requireAuth } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { team_id, round_id, content } = await request.json();

  if (!team_id || !round_id || !content) {
    return NextResponse.json(
      { error: "team_id, round_id, and content required" },
      { status: 400 }
    );
  }

  if (content.length < 100 || content.length > 2000) {
    return NextResponse.json(
      { error: "Reflection must be 100–2000 characters" },
      { status: 400 }
    );
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", team_id)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not on this team" }, { status: 403 });
  }

  const { data, error: upsertError } = await supabase
    .from("reflections")
    .upsert(
      {
        team_id,
        round_id,
        content,
        submitted_by: user!.id,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "team_id,round_id" }
    )
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ reflection: data });
}

export async function GET(request: Request) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const teamId = new URL(request.url).searchParams.get("team_id");
  const roundId = new URL(request.url).searchParams.get("round_id");

  if (!teamId || !roundId) {
    return NextResponse.json(
      { error: "team_id and round_id required" },
      { status: 400 }
    );
  }

  const { data, error: dbError } = await supabase
    .from("reflections")
    .select("*")
    .eq("team_id", teamId)
    .eq("round_id", roundId)
    .maybeSingle();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ reflection: data });
}
