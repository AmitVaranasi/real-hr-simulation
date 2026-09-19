/**
 * Builds the request payload for the Anthropic Messages API call.
 *
 * Kept separate from the route so it's a pure, unit-testable function: given
 * a team context and chat history, it returns the exact object handed to
 * `client.messages.stream(...)`, with no I/O of its own.
 *
 * Model/cost choices (see also the migration/rate-limit modules for the
 * rest of the cost-control story):
 *  - model: claude-opus-5 — the only model id these facts specify.
 *  - output_config.effort: "low" — this is a short, focused Socratic coach
 *    reply, not a task requiring deep multi-step reasoning; "low" keeps
 *    per-message cost down for a free-to-students, cost-sensitive feature.
 *  - max_tokens: 700 — replies are meant to be a few sentences plus at most
 *    a couple of follow-up questions (per the system prompt), so this caps
 *    runaway generation without truncating a normal reply.
 *  - thinking: adaptive — lets the model allocate a little extra reasoning
 *    only when a question genuinely needs it, without a fixed token budget
 *    (budget_tokens is not a valid parameter on this model).
 */

import { COACH_SYSTEM_PROMPT } from "@/lib/coach/system-prompt";
import { renderTeamCoachContext, type TeamCoachContext } from "@/lib/coach/grounding";

export interface CoachChatTurn {
  role: "user" | "assistant";
  content: string;
}

export const COACH_MODEL = "claude-opus-5";
export const COACH_EFFORT = "low" as const;
export const COACH_MAX_TOKENS = 700;

export interface CoachRequestParams {
  model: string;
  max_tokens: number;
  system: Array<{
    type: "text";
    text: string;
    cache_control?: { type: "ephemeral" };
  }>;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  thinking: { type: "adaptive" };
  output_config: { effort: typeof COACH_EFFORT };
}

/**
 * `context` (per-team data) is rendered into the FIRST user message, after
 * the cached system prompt — never into the system prompt itself — because
 * prompt caching is a prefix match: anything that varies per request (team
 * data, and here also prior chat turns) must come after the stable cached
 * block or the cache never hits.
 */
export function buildCoachRequest(
  context: TeamCoachContext,
  history: CoachChatTurn[],
  latestUserMessage: string
): CoachRequestParams {
  const contextBlock = renderTeamCoachContext(context);

  const messages: CoachRequestParams["messages"] = [];

  if (history.length === 0) {
    // First turn of the conversation: prepend the team context to the
    // student's own message so it's grounded from the start.
    messages.push({
      role: "user",
      content: `[Your team's data for context — do not repeat this block back verbatim]\n${contextBlock}\n\n[Student message]\n${latestUserMessage}`,
    });
  } else {
    // Later turns: context was already established in the first message,
    // just replay history and append the new message.
    for (const turn of history) {
      messages.push({ role: turn.role, content: turn.content });
    }
    messages.push({ role: "user", content: latestUserMessage });
  }

  return {
    model: COACH_MODEL,
    max_tokens: COACH_MAX_TOKENS,
    system: [
      {
        type: "text",
        text: COACH_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
    thinking: { type: "adaptive" },
    output_config: { effort: COACH_EFFORT },
  };
}
