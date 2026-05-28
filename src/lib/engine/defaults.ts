import type { Decision } from "./types";

export const DISCRETIONARY_BUDGET = 500_000;
export const BASELINE_BENEFITS = 3000;

export function createDefaultDecision(
  overrides: Partial<Decision> = {}
): Decision {
  return {
    recruitment_budget_per_hire: 5000,
    positions_to_fill: 10,
    screening_rigor: 2,
    diversity_goal_pct: 15,
    onboarding_investment: 500,

    review_frequency: 2,
    performance_pay_pct: 5,
    kpi_investment: 5000,
    feedback_360: false,
    pip_investment: 3000,

    training_budget_per_ee: 800,
    pct_employees_trained: 60,
    training_focus: "Technical",
    succession_investment: 5000,

    engagement_investment: 5000,
    conflict_budget: 5000,
    flexibility_level: 1,
    voice_mechanisms: 1,

    salary_vs_market_pct: 100,
    benefits_per_ee: 3000,
    bonus_pool_pct: 3,
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
