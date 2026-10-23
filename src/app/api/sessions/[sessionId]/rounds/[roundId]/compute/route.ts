import { requireInstructor } from "@/lib/api/auth";
import { processRound } from "@/lib/db/process-round";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  {
    params,
  }: { params: Promise<{ sessionId: string; roundId: string }> }
) {
  const { sessionId, roundId } = await params;
  const { error } = await requireInstructor();
  if (error) return error;

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Admin client unavailable" },
      { status: 500 }
    );
  }

  const { data: round, error: roundError } = await admin
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .eq("session_id", sessionId)
    .single();

  if (roundError || !round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  try {
    const { results, skipped } = await processRound(admin, sessionId, round);
    return NextResponse.json({ computed: results.length, results, skipped });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Round processing failed" },
      { status: 500 }
    );
  }
}
