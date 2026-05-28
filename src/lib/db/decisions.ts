import { createDefaultDecision } from "@/lib/engine/defaults";
import type { Decision } from "@/lib/engine/types";

export function decisionToRow(
  d: Decision,
  teamId: string,
  roundId: string,
  userId?: string
) {
  const defaults = createDefaultDecision();
  return {
    team_id: teamId,
    round_id: roundId,
    submitted_by: d.is_submitted ? userId ?? d.submitted_by : null,
    submitted_at: d.is_submitted ? new Date().toISOString() : null,
    is_submitted: d.is_submitted ?? false,
    recruitment_budget_per_hire:
      d.recruitment_budget_per_hire ?? defaults.recruitment_budget_per_hire,
    positions_to_fill: d.positions_to_fill ?? defaults.positions_to_fill,
    screening_rigor: d.screening_rigor ?? defaults.screening_rigor,
    diversity_goal_pct: d.diversity_goal_pct ?? defaults.diversity_goal_pct,
    onboarding_investment:
      d.onboarding_investment ?? defaults.onboarding_investment,
    review_frequency: d.review_frequency ?? defaults.review_frequency,
    performance_pay_pct: d.performance_pay_pct ?? defaults.performance_pay_pct,
    kpi_investment: d.kpi_investment ?? defaults.kpi_investment,
    feedback_360: d.feedback_360 ?? defaults.feedback_360,
    pip_investment: d.pip_investment ?? defaults.pip_investment,
    training_budget_per_ee:
      d.training_budget_per_ee ?? defaults.training_budget_per_ee,
    pct_employees_trained:
      d.pct_employees_trained ?? defaults.pct_employees_trained,
    training_focus: d.training_focus ?? defaults.training_focus,
    succession_investment:
      d.succession_investment ?? defaults.succession_investment,
    engagement_investment:
      d.engagement_investment ?? defaults.engagement_investment,
    conflict_budget: d.conflict_budget ?? defaults.conflict_budget,
    flexibility_level: d.flexibility_level ?? defaults.flexibility_level,
    voice_mechanisms: d.voice_mechanisms ?? defaults.voice_mechanisms,
    salary_vs_market_pct:
      d.salary_vs_market_pct ?? defaults.salary_vs_market_pct,
    benefits_per_ee: d.benefits_per_ee ?? defaults.benefits_per_ee,
    bonus_pool_pct: d.bonus_pool_pct ?? defaults.bonus_pool_pct,
    equity_level: d.equity_level ?? defaults.equity_level,
    span_of_control: d.span_of_control ?? defaults.span_of_control,
    restructuring_investment:
      d.restructuring_investment ?? defaults.restructuring_investment,
    change_comm_effort: d.change_comm_effort ?? defaults.change_comm_effort,
    hr_tech_level: d.hr_tech_level ?? defaults.hr_tech_level,
    dei_training_per_ee: d.dei_training_per_ee ?? defaults.dei_training_per_ee,
    inclusive_hiring_investment:
      d.inclusive_hiring_investment ?? defaults.inclusive_hiring_investment,
    erg_budget: d.erg_budget ?? defaults.erg_budget,
    public_commitment_level:
      d.public_commitment_level ?? defaults.public_commitment_level,
  };
}

export function rowToDecision(row: Record<string, unknown>): Decision {
  return {
    id: row.id as string,
    team_id: row.team_id as string,
    round_id: row.round_id as string,
    submitted_by: (row.submitted_by as string) ?? null,
    submitted_at: (row.submitted_at as string) ?? null,
    is_submitted: Boolean(row.is_submitted),
    recruitment_budget_per_hire: Number(row.recruitment_budget_per_hire),
    positions_to_fill: Number(row.positions_to_fill),
    screening_rigor: Number(row.screening_rigor) as 1 | 2 | 3,
    diversity_goal_pct: Number(row.diversity_goal_pct),
    onboarding_investment: Number(row.onboarding_investment),
    review_frequency: Number(row.review_frequency) as 1 | 2 | 4,
    performance_pay_pct: Number(row.performance_pay_pct),
    kpi_investment: Number(row.kpi_investment),
    feedback_360: Boolean(row.feedback_360),
    pip_investment: Number(row.pip_investment),
    training_budget_per_ee: Number(row.training_budget_per_ee),
    pct_employees_trained: Number(row.pct_employees_trained),
    training_focus: row.training_focus as Decision["training_focus"],
    succession_investment: Number(row.succession_investment),
    engagement_investment: Number(row.engagement_investment),
    conflict_budget: Number(row.conflict_budget),
    flexibility_level: Number(row.flexibility_level) as 0 | 1 | 2,
    voice_mechanisms: Number(row.voice_mechanisms) as 0 | 1 | 2,
    salary_vs_market_pct: Number(row.salary_vs_market_pct),
    benefits_per_ee: Number(row.benefits_per_ee),
    bonus_pool_pct: Number(row.bonus_pool_pct),
    equity_level: Number(row.equity_level) as 0 | 1 | 2,
    span_of_control: Number(row.span_of_control),
    restructuring_investment: Number(row.restructuring_investment),
    change_comm_effort: Number(row.change_comm_effort) as Decision["change_comm_effort"],
    hr_tech_level: Number(row.hr_tech_level) as 0 | 1 | 2,
    dei_training_per_ee: Number(row.dei_training_per_ee),
    inclusive_hiring_investment: Number(row.inclusive_hiring_investment),
    erg_budget: Number(row.erg_budget),
    public_commitment_level: Number(row.public_commitment_level) as 0 | 1 | 2,
  };
}
