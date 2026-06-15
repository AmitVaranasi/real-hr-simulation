import { computeRecruitmentCost, computeTrainingSpend } from "./budget";
import {
  CONFLICT_CONFIG,
  PROGRAM_COSTS,
  PROGRAM_EFFECTIVENESS,
} from "./programs";
import {
  avgPerformanceCriteria,
  computeVariance,
  getRoleById,
  roleHeadcount,
  totalHires,
  weightedAvgSalaryBand,
} from "./roles";
import type { Decision, HRMetrics, IndustryConfig, PriorState } from "./types";
import { clamp } from "../utils";

const SCREENING_SLOW: Record<1 | 2 | 3, number> = { 1: -5, 2: 0, 3: 8 };
const TECH_SPEED: Record<0 | 1 | 2, number> = { 0: 0, 1: -3, 2: -7 };
const REVIEW_BASE: Record<1 | 2 | 4, number> = { 1: 70, 2: 85, 4: 95 };
const REVIEW_PIPE: Record<1 | 2 | 4, number> = { 1: 0, 2: 5, 4: 8 };
const EQUITY_TURN: Record<0 | 1 | 2, number> = { 0: 0, 1: -1, 2: -2 };

export function computeCostPerHire(
  d: Decision,
  industryConfig: IndustryConfig
): number {
  const hires = totalHires(d.positions_to_fill);
  if (hires === 0) return 0;
  return computeRecruitmentCost(d, industryConfig) / hires;
}

export function computeTimeToFill(d: Decision): number {
  const hires = totalHires(d.positions_to_fill);
  if (hires === 0) return 0;

  let weightedDays = 0;
  for (const pos of d.positions_to_fill) {
    const role = getRoleById(pos.role_id);
    if (!role || pos.count <= 0) continue;
    const days =
      role.timeToFillBase +
      SCREENING_SLOW[d.screening_rigor] +
      d.diversity_goal_pct * 0.2 +
      TECH_SPEED[d.hr_tech_level];
    weightedDays += clamp(days, 10, 120) * pos.count;
  }
  return weightedDays / hires;
}

export function computeSatisfaction(
  d: Decision,
  prior: PriorState
): number {
  const avgSalaryBand = weightedAvgSalaryBand(d.role_compensation);
  const compensation = clamp(
    50 + avgSalaryBand * 2 + (d.benefits_pct - 10) * 2 + d.bonus_tier,
    20,
    100
  );
  const training = clamp(
    30 + d.developmental_programs.length * 8 + d.pct_employees_trained * 0.3,
    20,
    100
  );
  const avgLeadership = avgPerformanceCriteria(d.role_performance, "leadership");
  const leadership = clamp(avgLeadership * 10, 20, 100);
  const cultureBase =
    CONFLICT_CONFIG[d.conflict_approach].satisfaction_impact * 5;
  const culture = clamp(
    50 +
      cultureBase +
      d.voice_mechanisms * 8 +
      d.engagement_investment / 1000,
    20,
    100
  );
  const workEnv = clamp(
    40 + d.flexibility_level * 15 + d.hr_tech_level * 10,
    20,
    100
  );
  const raw =
    (compensation + training + leadership + culture + workEnv) / 5;
  return clamp(raw * 0.7 + prior.satisfaction * 0.3, 20, 100);
}

export function computeEngagement(
  d: Decision,
  prior: PriorState,
  satisfaction: number
): number {
  const recognition = clamp(
    30 + d.bonus_tier * 3 + d.equity_level * 10,
    20,
    100
  );
  const development = clamp(
    30 +
      d.developmental_programs.length * 10 +
      d.succession_investment / 1000,
    20,
    100
  );
  const communication = clamp(
    30 +
      d.voice_mechanisms * 15 +
      (d.feedback_360 ? 15 : 0) +
      d.review_frequency * 5,
    20,
    100
  );
  const cultureImpact =
    CONFLICT_CONFIG[d.conflict_approach].engagement_impact * 5;
  const culture = clamp(
    50 +
      cultureImpact +
      d.flexibility_level * 10 +
      d.engagement_investment / 1000,
    20,
    100
  );
  const raw = (recognition + development + communication + culture) / 4;
  return clamp(
    raw * 0.6 + prior.engagement * 0.3 + (satisfaction - 50) * 0.1,
    20,
    100
  );
}

