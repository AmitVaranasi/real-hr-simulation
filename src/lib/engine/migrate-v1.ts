import { createDefaultDecision } from "./defaults";
import { ROLE_GROUPS } from "./roles";
import type {
  CollaborationEnablement,
  ConflictApproach,
  Decision,
  DevelopmentalProgram,
  InvestmentLevel,
  OrganizationalStructure,
  ProcessFocus,
  SalaryBand,
} from "./types";

/** Map legacy DB rows (V1 columns) into V2 Decision shape. */
export function migrateV1RowToDecision(row: Record<string, unknown>): Decision {
  const base = createDefaultDecision();
  const legacyPositions = Number(row.positions_to_fill ?? 0);
  const trainingFocus = String(row.training_focus ?? "Technical");

  const programMap: Record<string, DevelopmentalProgram> = {
    Technical: "Technical Skills",
    Leadership: "Leadership Development",
    "Soft Skills": "Managerial Skills",
    Compliance: "Compliance",
  };

  const conflictCost = Number(row.conflict_budget ?? 3000);
  let conflict_approach: ConflictApproach = "mediation";
  if (conflictCost <= 2000) conflict_approach = "disciplinary";
  else if (conflictCost >= 4500) conflict_approach = "coaching";

  const salaryPct = Number(row.salary_vs_market_pct ?? 100);
  let salary_band: SalaryBand = 0;
  if (salaryPct <= 85) salary_band = -20;
  else if (salaryPct <= 95) salary_band = -10;
  else if (salaryPct >= 115) salary_band = 20;
  else if (salaryPct >= 105) salary_band = 10;

  const bonusRaw = Number(row.bonus_pool_pct ?? 0.05);
  const bonusPct = bonusRaw < 1 ? bonusRaw * 100 : bonusRaw;
  let bonus_tier: Decision["bonus_tier"] = 5;
  if (bonusPct >= 12) bonus_tier = 15;
  else if (bonusPct >= 7) bonus_tier = 10;

  const benefitsEe = Number(row.benefits_per_ee ?? 3000);
  const marketSalary = 55_000;
  const benefits_pct = Math.round(
    Math.min(20, Math.max(6, (benefitsEe / marketSalary) * 100))
  ) as Decision["benefits_pct"];

  return {
    ...base,
    id: row.id as string | undefined,
    team_id: row.team_id as string | undefined,
    round_id: row.round_id as string | undefined,
    submitted_by: (row.submitted_by as string) ?? null,
    submitted_at: (row.submitted_at as string) ?? null,
    is_submitted: Boolean(row.is_submitted),

    positions_to_fill:
      legacyPositions > 0
        ? [{ role_id: "professional", count: legacyPositions }]
        : base.positions_to_fill,
    screening_rigor: Number(row.screening_rigor ?? 2) as 1 | 2 | 3,
    diversity_goal_pct: Number(row.diversity_goal_pct ?? 15),
    onboarding_investment: Number(row.onboarding_investment ?? 500),

    review_frequency: Number(row.review_frequency ?? 2) as 1 | 2 | 4,
    feedback_360: Boolean(row.feedback_360),

    developmental_programs: [
      programMap[trainingFocus] ?? "Technical Skills",
    ],
    pct_employees_trained: Number(row.pct_employees_trained ?? 40),
    training_budget_per_ee: Number(row.training_budget_per_ee ?? 700),
    succession_investment: Number(row.succession_investment ?? 5000),

    engagement_investment: Number(row.engagement_investment ?? 5000),
    conflict_approach,
    flexibility_level: Number(row.flexibility_level ?? 1) as 0 | 1 | 2,
    voice_mechanisms: Number(row.voice_mechanisms ?? 1) as 0 | 1 | 2,

    role_compensation: ROLE_GROUPS.map((r) => ({
      role_id: r.id,
      salary_band,
    })),
    benefits_pct,
    bonus_tier,
    equity_level: Number(row.equity_level ?? 0) as 0 | 1 | 2,
    hr_tech_level: Number(row.hr_tech_level ?? 0) as 0 | 1 | 2,

    span_of_control: Number(row.span_of_control ?? base.span_of_control),
  };
}

export function parseJsonColumn<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export function rowToDecision(row: Record<string, unknown>): Decision {
  const hasV2 =
    row.positions_to_fill_json != null ||
    row.role_compensation_json != null;

  if (!hasV2) {
    return migrateV1RowToDecision(row);
  }

  const base = migrateV1RowToDecision(row);

  return {
    ...base,
    positions_to_fill: parseJsonColumn(
      row.positions_to_fill_json,
      base.positions_to_fill
    ),
    role_compensation: parseJsonColumn(
      row.role_compensation_json,
      base.role_compensation
    ),
    role_performance: parseJsonColumn(
      row.role_performance_json,
      base.role_performance
    ),
    developmental_programs: parseJsonColumn(
      row.developmental_programs,
      base.developmental_programs
    ),
    conflict_approach:
      (row.conflict_approach as ConflictApproach) ?? base.conflict_approach,
    benefits_pct: Number(row.benefits_pct ?? base.benefits_pct),
    bonus_tier: Number(row.bonus_tier ?? base.bonus_tier) as Decision["bonus_tier"],

    ...(() => {
      const org = parseJsonColumn<Partial<Decision>>(row.org_design_json, {});
      const dei = parseJsonColumn<Partial<Decision>>(
        row.dei_initiatives_json,
        {}
      );
      return {
        organizational_structure: (org.organizational_structure ??
          base.organizational_structure) as OrganizationalStructure,
        span_of_control: Number(
          org.span_of_control ?? row.span_of_control ?? base.span_of_control
        ),
        process_focus: (org.process_focus ??
          base.process_focus) as ProcessFocus,
        change_management_capability: (org.change_management_capability ??
          base.change_management_capability) as InvestmentLevel,
        collaboration_enablement: (org.collaboration_enablement ??
          base.collaboration_enablement) as CollaborationEnablement,
        dei_diverse_recruitment: (dei.dei_diverse_recruitment ??
          base.dei_diverse_recruitment) as InvestmentLevel,
        dei_equity_practices: (dei.dei_equity_practices ??
          base.dei_equity_practices) as InvestmentLevel,
        dei_inclusion_initiatives: (dei.dei_inclusion_initiatives ??
          base.dei_inclusion_initiatives) as InvestmentLevel,
        dei_training_education: (dei.dei_training_education ??
          base.dei_training_education) as InvestmentLevel,
        dei_accessibility_support: (dei.dei_accessibility_support ??
          base.dei_accessibility_support) as InvestmentLevel,
      };
    })(),
  };
}
