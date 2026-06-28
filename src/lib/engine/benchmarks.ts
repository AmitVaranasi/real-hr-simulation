export type BenchmarkDirection = "higher" | "lower";

export interface ScoringBenchmarkDef {
  id: string;
  label: string;
  perspective: "financial" | "employee" | "process" | "learning";
  excellent: number;
  moderate: number;
  poor: number;
  weight: number;
  direction: BenchmarkDirection;
}

export const SCORING_BENCHMARKS: ScoringBenchmarkDef[] = [
  {
    id: "training_roi",
    label: "Training ROI",
    perspective: "financial",
    excellent: 20,
    moderate: 7.5,
    poor: 0,
    weight: 0.3,
    direction: "higher",
  },
  {
    id: "cost_per_hire",
    label: "Cost per hire",
    perspective: "financial",
    excellent: 4500,
    moderate: 7500,
    poor: 10000,
    weight: 0.25,
    direction: "lower",
  },
  {
    id: "compensation_ratio",
    label: "Compensation ratio",
    perspective: "financial",
    excellent: 30,
    moderate: 40,
    poor: 50,
    weight: 0.25,
    direction: "lower",
  },
  {
    id: "budget_adherence",
    label: "Budget adherence",
    perspective: "financial",
    excellent: 95,
    moderate: 75,
    poor: 60,
    weight: 0.2,
    direction: "higher",
  },
  {
    id: "employee_satisfaction",
    label: "Employee satisfaction",
    perspective: "employee",
    excellent: 85,
    moderate: 70,
    poor: 55,
    weight: 0.3,
    direction: "higher",
  },
  {
    id: "retention",
    label: "Retention",
    perspective: "employee",
    excellent: 90,
    moderate: 80,
    poor: 70,
    weight: 0.3,
    direction: "higher",
  },
  {
    id: "engagement_level",
    label: "Engagement",
    perspective: "employee",
    excellent: 85,
    moderate: 70,
    poor: 55,
    weight: 0.25,
    direction: "higher",
  },
  {
    id: "dei_score_employee",
    label: "DEI score (employee)",
    perspective: "employee",
    excellent: 85,
    moderate: 67,
    poor: 50,
    weight: 0.15,
    direction: "higher",
  },
  {
    id: "time_to_fill",
    label: "Time to fill",
    perspective: "process",
    excellent: 30,
    moderate: 45,
    poor: 60,
    weight: 0.25,
    direction: "lower",
  },
  {
    id: "turnover_rate",
    label: "Turnover rate",
    perspective: "process",
    excellent: 10,
    moderate: 20,
    poor: 30,
    weight: 0.3,
    direction: "lower",
  },
  {
    id: "absenteeism_rate",
    label: "Absenteeism",
    perspective: "process",
    excellent: 4,
    moderate: 8,
    poor: 12,
    weight: 0.2,
    direction: "lower",
  },
  {
    id: "review_coverage",
    label: "Review coverage",
    perspective: "process",
    excellent: 95,
    moderate: 80,
    poor: 65,
    weight: 0.25,
    direction: "higher",
  },
  {
    id: "training_effectiveness",
    label: "Training effectiveness",
    perspective: "learning",
    excellent: 20,
    moderate: 10,
    poor: 5,
    weight: 0.35,
    direction: "higher",
  },
  {
    id: "succession_pipeline",
    label: "Succession pipeline",
    perspective: "learning",
    excellent: 80,
    moderate: 55,
    poor: 30,
    weight: 0.25,
    direction: "higher",
  },
  {
    id: "hr_tech_score",
    label: "HR technology",
    perspective: "learning",
    excellent: 95,
    moderate: 60,
    poor: 20,
    weight: 0.2,
    direction: "higher",
  },
  {
    id: "dei_score_learning",
    label: "DEI score (learning)",
    perspective: "learning",
    excellent: 85,
    moderate: 65,
    poor: 20,
    weight: 0.2,
    direction: "higher",
  },
];

export type BenchmarkOverride = Partial<
  Pick<ScoringBenchmarkDef, "excellent" | "moderate" | "poor">
>;

export function benchmarksForPerspective(
  perspective: ScoringBenchmarkDef["perspective"],
  overrides: Record<string, BenchmarkOverride> = {}
): Array<Pick<ScoringBenchmarkDef, "excellent" | "moderate" | "poor" | "weight" | "direction">> {
  return SCORING_BENCHMARKS.filter((b) => b.perspective === perspective).map(
    (b) => ({
      excellent: overrides[b.id]?.excellent ?? b.excellent,
      moderate: overrides[b.id]?.moderate ?? b.moderate,
      poor: overrides[b.id]?.poor ?? b.poor,
      weight: b.weight,
      direction: b.direction,
    })
  );
}
