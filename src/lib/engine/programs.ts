import type {
  CollaborationEnablement,
  ConflictApproach,
  DevelopmentalProgram,
  InvestmentLevel,
} from "./types";

export const PROGRAM_COSTS: Record<DevelopmentalProgram, number> = {
  "Leadership Development": 1200,
  "Time Management": 400,
  "Managerial Skills": 800,
  "Technical Skills": 1000,
  Compliance: 300,
  "Project Management": 600,
};

export const PROGRAM_EFFECTIVENESS: Record<DevelopmentalProgram, number> = {
  "Leadership Development": 1.1,
  "Time Management": 0.8,
  "Managerial Skills": 1.0,
  "Technical Skills": 1.2,
  Compliance: 0.6,
  "Project Management": 0.9,
};

export const CONFLICT_CONFIG: Record<
  ConflictApproach,
  { cost: number; satisfaction_impact: number; engagement_impact: number }
> = {
  mediation: { cost: 3000, satisfaction_impact: 3, engagement_impact: 2 },
  disciplinary: { cost: 1500, satisfaction_impact: -2, engagement_impact: -3 },
  coaching: { cost: 5000, satisfaction_impact: 5, engagement_impact: 5 },
};

export const HR_TECH_ANNUAL_COST: Record<0 | 1 | 2, number> = {
  0: 0,
  1: 15_000,
  2: 30_000,
};

export const DEVELOPMENTAL_PROGRAMS: DevelopmentalProgram[] = [
  "Leadership Development",
  "Time Management",
  "Managerial Skills",
  "Technical Skills",
  "Compliance",
  "Project Management",
];

/** Configurable cost hooks for Org Design investment-bearing choices */
export const CHANGE_MGMT_COST: Record<InvestmentLevel, number> = {
  Minimal: 0,
  Basic: 4_000,
  Moderate: 8_000,
  Strong: 14_000,
  Advanced: 22_000,
};

export const COLLABORATION_COST: Record<CollaborationEnablement, number> = {
  Limited: 0,
  Standard: 3_000,
  Enhanced: 7_000,
  "Highly Integrated": 12_000,
};

/** Configurable DEI portfolio level costs (budget only; no scoring yet) */
export const DEI_LEVEL_COST: Record<InvestmentLevel, number> = {
  Minimal: 0,
  Basic: 2_000,
  Moderate: 4_500,
  Strong: 8_000,
  Advanced: 12_000,
};

export const INVESTMENT_LEVELS: InvestmentLevel[] = [
  "Minimal",
  "Basic",
  "Moderate",
  "Strong",
  "Advanced",
];
