import type { Decision, HRMetrics, IndustryConfig, PriorState } from "./types";
import { clamp } from "../utils";

const SCREENING_MULT: Record<1 | 2 | 3, number> = { 1: 0.8, 2: 1.0, 3: 1.3 };
const SCREENING_SLOW: Record<1 | 2 | 3, number> = { 1: -10, 2: 0, 3: 8 };
const TECH_SPEED: Record<0 | 1 | 2, number> = { 0: 0, 1: -3, 2: -7 };
const FLEX_TURNOVER: Record<0 | 1 | 2, number> = { 0: 2, 1: 0, 2: -3 };
const FLEX_SAT: Record<0 | 1 | 2, number> = { 0: -5, 1: 3, 2: 8 };
const VOICE_SAT: Record<0 | 1 | 2, number> = { 0: -3, 1: 2, 2: 5 };
const VOICE_ENG: Record<0 | 1 | 2, number> = { 0: -4, 1: 2, 2: 6 };
const REVIEW_SAT: Record<1 | 2 | 4, number> = { 1: -2, 2: 1, 4: 3 };
const REVIEW_ENG: Record<1 | 2 | 4, number> = { 1: -1, 2: 1, 4: 3 };
const REVIEW_BASE: Record<1 | 2 | 4, number> = { 1: 70, 2: 85, 4: 95 };
const REVIEW_PIPE: Record<1 | 2 | 4, number> = { 1: 0, 2: 5, 4: 8 };
const EQUITY_TURN: Record<0 | 1 | 2, number> = { 0: 0, 1: -1, 2: -2 };
const FOCUS_MULT: Record<string, number> = {
  Technical: 1.2,
  Leadership: 1.0,
  "Soft Skills": 0.8,
  Compliance: 0.6,
};
const FOCUS_QUALITY: Record<string, number> = {
  Technical: 1.3,
  Leadership: 1.1,
  "Soft Skills": 0.9,
  Compliance: 0.7,
};

export function computeCostPerHire(d: Decision): number {
  const base = d.recruitment_budget_per_hire;
  const screening = SCREENING_MULT[d.screening_rigor];
  const diversity = 1 + (d.diversity_goal_pct / 100) * 0.15;
  const value =
    base * screening * diversity + d.onboarding_investment;
  return clamp(value, 2000, 30000);
}

export function computeTimeToFill(d: Decision): number {
  const budgetSpeedup =
    Math.min((d.recruitment_budget_per_hire - 3000) / 2000, 5) * -2;
  const value =
    45 +
    SCREENING_SLOW[d.screening_rigor] +
    budgetSpeedup +
    d.diversity_goal_pct * 0.2 +
    TECH_SPEED[d.hr_tech_level];
  return clamp(value, 10, 120);
}

export function computeSatisfaction(
  d: Decision,
  prior: PriorState
): number {
  const value =
    prior.satisfaction +
    (d.salary_vs_market_pct - 100) * 0.5 +
    (d.benefits_per_ee - 3000) / 500 +
    FLEX_SAT[d.flexibility_level] +
    VOICE_SAT[d.voice_mechanisms] +
    Math.min(d.engagement_investment / 3000, 5) +
    Math.min(d.conflict_budget / 5000, 4) +
    REVIEW_SAT[d.review_frequency] +
    (d.feedback_360 ? 3 : 0) +
    Math.min(d.training_budget_per_ee / 1000, 4) +
    d.public_commitment_level * 2 +
    Math.min(d.erg_budget / 5000, 2);
  return clamp(value, 20, 100);
}

export function computeEngagement(
  d: Decision,
  prior: PriorState,
  satisfaction: number
): number {
  const value =
    prior.engagement +
    Math.min(d.engagement_investment / 3000, 6) +
    VOICE_ENG[d.voice_mechanisms] +
    FLEX_SAT[d.flexibility_level] +
    Math.min(d.conflict_budget / 5000, 3) +
    (satisfaction - 65) * 0.15 +
    REVIEW_ENG[d.review_frequency] +
    Math.min(d.performance_pay_pct, 15) * 0.2 +
    Math.min(d.erg_budget / 5000, 2);
  return clamp(value, 20, 100);
}

