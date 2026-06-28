import type { Industry } from "./types";

export type BudgetModuleKey =
  | "recruitment"
  | "performance"
  | "training"
  | "relations"
  | "compensation"
  | "org_design";

export interface ModuleNormRange {
  min?: number;
  max?: number;
  suggested?: [number, number];
  label: string;
}

export type IndustryNormProfile = Partial<
  Record<BudgetModuleKey, ModuleNormRange>
> & {
  benefits_pct_of_comp?: { min: number; max: number };
};

/** Suggested % of total discretionary HR spend by module (V3 Cooper ranges). */
export const DEFAULT_INDUSTRY_NORMS: Record<Industry, IndustryNormProfile> = {
  Manufacturing: {
    training: { min: 3, max: 8, suggested: [5, 8], label: "Training" },
    recruitment: { min: 15, max: 26, suggested: [15, 22], label: "Recruitment" },
    performance: { max: 5, suggested: [2, 5], label: "Performance" },
    compensation: { min: 60, max: 80, suggested: [65, 75], label: "Compensation" },
    benefits_pct_of_comp: { min: 20, max: 40 },
  },
  Service: {
    training: { min: 3, max: 8, suggested: [5, 7], label: "Training" },
    recruitment: { min: 15, max: 26, suggested: [18, 24], label: "Recruitment" },
    performance: { max: 5, suggested: [2, 4], label: "Performance" },
    compensation: { min: 60, max: 80, suggested: [62, 72], label: "Compensation" },
    benefits_pct_of_comp: { min: 20, max: 40 },
  },
  "High-Tech": {
    training: { min: 3, max: 8, suggested: [5, 7], label: "Training" },
    recruitment: { min: 15, max: 26, suggested: [20, 26], label: "Recruitment" },
    performance: { max: 5, suggested: [2, 4], label: "Performance" },
    compensation: { min: 70, max: 80, suggested: [70, 78], label: "Compensation" },
    benefits_pct_of_comp: { min: 20, max: 40 },
  },
  Banking: {
    training: { min: 3, max: 8, suggested: [4, 6], label: "Training" },
    recruitment: { min: 15, max: 24, suggested: [15, 20], label: "Recruitment" },
    performance: { max: 5, suggested: [3, 5], label: "Performance" },
    compensation: { min: 60, max: 80, suggested: [65, 75], label: "Compensation" },
    benefits_pct_of_comp: { min: 20, max: 40 },
  },
  Retail: {
    training: { min: 3, max: 8, suggested: [5, 6], label: "Training" },
    recruitment: { min: 20, max: 26, suggested: [20, 26], label: "Recruitment" },
    performance: { max: 5, suggested: [2, 4], label: "Performance" },
    compensation: { min: 60, max: 78, suggested: [60, 70], label: "Compensation" },
    benefits_pct_of_comp: { min: 20, max: 35 },
  },
};

export const MODULE_TAB_GUIDANCE: Record<string, BudgetModuleKey[]> = {
  Recruitment: ["recruitment"],
  Performance: ["performance"],
  Training: ["training"],
  Relations: ["relations"],
  Compensation: ["compensation", "org_design"],
};

export function formatNormRange(norm: ModuleNormRange): string {
  if (norm.suggested) {
    return `${norm.suggested[0]}%–${norm.suggested[1]}% of HR budget`;
  }
  if (norm.min != null && norm.max != null) {
    return `${norm.min}%–${norm.max}% of HR budget`;
  }
  if (norm.max != null) {
    return `Up to ${norm.max}% of HR budget`;
  }
  if (norm.min != null) {
    return `At least ${norm.min}% of HR budget`;
  }
  return "";
}
