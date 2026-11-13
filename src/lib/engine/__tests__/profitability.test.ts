import { describe, expect, it } from "vitest";
import { computeRecruitmentCost, computeTrainingSpend } from "../budget";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "../config";
import { createDefaultDecision } from "../defaults";
import { runSimulationWithTrace } from "../engine";
import {
  baselinePeopleCosts,
  computeTotalCompensation,
  nonHrExpenseRatio,
} from "../financials";
import { CONFLICT_CONFIG, HR_TECH_ANNUAL_COST } from "../programs";
import { withDerivedTrainingBudget } from "../training";
import type { Industry } from "../types";

const INDUSTRIES: Industry[] = [
  "Manufacturing",
  "Service",
  "High-Tech",
  "Banking",
  "Retail",
];

function runDefaults(industry: Industry) {
  const config = getIndustryConfig(industry);
  return runSimulationWithTrace(
    createDefaultDecision(),
    priorStateFromIndustry(industry),
    config,
    getStrategyConfig("Focus"),
    "normal"
  );
}

describe("profitability — payroll is deducted once", () => {
  it.each(INDUSTRIES)(
    "%s: non-HR expenses exclude the people costs the base margin assumes",
    (industry) => {
      const config = getIndustryConfig(industry);
      const ratio = nonHrExpenseRatio(config);
      const peopleShare = baselinePeopleCosts(config).total / config.base_revenue;

      // Profit + people + non-HR account for all of revenue at the baseline.
      expect(ratio + peopleShare + config.base_profit_margin / 100).toBeCloseTo(
        1,
        10
      );
      expect(ratio).toBeGreaterThan(0);
      // The old rule charged `1 - margin`, which still contained payroll.
      expect(ratio).toBeLessThan(1 - config.base_profit_margin / 100);
    }
  );

  it.each(INDUSTRIES)(
    "%s: a company at its starting state earns its base margin",
    (industry) => {
      const config = getIndustryConfig(industry);
      const profit =
        config.base_revenue -
        baselinePeopleCosts(config).total -
        config.base_revenue * nonHrExpenseRatio(config);
      expect((profit / config.base_revenue) * 100).toBeCloseTo(
        config.base_profit_margin,
        8
      );
    }
  );

  it.each(INDUSTRIES)(
    "%s: default decisions in a normal economy stay near the base margin",
    (industry) => {
      const config = getIndustryConfig(industry);
      const { outcome } = runDefaults(industry);
      const margin = outcome.financial_metrics.profit_margin;

      // Before the correction every industry lost 19–46% of revenue here.
      expect(margin).toBeGreaterThan(0);
      expect(Math.abs(margin - config.base_profit_margin)).toBeLessThan(5);
    }
  );

  it.each(INDUSTRIES)(
    "%s: profit is revenue minus each cost, counted once",
    (industry) => {
      const config = getIndustryConfig(industry);
      const { outcome, trace } = runDefaults(industry);
      const f = outcome.financial_metrics;
      const d = withDerivedTrainingBudget(createDefaultDecision());

      const expected =
        f.revenue -
        computeTotalCompensation(d, f.headcount, config.base_market_salary) -
        computeTrainingSpend(d, f.headcount) -
        computeRecruitmentCost(d, config) -
        f.turnover_cost -
        (d.engagement_investment +
          CONFLICT_CONFIG[d.conflict_approach].cost +
          HR_TECH_ANNUAL_COST[d.hr_tech_level]) -
        trace.financial_cascade.non_hr_expenses;

      expect(f.profit).toBeCloseTo(expected, 4);
    }
  );
});