export function computeTurnoverRate(
  d: Decision,
  prior: PriorState,
  satisfaction: number,
  industryConfig: IndustryConfig
): number {
  const avgBand = weightedAvgSalaryBand(d.role_compensation);
  let value =
    prior.turnover_rate +
    avgBand * -0.25 +
    (d.benefits_pct - 10) * -0.3 +
    (d.bonus_tier - 5) * -0.4 +
    (satisfaction - 65) * -0.12 +
    EQUITY_TURN[d.equity_level];

  if (industryConfig.industry === "High-Tech" && 100 + avgBand < 95) {
    value += 8;
  }

  return clamp(value, 3, 50);
}

export function computeTurnoverByRole(
  d: Decision,
  prior: PriorState,
  satisfaction: number
): number[] {
  return d.role_compensation.map((rc) => {
    const bandPenalty = rc.salary_band < 0 ? Math.abs(rc.salary_band) * 0.15 : 0;
    return clamp(
      prior.turnover_rate + bandPenalty + (satisfaction - 65) * -0.05,
      3,
      50
    );
  });
}

export function computeTrainingEffectiveness(d: Decision): number {
  const preTraining = 50;
  const programBoost = d.developmental_programs.reduce((sum, prog) => {
    return sum + (PROGRAM_EFFECTIVENESS[prog] ?? 1) * 3;
  }, 0);
  const budgetBoost = clamp(d.training_budget_per_ee / 500, 0, 5);
  const coverageBoost = (d.pct_employees_trained / 100) * 5;
  const postTraining = preTraining + programBoost + budgetBoost + coverageBoost;
  return clamp(((postTraining - preTraining) / preTraining) * 100, 0, 40);
}

export function computeProductivity(
  d: Decision,
  engagement: number,
  retention: number,
  trainingEffectiveness: number
): number {
  const trainingNorm = clamp(trainingEffectiveness / 30, 0, 1);
  const engagementNorm = clamp(engagement / 100, 0, 1);
  const retentionNorm = clamp(retention / 100, 0, 1);
  const leadershipNorm = clamp(
    avgPerformanceCriteria(d.role_performance, "leadership") / 10,
    0,
    1
  );
  const techNorm = clamp(d.hr_tech_level / 2, 0, 1);

  return (
    0.3 * trainingNorm +
    0.25 * engagementNorm +
    0.2 * retentionNorm +
    0.15 * leadershipNorm +
    0.1 * techNorm
  );
}

export function computeHiringQuality(d: Decision, turnoverRate: number): number {
  const selectionAccuracy = ({ 1: 50, 2: 70, 3: 90 } as const)[
    d.screening_rigor
  ];
  const trainingReadiness = clamp(
    30 +
      d.developmental_programs.length * 8 +
      d.onboarding_investment / 100,
    0,
    100
  );
  const retentionProbability = clamp(100 - turnoverRate * 2, 0, 100);
  return (selectionAccuracy + trainingReadiness + retentionProbability) / 3;
}

export function computeDEIScore(
  d: Decision,
  turnoverByRole: number[]
): number {
  const targets = clamp((d.diversity_goal_pct / 50) * 25, 0, 25);
  const deiPrograms = d.developmental_programs.filter((p) =>
    ["Leadership Development", "Compliance"].includes(p)
  ).length;
  const programs = clamp((deiPrograms / 2) * 25, 0, 25);

  let leadershipSupport = 0;
  if (d.conflict_approach === "coaching") leadershipSupport += 10;
  if (d.voice_mechanisms >= 1) leadershipSupport += 8;
  if (d.engagement_investment > 3000) leadershipSupport += 7;
  leadershipSupport = clamp(leadershipSupport, 0, 25);

  const variance = computeVariance(turnoverByRole);
  const retentionEquity = clamp(25 - variance * 5, 0, 25);

  return clamp(
    (targets + programs + leadershipSupport + retentionEquity) * 4,
    0,
    100
  );
}

export function computeTrainingROI(
  d: Decision,
  prior: PriorState,
  headcount: number,
  productivity: number
): number {
  const trainingCost = computeTrainingSpend(d, headcount);
  const productivityGain = prior.revenue * productivity * 0.02;
  return clamp(
    ((productivityGain - trainingCost) / Math.max(trainingCost, 1)) * 100,
    -50,
    200
  );
}

