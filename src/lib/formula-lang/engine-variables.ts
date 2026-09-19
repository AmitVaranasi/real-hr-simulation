/**
 * The whitelist of engine variables each catalog formula's expression editor
 * is allowed to reference, plus (where one exists) the `outcomes` table
 * column that already holds the engine's computed value for that formula —
 * used as the "current formula" side of the before/after preview.
 *
 * Kept deliberately small and explicit rather than exposing every outcomes
 * column to every formula: an instructor editing turnover shouldn't be
 * offered `stock_price` as a variable. `prior_<column>` variables give
 * access to the same metric one round earlier, which is how several of the
 * real formulas (see formula-catalog.ts) are documented to work.
 */

export interface EngineVariableSpec {
  /** Variables selectable in this formula's expression editor. */
  variables: readonly string[];
  /**
   * The `outcomes` column holding the engine's own computed value for this
   * formula, if one exists. Used to show "current" vs "edited" side by side
   * in the preview. Null when this formula doesn't map to a single stored
   * outcome column (e.g. budget allocation formulas).
   */
  outcomeColumn: string | null;
}

export const ENGINE_VARIABLES: Record<string, EngineVariableSpec> = {
  "discretionary-budget": {
    variables: ["base_budget", "economy_multiplier", "adjustments"],
    outcomeColumn: null,
  },
  "module-allocation": {
    variables: ["budget", "share"],
    outcomeColumn: null,
  },
  "turnover-rate": {
    variables: [
      "prior_turnover_rate",
      "employee_satisfaction",
      "compensation_ratio",
      "band_penalty",
    ],
    outcomeColumn: "turnover_rate",
  },
  "hiring-quality": {
    variables: ["cost_per_hire", "time_to_fill", "turnover_rate"],
    outcomeColumn: "cost_per_hire",
  },
  productivity: {
    variables: [
      "engagement_level",
      "training_effectiveness",
      "turnover_rate",
      "prior_engagement_level",
    ],
    outcomeColumn: "engagement_level",
  },
  "dei-score": {
    variables: ["turnover_rate", "review_coverage", "prior_dei_score"],
    outcomeColumn: "dei_score",
  },
  "training-roi": {
    variables: ["revenue", "profit", "training_effectiveness", "prior_training_roi"],
    outcomeColumn: "training_roi",
  },
  "revenue-cascade": {
    variables: ["prior_revenue", "market_share", "profit_margin"],
    outcomeColumn: "revenue",
  },
  profit: {
    variables: ["revenue", "total_budget_spent", "total_compensation"],
    outcomeColumn: "profit",
  },
  "stock-price": {
    variables: ["prior_stock_price", "profit", "market_share"],
    outcomeColumn: "stock_price",
  },
  "bsc-perspective": {
    variables: ["score_financial", "score_employee", "score_process", "score_learning"],
    outcomeColumn: "total_score",
  },
  "bsc-total": {
    variables: [
      "score_financial",
      "score_employee",
      "score_process",
      "score_learning",
      "strategy_bonus",
    ],
    outcomeColumn: "total_score",
  },
  "strategy-bonus": {
    variables: ["total_score", "industry_penalty"],
    outcomeColumn: "strategy_bonus",
  },
};

export function engineVariablesFor(formulaId: string): EngineVariableSpec | null {
  return ENGINE_VARIABLES[formulaId] ?? null;
}
