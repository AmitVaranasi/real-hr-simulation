import type { Decision } from "./types";

export const DISCRETIONARY_BUDGET = 500_000;
export const BASELINE_BENEFITS = 3000;

/**
 * Starting decisions tuned to fit the $500K discretionary budget for typical
 * industry headcount/salary (bonus pool scales with headcount × market salary).
 */
export function createDefaultDecision(
  overrides: Partial<Decision> = {}
): Decision {
  return {
    recruitment_budget_per_hire: 4500,
    positions_to_fill: 5,
    screening_rigor: 2,
    diversity_goal_pct: 10,
    onboarding_investment: 500,

    review_frequency: 2,
    performance_pay_pct: 5,
    kpi_investment: 5000,
    feedback_360: false,
    pip_investment: 3000,

    training_budget_per_ee: 700,
    pct_employees_trained: 35,
    training_focus: "Technical",
    succession_investment: 5000,

    engagement_investment: 5000,
    conflict_budget: 5000,
    flexibility_level: 1,
    voice_mechanisms: 1,

    salary_vs_market_pct: 100,
    benefits_per_ee: 3000,
    // Full bonus $ = bonus_pool_pct% × marketSalary × headcount (counts against $500K)
    bonus_pool_pct: 0.5,
    equity_level: 0,

    span_of_control: 8,
    restructuring_investment: 0,
    change_comm_effort: 3,
    hr_tech_level: 0,

    dei_training_per_ee: 100,
    inclusive_hiring_investment: 3000,
    erg_budget: 2000,
    public_commitment_level: 1,

    ...overrides,
  };
}
