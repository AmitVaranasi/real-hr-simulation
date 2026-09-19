import { requireAuth } from "@/lib/api/auth";
import { decisionToRow, rowToDecision } from "@/lib/db/decisions";
import { validateDecision } from "@/lib/engine/validation";
import type { Decision } from "@/lib/engine/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { team_id, round_id, is_submitted, version, ...fields } =
    body as Decision & {
      team_id: string;
      round_id: string;
      /**
       * Version the client loaded from, for optimistic concurrency.
       * undefined/null means "I loaded before any row existed" — a
       * first-time save. See supabase/migration-v11-decision-version.sql.
       */
      version?: number | null;
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

  // Optimistic-concurrency check: look up whatever row currently exists for
  // this team/round and compare its version against what the client says it
  // loaded from. A never-saved row is null-safe as version 0, so a genuine
  // first save (version undefined/null) still proceeds normally.
  const { data: existing } = await supabase
    .from("decisions")
    .select("*")
    .eq("team_id", team_id)
    .eq("round_id", round_id)
    .maybeSingle();

  const currentVersion = (existing?.version as number | undefined) ?? 0;
  const clientVersion = version ?? 0;

  if (existing && currentVersion !== clientVersion) {
    return NextResponse.json(
      {
        error: "conflict",
        serverDecision: rowToDecision(existing as Record<string, unknown>),
        serverVersion: currentVersion,
      },
      { status: 409 }
    );
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

  return NextResponse.json({
    decision: { ...rowToDecision(data), version: data?.version as number | undefined },
  });
}
