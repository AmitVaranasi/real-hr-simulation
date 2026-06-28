import type { Decision, Warning } from "./types";
import { computeBudgetBreakdown } from "./budget";
import { budgetModuleShares } from "./budget-shares";
import { generateBudgetRecommendations } from "./explainability";
import {
  DEFAULT_INDUSTRY_NORMS,
  type BudgetModuleKey,
} from "./industry-norms";
import { getIndustryNormsResolved } from "./simulation-config";
import { totalHires, weightedAvgSalaryBand } from "./roles";
import type { Industry, IndustryConfig } from "./types";

export function validateDecision(d: Decision): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const hires = totalHires(d.positions_to_fill);

  if (hires < 0 || hires > 50) {
    errors.push("Total positions to fill must be between 0 and 50");
  }
  if (d.diversity_goal_pct < 0 || d.diversity_goal_pct > 50) {
    errors.push("Diversity goal must be between 0% and 50%");
  }
  if (d.pct_employees_trained < 0 || d.pct_employees_trained > 50) {
    errors.push("% employees trained must be between 0% and 50%");
  }
  if (d.benefits_pct < 6 || d.benefits_pct > 20) {
    errors.push("Benefits percentage must be between 6% and 20%");
  }
  if (![5, 10, 15].includes(d.bonus_tier)) {
    errors.push("Bonus tier must be 5%, 10%, or 15%");
  }

  return { valid: errors.length === 0, errors };
}

export function generateWarnings(
  d: Decision,
  headcount: number,
  marketSalary: number,
  industryConfig: IndustryConfig,
  industry: Industry = industryConfig.industry
): Warning[] {
  const warnings: Warning[] = [];
  const budget = computeBudgetBreakdown(
    d,
    headcount,
    marketSalary,
    industryConfig
  );
  const avgBand = weightedAvgSalaryBand(d.role_compensation);
  const norms = getIndustryNormsResolved();
  const shares = budgetModuleShares(budget);

  if (avgBand < -10) {
    warnings.push({
      severity: "warning",
      module: "Compensation",
      message:
        "Below-market salary bands may increase turnover, especially in High-Tech.",
    });
  }

  if (d.pct_employees_trained > 0 && d.pct_employees_trained < 15) {
    warnings.push({
      severity: "warning",
      module: "Training",
      message:
        "Very low training coverage may reduce productivity and ROI.",
    });
  }

  const industryNorms = norms[industry] ?? DEFAULT_INDUSTRY_NORMS[industry];
  for (const key of Object.keys(shares) as BudgetModuleKey[]) {
    const norm = industryNorms[key];
    if (!norm) continue;
    const pct = shares[key];
    if (norm.max != null && pct > norm.max + 1) {
      warnings.push({
        severity: "warning",
        module: norm.label ?? key,
        message: `Your ${(norm.label ?? key).toLowerCase()} investment (${pct.toFixed(1)}% of HR budget) is significantly above industry norms (max ~${norm.max}%).`,
      });
    }
    if (norm.min != null && pct < norm.min - 1 && budget.total_spend > 0) {
      warnings.push({
        severity: "warning",
        module: norm.label ?? key,
        message: `Your ${(norm.label ?? key).toLowerCase()} spending (${pct.toFixed(1)}% of HR budget) is below industry minimums (~${norm.min}%) and may create operational challenges.`,
      });
    }
  }

  if (industryNorms.benefits_pct_of_comp) {
    const { min, max } = industryNorms.benefits_pct_of_comp;
    if (d.benefits_pct < min - 2) {
      warnings.push({
        severity: "warning",
        module: "Compensation",
        message:
          "Benefits level is below typical industry norms relative to salary.",
      });
    }
    if (d.benefits_pct > max + 2) {
      warnings.push({
        severity: "warning",
        module: "Compensation",
        message:
          "Your benefits spending may reduce profitability relative to industry norms.",
      });
    }
  }

  for (const msg of generateBudgetRecommendations(
    budget,
    norms,
    industry,
    d.benefits_pct
  )) {
    if (!warnings.some((w) => w.message === msg)) {
      warnings.push({
        severity: msg.includes("over the discretionary") ? "critical" : "warning",
        module: "Budget",
        message: msg,
      });
    }
  }

  if (budget.remaining < 0) {
    warnings.push({
      severity: "critical",
      module: "Budget",
      message: `Overspent discretionary budget by ${Math.abs(budget.remaining).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}.`,
    });
  }

  return warnings;
}
