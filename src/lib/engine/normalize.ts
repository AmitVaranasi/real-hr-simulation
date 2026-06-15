import { clamp } from "../utils";

export function normalizeStandard(value: number, max: number): number {
  return clamp(value / max, 0, 1);
}

export function normalizeInverse(value: number, max: number): number {
  return clamp(1 - value / max, 0, 1);
}

export function normalizeMetric(value: number, metricName: string): number {
  const CONFIGS: Record<string, { max: number; inverse: boolean }> = {
    employee_satisfaction: { max: 100, inverse: false },
    engagement_level: { max: 100, inverse: false },
    dei_score: { max: 100, inverse: false },
    review_coverage: { max: 100, inverse: false },
    training_effectiveness: { max: 40, inverse: false },
    succession_pipeline: { max: 100, inverse: false },
    hr_tech_score: { max: 100, inverse: false },
    budget_adherence: { max: 100, inverse: false },
    turnover_rate: { max: 40, inverse: true },
    absenteeism_rate: { max: 20, inverse: true },
    cost_per_hire: { max: 15000, inverse: true },
    time_to_fill: { max: 90, inverse: true },
    compensation_ratio: { max: 60, inverse: true },
    training_roi: { max: 50, inverse: false },
    hiring_quality: { max: 100, inverse: false },
    productivity: { max: 1, inverse: false },
  };

  const config = CONFIGS[metricName];
  if (!config) return clamp(value / 100, 0, 1);

  return config.inverse
    ? normalizeInverse(value, config.max)
    : normalizeStandard(value, config.max);
}
