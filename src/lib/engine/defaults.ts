import { ROLE_GROUPS } from "./roles";
import type { BonusTier, Decision, SalaryBand } from "./types";

export const DISCRETIONARY_BUDGET = 500_000;

export function createDefaultDecision(
  overrides: Partial<Decision> = {}
): Decision {
  return {
    positions_to_fill: [
      { role_id: "entry", count: 2 },
      { role_id: "professional", count: 2 },
      { role_id: "technical", count: 1 },
    ],
    screening_rigor: 2,
    diversity_goal_pct: 15,
    onboarding_investment: 500,

    review_frequency: 2,
    role_performance: ROLE_GROUPS.map((r) => ({
      role_id: r.id,
      productivity: 5,
      teamwork: 5,
      leadership: r.id === "manager" || r.id === "executive" ? 7 : 4,
      communication: 5,
    })),
    feedback_360: false,

    developmental_programs: ["Technical Skills"],
    pct_employees_trained: 35,
    training_budget_per_ee: 380,
    succession_investment: 5000,

    engagement_investment: 5000,
    conflict_approach: "mediation",
    flexibility_level: 1,
    voice_mechanisms: 1,

    role_compensation: ROLE_GROUPS.map((r) => ({
      role_id: r.id,
      salary_band: 0 as SalaryBand,
    })),
    benefits_pct: 10,
    bonus_tier: 5 as BonusTier,
    equity_level: 0,

    hr_tech_level: 0,

    ...overrides,
  };
}
