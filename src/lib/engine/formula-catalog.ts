/**
 * Formula Repository catalog — human-readable engine formulas.
 * Parameter edits go through simulation_config overrides; expression_override
 * notes are documentation for admins (not a live AST interpreter).
 */

export type FormulaCatalogEntry = {
  id: string;
  category:
    | "Budget"
    | "HR Metrics"
    | "Financials"
    | "BSC Scoring"
    | "Strategy";
  name: string;
  expression: string;
  description: string;
  sourceFile: string;
  /** Dot-paths under SimulationConfigDocument.overrides admins can tune */
  configKeys: string[];
};

export const FORMULA_CATALOG: FormulaCatalogEntry[] = [
  {
    id: "discretionary-budget",
    category: "Budget",
    name: "Discretionary HR budget",
    expression: "base_budget + economy_multiplier[economy] × adjustments",
    description:
      "Round discretionary spend envelope before module allocations.",
    sourceFile: "budget.ts / simulation-config.ts",
    configKeys: ["discretionary_budget", "economy_multipliers"],
  },
  {
    id: "module-allocation",
    category: "Budget",
    name: "Module spend shares",
    expression: "module_spend = budget × share[module] (sum shares ≤ 100%)",
    description:
      "Recruitment, performance, training, relations, and compensation shares.",
    sourceFile: "budget-shares.ts",
    configKeys: [],
  },
  {
    id: "turnover-rate",
    category: "HR Metrics",
    name: "Turnover rate",
    expression:
      "clamp(prior.turnover + band_penalty + (satisfaction − 65) × −0.05, …)",
    description:
      "Industry-adjusted turnover driven by satisfaction and compensation bands.",
    sourceFile: "metrics.ts",
    configKeys: ["industry_norms", "industries"],
  },
  {
    id: "hiring-quality",
    category: "HR Metrics",
    name: "Hiring quality",
    expression:
      "f(recruitment_spend, screening, retention_probability = 100 − 2×turnover)",
    description: "Quality of new hires from recruitment investment.",
    sourceFile: "metrics.ts",
    configKeys: ["benchmarks"],
  },
  {
    id: "productivity",
    category: "HR Metrics",
    name: "Productivity",
    expression:
      "blend(performance_criteria, training, engagement, industry_norm)",
    description: "Workforce productivity feeding revenue cascade.",
    sourceFile: "metrics.ts",
    configKeys: ["industry_norms", "benchmarks"],
  },
  {
    id: "dei-score",
    category: "HR Metrics",
    name: "DEI score",
    expression: "f(turnover_by_role variance, ER programs, hiring mix)",
    description: "Diversity / equity / inclusion composite.",
    sourceFile: "metrics.ts",
    configKeys: ["benchmarks"],
  },
  {
    id: "training-roi",
    category: "HR Metrics",
    name: "Training ROI",
    expression:
      "((prior.revenue × productivity × 0.02 − training_cost) / training_cost) × 100",
    description: "Return on training spend vs productivity lift.",
    sourceFile: "metrics.ts",
    configKeys: ["discretionary_budget"],
  },
  {
    id: "revenue-cascade",
    category: "Financials",
    name: "Revenue cascade",
    expression:
      "prior.revenue × (1 + productivity_effect) × economy × industry_factor",
    description: "Financial cascade from HR metrics into revenue.",
    sourceFile: "financials.ts",
    configKeys: ["economy_multipliers", "industries"],
  },
  {
    id: "profit",
    category: "Financials",
    name: "Profit",
    expression: "revenue − operating_costs − hr_spend − turnover_cost",
    description: "Round profit after HR and turnover costs.",
    sourceFile: "financials.ts",
    configKeys: [],
  },
  {
    id: "stock-price",
    category: "Financials",
    name: "Stock price",
    expression: "prior.stock × f(profit_delta, market_share, strategy)",
    description: "Market valuation update for the round.",
    sourceFile: "financials.ts",
    configKeys: ["strategies"],
  },
  {
    id: "bsc-perspective",
    category: "BSC Scoring",
    name: "Perspective score (0–25)",
    expression:
      "Σ metricToScore(value, excellent/moderate/poor) × weight  → capped 25",
    description:
      "Learning, Internal, Customer, Financial perspectives.",
    sourceFile: "scoring.ts / benchmarks.ts",
    configKeys: ["benchmarks", "strategies"],
  },
  {
    id: "bsc-total",
    category: "BSC Scoring",
    name: "Total BSC (100)",
    expression:
      "sum(perspectives) + strategy_bonus  → clamp 0–100",
    description: "Final Balanced Scorecard used for leaderboards.",
    sourceFile: "scoring.ts",
    configKeys: ["strategies", "benchmarks"],
  },
  {
    id: "strategy-bonus",
    category: "Strategy",
    name: "Strategy alignment bonus",
    expression:
      "bonus when metrics match strategy.bsc_weights / focus rules",
    description:
      "Extra points when HR outcomes align with chosen strategy.",
    sourceFile: "scoring.ts",
    configKeys: ["strategies"],
  },
];

export function formulaById(id: string) {
  return FORMULA_CATALOG.find((f) => f.id === id) ?? null;
}