export function computeTurnoverRate(
  d: Decision,
  prior: PriorState,
  satisfaction: number
): number {
  const value =
    prior.turnover_rate +
    (d.salary_vs_market_pct - 100) * -0.3 +
    ((d.benefits_per_ee - 3000) / 1000) * -0.8 +
    FLEX_TURNOVER[d.flexibility_level] +
    Math.min(d.engagement_investment / 5000, 3) * -1 +
    (d.bonus_pool_pct / 100) * -5 +
    (satisfaction - 65) * -0.1 +
    EQUITY_TURN[d.equity_level];
  return clamp(value, 3, 50);
}

export function computeTrainingROI(
  d: Decision,
  prior: PriorState,
  headcount: number
): number {
  const trainingCost =
    d.training_budget_per_ee *
    headcount *
    (d.pct_employees_trained / 100);
  const effectiveness =
    (d.training_budget_per_ee / 200) * (FOCUS_MULT[d.training_focus] ?? 1);
  const productivityGain = (effectiveness / 100) * prior.revenue * 0.02;
  const roi =
    ((productivityGain - trainingCost) / Math.max(trainingCost, 1)) * 100;
  return clamp(roi, -50, 200);
}

export function computeDEIScore(d: Decision): number {
  const value =
    Math.min(d.dei_training_per_ee / 300, 25) +
    Math.min(d.inclusive_hiring_investment / 5000, 20) +
    Math.min(d.erg_budget / 5000, 15) +
    ({ 0: 0, 1: 15, 2: 25 } as const)[d.public_commitment_level] +
    Math.min(d.diversity_goal_pct / 2.5, 15);
  return clamp(value, 0, 100);
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
    Math.min(d.conflict_budget / 10000, 1) * -1;
  return clamp(value, 1, 20);
}

export function computeReviewCoverage(d: Decision): number {
  const value =
    REVIEW_BASE[d.review_frequency] +
    Math.min(d.kpi_investment / 5000, 5) +
    (d.feedback_360 ? 3 : 0) +
    Math.min(d.pip_investment / 5000, 2);
  return clamp(value, 40, 100);
}

export function computeTrainingEffectiveness(d: Decision): number {
  const value =
    Math.min(d.training_budget_per_ee / 1000, 3) *
      (d.pct_employees_trained / 100) *
      (FOCUS_QUALITY[d.training_focus] ?? 1) *
      8 +
    Math.min(d.succession_investment / 20000, 0.3) * 5;
  return clamp(value, 0, 40);
}

export function computeSuccessionPipeline(d: Decision): number {
  const value =
    20 +
    Math.min(d.succession_investment / 10000, 40) +
    Math.min(d.training_budget_per_ee / 2000, 15) +
    (d.training_focus === "Leadership" ? 10 : 0) +
    REVIEW_PIPE[d.review_frequency] +
    (d.feedback_360 ? 5 : 0);
  return clamp(value, 5, 100);
}

export function computeHRTechScore(d: Decision): number {
  return ({ 0: 20, 1: 60, 2: 95 } as const)[d.hr_tech_level];
}

export function computeAllMetrics(
  d: Decision,
  prior: PriorState,
  _config: IndustryConfig
): HRMetrics {
  const headcount = prior.headcount;
  const satisfaction = computeSatisfaction(d, prior);
  const engagement = computeEngagement(d, prior, satisfaction);
  const turnover_rate = computeTurnoverRate(d, prior, satisfaction);
  const dei_score = computeDEIScore(d);

  let turnover = turnover_rate;
  if (
    _config.industry === "High-Tech" &&
    d.salary_vs_market_pct < 95
  ) {
    turnover = clamp(turnover + 8, 3, 50);
  }

  return {
    cost_per_hire: computeCostPerHire(d),
    time_to_fill: computeTimeToFill(d),
    turnover_rate: turnover,
    employee_satisfaction: satisfaction,
    training_roi: computeTrainingROI(d, prior, headcount),
    engagement_level: engagement,
    dei_score,
    absenteeism_rate: computeAbsenteeism(satisfaction, engagement, d),
    review_coverage: computeReviewCoverage(d),
    training_effectiveness: computeTrainingEffectiveness(d),
    succession_pipeline: computeSuccessionPipeline(d),
    hr_tech_score: computeHRTechScore(d),
    compensation_ratio: 0,
    budget_adherence: 0,
  };
}
