export const DECISION_AREAS = [
  { key: "recruitment", label: "Recruitment & Selection" },
  { key: "performance", label: "Performance Management" },
  { key: "training", label: "Training & Development" },
  { key: "relations", label: "Employee Relations" },
  { key: "compensation", label: "Compensation & Benefits" },
  { key: "org_design", label: "Org Design & Change" },
  { key: "dei", label: "DEI Initiatives" },
] as const;

export type DecisionAreaKey = (typeof DECISION_AREAS)[number]["key"];

export type PerformanceTeam = {
  id: string;
  name: string;
  industry: string;
  strategy: string;
  memberCount: number;
};

export type ScoreRow = {
  teamId: string;
  roundId: string;
  overall: number | null;
  financial: number | null;
  employee: number | null;
  process: number | null;
  learning: number | null;
  budgetSpent: number | null;
};

export type SpendRow = {
  teamId: string;
  roundId: string;
  submitted: boolean;
  total: number | null;
  areas: Record<DecisionAreaKey, number | null>;
};

export type PerformanceRound = {
  id: string;
  round_number: number;
  round_type: string;
  status: string;
  economy_condition?: string | null;
  opened_at?: string | null;
  closed_at?: string | null;
  label: string;
};

export type ClassPerformanceBundle = {
  teams: PerformanceTeam[];
  rounds: PerformanceRound[];
  scores: ScoreRow[];
  spends: SpendRow[];
};

export function avg(values: Array<number | null | undefined>) {
  const nums = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function fmtScore(value: number | null | undefined, decimals = 1) {
  return value == null || Number.isNaN(value) ? "—" : value.toFixed(decimals);
}

export function pctDelta(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
