import type { RoleCompensation, RolePerformance, SalaryBand } from "./types";

export interface RoleGroup {
  id: string;
  label: string;
  description: string;
  defaultHeadcountPct: number;
  defaultMarketSalaryMult: number;
  recruitCostMult: number;
  timeToFillBase: number;
}

export const ROLE_GROUPS: RoleGroup[] = [
  {
    id: "entry",
    label: "Entry-Level / Support",
    description:
      "Administrative assistants, clerks, junior analysts, customer service reps",
    defaultHeadcountPct: 30,
    defaultMarketSalaryMult: 0.65,
    recruitCostMult: 0.6,
    timeToFillBase: 20,
  },
  {
    id: "professional",
    label: "Professional / Individual Contributor",
    description: "Accountants, engineers, analysts, specialists",
    defaultHeadcountPct: 35,
    defaultMarketSalaryMult: 1.0,
    recruitCostMult: 1.0,
    timeToFillBase: 35,
  },
  {
    id: "technical",
    label: "Technical / Specialist",
    description:
      "Software engineers, data scientists, compliance officers, skilled trades",
    defaultHeadcountPct: 15,
    defaultMarketSalaryMult: 1.35,
    recruitCostMult: 1.5,
    timeToFillBase: 45,
  },
  {
    id: "manager",
    label: "Manager / Supervisor",
    description: "Department managers, team leads, project managers",
    defaultHeadcountPct: 15,
    defaultMarketSalaryMult: 1.5,
    recruitCostMult: 1.3,
    timeToFillBase: 40,
  },
  {
    id: "executive",
    label: "Senior / Executive",
    description: "Directors, VPs, C-suite",
    defaultHeadcountPct: 5,
    defaultMarketSalaryMult: 2.5,
    recruitCostMult: 2.0,
    timeToFillBase: 60,
  },
];

export function getRoleById(roleId: string): RoleGroup | undefined {
  return ROLE_GROUPS.find((r) => r.id === roleId);
}

export function roleHeadcount(totalHeadcount: number, roleId: string): number {
  const role = getRoleById(roleId);
  if (!role) return 0;
  return Math.round(totalHeadcount * (role.defaultHeadcountPct / 100));
}

export function totalHires(
  positions: Array<{ role_id: string; count: number }>
): number {
  return positions.reduce((sum, p) => sum + p.count, 0);
}

export function weightedAvgSalaryBand(
  roleCompensation: RoleCompensation[]
): number {
  let weighted = 0;
  let weight = 0;
  for (const rc of roleCompensation) {
    const role = getRoleById(rc.role_id);
    if (!role) continue;
    weighted += rc.salary_band * role.defaultHeadcountPct;
    weight += role.defaultHeadcountPct;
  }
  return weight > 0 ? weighted / weight : 0;
}

export function avgPerformanceCriteria(
  rolePerformance: RolePerformance[],
  key: keyof Pick<
    RolePerformance,
    "productivity" | "teamwork" | "leadership" | "communication"
  >
): number {
  if (rolePerformance.length === 0) return 5;
  const sum = rolePerformance.reduce((s, rp) => s + rp[key], 0);
  return sum / rolePerformance.length;
}

export function salaryBandToMarketPct(band: SalaryBand): number {
  return 100 + band;
}

export function computeVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return (
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  );
}
