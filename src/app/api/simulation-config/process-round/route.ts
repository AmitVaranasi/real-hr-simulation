import { requireInstructorOrAdmin } from "@/lib/api/auth";
import { processRound } from "@/lib/db/process-round";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/** Manual round processing from Simulation Configuration Center (V3). */
export async function POST(request: Request) {
  const { error } = await requireInstructorOrAdmin();
  if (error) return error;

  const { sessionId, roundId } = await request.json();
  if (!sessionId || !roundId) {
    return NextResponse.json(
      { error: "sessionId and roundId required" },
      { status: 400 }
    );
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

  const { data: round } = await admin
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .eq("session_id", sessionId)
    .single();

  if (!round) {
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
