import { describe, expect, it } from "vitest";
import { buildCoachRequest, COACH_MODEL, COACH_MAX_TOKENS } from "@/lib/coach/prompt-builder";
import { COACH_SYSTEM_PROMPT } from "@/lib/coach/system-prompt";
import type { TeamCoachContext } from "@/lib/coach/grounding";

const context: TeamCoachContext = {
  team: { name: "Team A", industry: "High-Tech", strategy: "Innovation" },
  rounds: [
    {
      round_number: 1,
      decision: { training_budget_per_ee: 800 },
      outcome: { total_score: 70 },
      insights: null,
    },
  ],
};

describe("buildCoachRequest", () => {
  it("puts the stable system prompt first with cache_control, and never on volatile data", () => {
    const req = buildCoachRequest(context, [], "Why did my turnover rise?");
    expect(req.system).toHaveLength(1);
    expect(req.system[0].text).toBe(COACH_SYSTEM_PROMPT);
    expect(req.system[0].cache_control).toEqual({ type: "ephemeral" });
  });

  it("uses required cost-control settings", () => {
    const req = buildCoachRequest(context, [], "hi");
    expect(req.model).toBe(COACH_MODEL);
    expect(req.model).toBe("claude-opus-5");
    expect(req.max_tokens).toBe(COACH_MAX_TOKENS);
    expect(req.output_config).toEqual({ effort: "low" });
    expect(req.thinking).toEqual({ type: "adaptive" });
    // Must never include removed/invalid params.
    expect(req).not.toHaveProperty("temperature");
    expect(req).not.toHaveProperty("top_p");
    expect(req).not.toHaveProperty("top_k");
    expect((req.thinking as Record<string, unknown>)).not.toHaveProperty("budget_tokens");
  });

  it("embeds team context in the first user turn when history is empty", () => {
    const req = buildCoachRequest(context, [], "Why did my turnover rise?");
    expect(req.messages).toHaveLength(1);
    expect(req.messages[0].role).toBe("user");
    expect(req.messages[0].content).toContain("Team A");
    expect(req.messages[0].content).toContain("Why did my turnover rise?");
  });

  it("replays prior history and appends the new message without re-embedding context", () => {
    const history = [
      { role: "user" as const, content: "[Your team's data...] Team A ... first question" },
      { role: "assistant" as const, content: "What do you notice about your salary bands?" },
    ];
    const req = buildCoachRequest(context, history, "They're below market.");
    expect(req.messages).toHaveLength(3);
    expect(req.messages[2]).toEqual({ role: "user", content: "They're below market." });
  });
});
