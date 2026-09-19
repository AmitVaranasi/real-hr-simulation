import { requireAuth } from "@/lib/api/auth";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildTeamCoachContext,
  type CoachDecisionRow,
  type CoachOutcomeRow,
} from "@/lib/coach/grounding";
import { buildCoachRequest, type CoachChatTurn } from "@/lib/coach/prompt-builder";
import { checkDailyCap, utcDayStart } from "@/lib/coach/rate-limit";

/**
 * POST /api/coach — streaming AI coach reply, students only.
 *
 * Data-loading order matters for the grounding guarantee: every Supabase
 * query below is scoped with `.eq("team_id", team.id)` where `team.id` came
 * from the caller's OWN team-membership row, so no other team's rows are
 * ever fetched, let alone leaked into the model context. The redaction
 * layer in `@/lib/coach/grounding` re-filters on top of that as a second
 * line of defense.
 */
export async function POST(request: Request) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  if (profile?.role !== "student") {
    return NextResponse.json({ error: "Students only" }, { status: 403 });
  }

  let body: {
    team_id?: string;
    round_id?: string;
    message?: string;
    history?: CoachChatTurn[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { team_id: teamId, round_id: roundId, message, history = [] } = body;

  if (!teamId || !message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { error: "team_id and message are required" },
      { status: 400 }
    );
  }
  if (message.length > 4000) {
    return NextResponse.json(
      { error: "Message too long (4000 character max)" },
      { status: 400 }
    );
  }

  // Verify the caller is actually on this team before loading anything.
  const { data: membership } = await supabase
    .from("team_members")
    .select("id, teams(id, name, industry, strategy)")
    .eq("team_id", teamId)
    .eq("user_id", user!.id)
    .maybeSingle();

  const team = membership?.teams as unknown as {
    id: string;
    name: string;
    industry: string | null;
    strategy: string | null;
  } | null;

  if (!team) {
    return NextResponse.json({ error: "Not on this team" }, { status: 403 });
  }

  // Server-side daily cap: count today's user messages from this student,
  // never trust a client-supplied count.
  const { count: usedToday } = await supabase
    .from("coach_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("role", "user")
    .gte("created_at", utcDayStart(new Date()));

  const cap = checkDailyCap(usedToday ?? 0);
  if (!cap.allowed) {
    return NextResponse.json(
      {
        error: `Daily coach message limit reached (${cap.limit}/day). Try again tomorrow.`,
        cap,
      },
      { status: 429 }
    );
  }

  // Load this team's own decisions/outcomes only.
  const [{ data: decisionRows }, { data: outcomeRows }] = await Promise.all([
    supabase
      .from("decisions")
      .select("team_id, round_id, rounds(round_number), *")
      .eq("team_id", team.id),
    supabase
      .from("outcomes")
      .select("team_id, round_id, rounds(round_number), *")
      .eq("team_id", team.id),
  ]);

  const withRoundNumber = <T extends { rounds?: { round_number?: number } | null }>(
    rows: T[] | null
  ) =>
    (rows ?? []).map((row) => ({
      ...row,
      round_number: row.rounds?.round_number,
    }));

  const context = buildTeamCoachContext(
    team,
    team.id,
    withRoundNumber(decisionRows) as unknown as CoachDecisionRow[],
    withRoundNumber(outcomeRows) as unknown as CoachOutcomeRow[]
  );

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI coach is not configured in this environment (missing ANTHROPIC_API_KEY).",
      },
      { status: 503 }
    );
  }

  const client = new Anthropic();
  const requestParams = buildCoachRequest(context, history, message);

  // Persist the student's message immediately so the daily cap is accurate
  // even if the model call subsequently fails.
  await supabase.from("coach_messages").insert({
    team_id: team.id,
    round_id: roundId ?? null,
    user_id: user!.id,
    role: "user",
    content: message,
  });

  const encoder = new TextEncoder();
  let assistantText = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream(requestParams);

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            assistantText += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await anthropicStream.finalMessage();

        if (final.stop_reason === "refusal") {
          const refusalNote =
            "\n\n[The coach declined to answer that — try rephrasing, or ask about your own results instead.]";
          assistantText += refusalNote;
          controller.enqueue(encoder.encode(refusalNote));
        }

        await supabase.from("coach_messages").insert({
          team_id: team.id,
          round_id: roundId ?? null,
          user_id: user!.id,
          role: "assistant",
          content: assistantText,
          input_tokens: final.usage?.input_tokens ?? null,
          output_tokens: final.usage?.output_tokens ?? null,
          cache_read_input_tokens: final.usage?.cache_read_input_tokens ?? null,
          stop_reason: final.stop_reason,
        });
      } catch (err) {
        let message = "The coach is temporarily unavailable. Please try again.";
        if (err instanceof Anthropic.RateLimitError) {
          message = "The coach is receiving too many requests right now. Please try again shortly.";
        } else if (err instanceof Anthropic.APIError) {
          message = "The coach hit an error talking to the model. Please try again.";
        }
        controller.enqueue(encoder.encode(`\n\n[${message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
