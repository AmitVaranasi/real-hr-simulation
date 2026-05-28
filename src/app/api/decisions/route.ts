import { requireAuth } from "@/lib/api/auth";
import { decisionToRow, rowToDecision } from "@/lib/db/decisions";
import { validateDecision } from "@/lib/engine/validation";
import type { Decision } from "@/lib/engine/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { team_id, round_id, is_submitted, ...fields } = body as Decision & {
    team_id: string;
    round_id: string;
  };

  if (!team_id || !round_id) {
    return NextResponse.json(
      { error: "team_id and round_id required" },
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

  const { data: round } = await supabase
    .from("rounds")
    .select("status")
    .eq("id", round_id)
    .single();

  if (round?.status !== "open") {
    return NextResponse.json(
      { error: "Round is not open for decisions" },
      { status: 400 }
    );
  }

  const decision = { ...fields, is_submitted } as Decision;
  const validation = validateDecision(decision);
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const row = decisionToRow(
    { ...decision, is_submitted: Boolean(is_submitted) },
    team_id,
    round_id,
    user!.id
  );

  const { data, error: upsertError } = await supabase
    .from("decisions")
    .upsert(row, { onConflict: "team_id,round_id" })
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ decision: rowToDecision(data) });
}
