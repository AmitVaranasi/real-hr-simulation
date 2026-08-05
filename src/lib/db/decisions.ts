import { createDefaultDecision } from "@/lib/engine/defaults";
import { CONFLICT_CONFIG } from "@/lib/engine/programs";
import { totalHires } from "@/lib/engine/roles";
import { rowToDecision } from "@/lib/engine/migrate-v1";
import type { Decision } from "@/lib/engine/types";

export { rowToDecision };

export function decisionToRow(
  d: Decision,
  teamId: string,
  roundId: string,
  userId?: string
) {
  const defaults = createDefaultDecision();
  const totalPositions = totalHires(d.positions_to_fill);

  return {
    team_id: teamId,
    round_id: roundId,
    submitted_by: d.is_submitted ? userId ?? d.submitted_by : null,
    submitted_at: d.is_submitted ? new Date().toISOString() : null,
    is_submitted: d.is_submitted ?? false,

    positions_to_fill_json: d.positions_to_fill,
    role_compensation_json: d.role_compensation,
    role_performance_json: d.role_performance,
    developmental_programs: d.developmental_programs,
    conflict_approach: d.conflict_approach,
    benefits_pct: d.benefits_pct,
    bonus_tier: d.bonus_tier,

    screening_rigor: d.screening_rigor ?? defaults.screening_rigor,
    diversity_goal_pct: d.diversity_goal_pct ?? defaults.diversity_goal_pct,
    onboarding_investment:
      d.onboarding_investment ?? defaults.onboarding_investment,
    review_frequency: d.review_frequency ?? defaults.review_frequency,
    feedback_360: d.feedback_360 ?? defaults.feedback_360,
    pct_employees_trained:
      d.pct_employees_trained ?? defaults.pct_employees_trained,
    training_budget_per_ee:
      d.training_budget_per_ee ?? defaults.training_budget_per_ee,
    succession_investment:
      d.succession_investment ?? defaults.succession_investment,
    engagement_investment:
      d.engagement_investment ?? defaults.engagement_investment,
    flexibility_level: d.flexibility_level ?? defaults.flexibility_level,
    voice_mechanisms: d.voice_mechanisms ?? defaults.voice_mechanisms,
    equity_level: d.equity_level ?? defaults.equity_level,
    hr_tech_level: d.hr_tech_level ?? defaults.hr_tech_level,

    org_design_json: {
      organizational_structure:
        d.organizational_structure ?? defaults.organizational_structure,
      span_of_control: d.span_of_control ?? defaults.span_of_control,
      process_focus: d.process_focus ?? defaults.process_focus,
      change_management_capability:
        d.change_management_capability ??
        defaults.change_management_capability,
      collaboration_enablement:
        d.collaboration_enablement ?? defaults.collaboration_enablement,
    },
    dei_initiatives_json: {
      dei_diverse_recruitment:
        d.dei_diverse_recruitment ?? defaults.dei_diverse_recruitment,
      dei_equity_practices:
        d.dei_equity_practices ?? defaults.dei_equity_practices,
      dei_inclusion_initiatives:
        d.dei_inclusion_initiatives ?? defaults.dei_inclusion_initiatives,
      dei_training_education:
        d.dei_training_education ?? defaults.dei_training_education,
      dei_accessibility_support:
        d.dei_accessibility_support ?? defaults.dei_accessibility_support,
    },

    recruitment_budget_per_hire: 4500,
    positions_to_fill: totalPositions,
    performance_pay_pct: d.bonus_tier,
    kpi_investment: 5000,
    pip_investment: 0,
    training_focus:
      d.developmental_programs[0] === "Technical Skills"
        ? "Technical"
        : "Leadership",
    conflict_budget: CONFLICT_CONFIG[d.conflict_approach].cost,
    salary_vs_market_pct: 100,
    benefits_per_ee: 3000,
    bonus_pool_pct: d.bonus_tier,
    span_of_control: d.span_of_control ?? defaults.span_of_control,
    restructuring_investment: 0,
    change_comm_effort: 3,
    dei_training_per_ee: 100,
    inclusive_hiring_investment: 3000,
    erg_budget: 2000,
    public_commitment_level: 1,
  };
}
