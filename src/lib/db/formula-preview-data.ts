import { createAdminClient } from "@/lib/supabase/admin";
import { engineVariablesFor } from "@/lib/formula-lang/engine-variables";
import type { PreviewRow } from "@/lib/formula-lang/preview";

/**
 * A minimal column set covering every column referenced anywhere in
 * ENGINE_VARIABLES (both bare and prior_-prefixed) plus the identifying
 * columns needed to build a row label and to look up the prior round.
 */
const OUTCOME_COLUMNS = [
  "id",
  "team_id",
  "round_id",
  "computed_at",
  "turnover_rate",
  "employee_satisfaction",
  "compensation_ratio",
  "cost_per_hire",
  "time_to_fill",
  "engagement_level",
  "training_effectiveness",
  "review_coverage",
  "dei_score",
  "revenue",
  "profit",
  "market_share",
  "profit_margin",
  "total_budget_spent",
  "total_compensation",
  "stock_price",
  "training_roi",
  "score_financial",
  "score_employee",
  "score_process",
  "score_learning",
  "total_score",
  "strategy_bonus",
  "industry_penalty",
] as const;

type OutcomeRow = Record<(typeof OUTCOME_COLUMNS)[number], number | string | null>;

/**
 * Fetch up to `limit` recent `outcomes` rows (most recent rounds first,
 * across all sessions — this is a global admin tool) and shape them into
 * PreviewRow objects for `formulaId` using its engine-variables whitelist.
 * Returns an empty list rather than throwing when the DB is unavailable or
 * the formula has no configured variables, since preview data is optional
 * context, not a blocking requirement.
 */
export async function fetchPreviewRows(
  formulaId: string,
  limit = 15
): Promise<PreviewRow[]> {
  const spec = engineVariablesFor(formulaId);
  if (!spec) return [];

  try {
    const admin = createAdminClient();
    const { data: outcomes } = await admin
      .from("outcomes")
      .select(OUTCOME_COLUMNS.join(", "))
      .order("computed_at", { ascending: false })
      .limit(limit);

    const rows = (outcomes ?? []) as unknown as OutcomeRow[];
    if (rows.length === 0) return [];

    const teamIds = Array.from(new Set(rows.map((r) => r.team_id as string)));
    const roundIds = Array.from(new Set(rows.map((r) => r.round_id as string)));

    const [{ data: teams }, { data: rounds }] = await Promise.all([
      admin.from("teams").select("id, name").in("id", teamIds),
      admin.from("rounds").select("id, round_number, session_id").in("id", roundIds),
    ]);
    const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name as string]));
    const roundById = new Map(
      (rounds ?? []).map((r) => [
        r.id,
        { number: r.round_number as number, sessionId: r.session_id as string },
      ])
    );

    // For prior_<col> variables, find the outcome row for the same team on
    // round_number - 1 within the same session.
    const priorNeeded = spec.variables.some((v) => v.startsWith("prior_"));
    let priorByTeamRound = new Map<string, OutcomeRow>();
    if (priorNeeded) {
      const { data: priorOutcomes } = await admin
        .from("outcomes")
        .select(OUTCOME_COLUMNS.join(", "))
        .in("team_id", teamIds);
      const priorRows = (priorOutcomes ?? []) as unknown as OutcomeRow[];
      priorByTeamRound = new Map(
        priorRows.map((r) => [`${r.team_id}:${roundById.get(r.round_id as string)?.number ?? -1}`, r])
      );
    }

    return rows.map((row) => {
      const roundInfo = roundById.get(row.round_id as string);
      const teamName = teamNameById.get(row.team_id as string) ?? "Unknown team";
      const label = `${teamName} — Round ${roundInfo?.number ?? "?"}`;

      const prior =
        roundInfo && priorNeeded
          ? priorByTeamRound.get(`${row.team_id}:${roundInfo.number - 1}`)
          : undefined;

      const variables: Record<string, number | null> = {};
      for (const name of spec.variables) {
        if (name.startsWith("prior_")) {
          const col = name.slice("prior_".length);
          const value = prior?.[col as keyof OutcomeRow];
          variables[name] = typeof value === "number" ? value : null;
        } else {
          const value = row[name as keyof OutcomeRow];
          variables[name] = typeof value === "number" ? value : null;
        }
      }

      const currentValue = spec.outcomeColumn
        ? ((row[spec.outcomeColumn as keyof OutcomeRow] as number | null) ?? null)
        : null;

      return { label, variables, currentValue };
    });
  } catch {
    return [];
  }
}