export function computeAbsenteeism(
  satisfaction: number,
  engagement: number,
  d: Decision
): number {
  const value =
    8 +
    (satisfaction - 65) * -0.08 +
    ({ 0: 1, 1: -1, 2: -2 } as const)[d.flexibility_level] +
    (engagement - 60) * -0.05 +
    CONFLICT_CONFIG[d.conflict_approach].satisfaction_impact * -0.2;
  return clamp(value, 1, 20);
}

export function computeReviewCoverage(d: Decision): number {
  const kpiBoost = Math.min(
    avgPerformanceCriteria(d.role_performance, "productivity") - 5,
    5
  );
  const value =
    REVIEW_BASE[d.review_frequency] +
    kpiBoost +
    (d.feedback_360 ? 3 : 0);
  return clamp(value, 40, 100);
}

export function computeSuccessionPipeline(d: Decision): number {
  const hasLeadership = d.developmental_programs.includes(
    "Leadership Development"
  );
  const value =
    20 +
    Math.min(d.succession_investment / 10000, 40) +
    Math.min(d.training_budget_per_ee / 2000, 15) +
    (hasLeadership ? 10 : 0) +
    REVIEW_PIPE[d.review_frequency] +
    (d.feedback_360 ? 5 : 0);
  return clamp(value, 5, 100);
}

export function computeHRTechScore(d: Decision): number {
  return ({ 0: 20, 1: 60, 2: 95 } as const)[d.hr_tech_level];
}

export function computeTurnoverCost(
  headcount: number,
  turnoverRate: number,
  industryConfig: IndustryConfig
): number {
  const employeesLost = Math.floor(headcount * (turnoverRate / 100));
  const replacementCost = industryConfig.base_market_salary * 0.5;
  return employeesLost * replacementCost;
}

export function applyIndustryMultipliers(
  metrics: HRMetrics,
  industryConfig: IndustryConfig
): HRMetrics {
  const m = industryConfig.module_multipliers;

  return {
    ...metrics,
    cost_per_hire: metrics.cost_per_hire / m.recruitment,
    time_to_fill: metrics.time_to_fill / m.recruitment,
    review_coverage: metrics.review_coverage * (0.5 + m.performance * 0.5),
    training_effectiveness:
      metrics.training_effectiveness * m.training,
    training_roi: metrics.training_roi * m.training,
    employee_satisfaction:
      metrics.employee_satisfaction * (0.5 + m.relations * 0.5),
    engagement_level: metrics.engagement_level * (0.5 + m.relations * 0.5),
    turnover_rate: metrics.turnover_rate / m.compensation,
    dei_score: metrics.dei_score * (0.5 + m.dei * 0.5),
  };
}

export function computeAllMetrics(
  d: Decision,
  prior: PriorState,
  industryConfig: IndustryConfig
): HRMetrics {
  const headcount = prior.headcount;
  const satisfaction = computeSatisfaction(d, prior);
  const engagement = computeEngagement(d, prior, satisfaction);
  const turnover_rate = computeTurnoverRate(
    d,
    prior,
    satisfaction,
    industryConfig
  );
  const retention = 100 - turnover_rate;
  const training_effectiveness = computeTrainingEffectiveness(d);
  const productivity = computeProductivity(
    d,
    engagement,
    retention,
    training_effectiveness
  );
  const turnoverByRole = computeTurnoverByRole(d, prior, satisfaction);
  const dei_score = computeDEIScore(d, turnoverByRole);
  const hiring_quality = computeHiringQuality(d, turnover_rate);
  const turnover_cost = computeTurnoverCost(
    headcount,
    turnover_rate,
    industryConfig
  );

  const raw: HRMetrics = {
    cost_per_hire: computeCostPerHire(d, industryConfig),
    time_to_fill: computeTimeToFill(d),
    turnover_rate,
    employee_satisfaction: satisfaction,
    training_roi: computeTrainingROI(d, prior, headcount, productivity),
    engagement_level: engagement,
    dei_score,
    absenteeism_rate: computeAbsenteeism(satisfaction, engagement, d),
    review_coverage: computeReviewCoverage(d),
    training_effectiveness,
    succession_pipeline: computeSuccessionPipeline(d),
    hr_tech_score: computeHRTechScore(d),
    compensation_ratio: 0,
    budget_adherence: 0,
    productivity,
    hiring_quality,
    turnover_cost,
  };

  return applyIndustryMultipliers(raw, industryConfig);
}
