/**
 * Grounding / redaction layer for the AI coach.
 *
 * The coach must see only the requesting student's OWN team's decisions,
 * outcomes, and explainability notes — never another team's data, the
 * leaderboard, or the scoring formula's internal weights. That boundary is
 * enforced HERE, in the data-loading layer, not by asking the model
 * politely in the prompt: every function below takes rows that may
 * (defensively) contain more than one team and filters/asserts down to
 * exactly the caller's team before anything is allowed into the LLM
 * context. If a caller ever passes rows for a team other than
 * `allowedTeamId`, those rows are dropped rather than raised as ambiguous
 * — a coach context silently missing a row is safe; one that leaks a row
 * is not.
 */

import type { LearningInsights } from "@/lib/engine/explainability";

export interface CoachDecisionRow {
  team_id: string;
  round_id: string;
  round_number?: number;
  [key: string]: unknown;
}

export interface CoachOutcomeRow {
  team_id: string;
  round_id: string;
  round_number?: number;
  total_score?: number | null;
  score_financial?: number | null;
  score_employee?: number | null;
  score_process?: number | null;
  score_learning?: number | null;
  revenue?: number | null;
  profit?: number | null;
  turnover_rate?: number | null;
  employee_satisfaction?: number | null;
  engagement_level?: number | null;
  training_roi?: number | null;
  budget_adherence?: number | null;
  feedback_json?: { insights?: LearningInsights } | null;
  [key: string]: unknown;
}

/** Fields an outcome row may carry into the coach's context. Everything
 * else on the row (e.g. any future instructor-only or cross-team field) is
 * dropped even if present, so a schema change elsewhere can't silently
 * widen what the coach sees. */
const ALLOWED_OUTCOME_FIELDS = [
  "round_number",
  "total_score",
  "score_financial",
  "score_employee",
  "score_process",
  "score_learning",
  "revenue",
  "profit",
  "profit_margin",
  "market_share",
  "stock_price",
  "headcount",
  "turnover_rate",
  "employee_satisfaction",
  "engagement_level",
  "training_roi",
  "dei_score",
  "budget_adherence",
  "compensation_ratio",
] as const;

/** Decision fields the coach may see — the student's own inputs, never a
 * "correct answer" annotation (there is none stored, but this allowlist
 * guards against one being added later without a coach review). */
const ALLOWED_DECISION_FIELDS = [
  "round_number",
  "recruitment_budget_per_hire",
  "positions_to_fill",
  "screening_rigor",
  "diversity_goal_pct",
  "onboarding_investment",
  "review_frequency",
  "performance_pay_pct",
  "training_budget_per_ee",
  "pct_employees_trained",
  "training_focus",
  "succession_investment",
  "engagement_investment",
  "conflict_budget",
  "flexibility_level",
  "voice_mechanisms",
  "salary_vs_market_pct",
  "benefits_per_ee",
  "bonus_pool_pct",
  "hr_tech_level",
] as const;

function pickAllowed<T extends Record<string, unknown>>(
  row: T,
  fields: readonly string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of fields) {
    if (key in row && row[key] !== undefined && row[key] !== null) {
      out[key] = row[key];
    }
  }
  return out;
}

/**
 * Filters a set of rows down to only those belonging to `allowedTeamId`.
 * This is the core boundary: any row for a different team is dropped, not
 * merely deprioritized.
 */
export function filterOwnTeamRows<T extends { team_id: string }>(
  rows: T[],
  allowedTeamId: string
): T[] {
  return rows.filter((row) => row.team_id === allowedTeamId);
}

export interface TeamCoachContext {
  team: {
    name: string;
    industry: string | null;
    strategy: string | null;
  };
  rounds: Array<{
    round_number: number | undefined;
    decision: Record<string, unknown> | null;
    outcome: Record<string, unknown> | null;
    insights: LearningInsights | null;
  }>;
}

/**
 * Builds the redacted, per-team context handed to the coach. `decisionRows`
 * and `outcomeRows` are expected to already be scoped to one team by the
 * caller's Supabase query (`.eq("team_id", teamId)`), but this function
 * re-filters them anyway (belt-and-suspenders) and only copies allowlisted
 * fields onto the result — nothing outside `ALLOWED_*_FIELDS` above can
 * reach the model, even if the input rows carry extra columns.
 */
export function buildTeamCoachContext(
  team: { name: string; industry: string | null; strategy: string | null },
  allowedTeamId: string,
  decisionRows: CoachDecisionRow[],
  outcomeRows: CoachOutcomeRow[]
): TeamCoachContext {
  const decisions = filterOwnTeamRows(decisionRows, allowedTeamId);
  const outcomes = filterOwnTeamRows(outcomeRows, allowedTeamId);

  const roundNumbers = new Set<number>();
  for (const d of decisions) if (d.round_number != null) roundNumbers.add(d.round_number);
  for (const o of outcomes) if (o.round_number != null) roundNumbers.add(o.round_number);

  const rounds = Array.from(roundNumbers)
    .sort((a, b) => a - b)
    .map((roundNumber) => {
      const decision = decisions.find((d) => d.round_number === roundNumber) ?? null;
      const outcome = outcomes.find((o) => o.round_number === roundNumber) ?? null;
      const insights = outcome?.feedback_json?.insights ?? null;
      return {
        round_number: roundNumber,
        decision: decision ? pickAllowed(decision, ALLOWED_DECISION_FIELDS) : null,
        outcome: outcome ? pickAllowed(outcome, ALLOWED_OUTCOME_FIELDS) : null,
        insights,
      };
    });

  return {
    team: { name: team.name, industry: team.industry, strategy: team.strategy },
    rounds,
  };
}

/**
 * Renders the redacted context as plain text for the user turn (placed
 * AFTER the cached system prompt, since this is the volatile per-request
 * part of the prompt).
 */
export function renderTeamCoachContext(ctx: TeamCoachContext): string {
  const lines: string[] = [];
  lines.push(
    `Team: ${ctx.team.name} | Industry: ${ctx.team.industry ?? "unset"} | Strategy: ${ctx.team.strategy ?? "unset"}`
  );
  if (ctx.rounds.length === 0) {
    lines.push("No submitted rounds yet for this team.");
    return lines.join("\n");
  }
  for (const r of ctx.rounds) {
    lines.push(`\n--- Round ${r.round_number} ---`);
    if (r.decision) {
      lines.push(`Decisions: ${JSON.stringify(r.decision)}`);
    }
    if (r.outcome) {
      lines.push(`Outcome metrics: ${JSON.stringify(r.outcome)}`);
    }
    if (r.insights) {
      if (r.insights.went_well?.length) {
        lines.push(`Went well: ${r.insights.went_well.join("; ")}`);
      }
      if (r.insights.hurt_performance?.length) {
        lines.push(`Hurt performance: ${r.insights.hurt_performance.join("; ")}`);
      }
      if (r.insights.causal_factors?.length) {
        lines.push(`Causal factors: ${r.insights.causal_factors.join("; ")}`);
      }
    }
  }
  return lines.join("\n");
}
