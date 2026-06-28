import {
  getIndustryConfigResolved,
  getStrategyConfigResolved,
} from "./simulation-config";
import type { EconomyCondition, Industry, IndustryConfig, PriorState, Strategy, StrategyConfig } from "./types";

export const ECONOMY_MULTIPLIERS: Record<
  EconomyCondition,
  { revenue: number; expense: number }
> = {
  boom: { revenue: 1.1, expense: 1.03 },
  normal: { revenue: 1.0, expense: 1.0 },
  recession: { revenue: 0.9, expense: 1.05 },
};

export const INDUSTRY_CONFIGS: Record<Industry, IndustryConfig> = {
  Manufacturing: {
    industry: "Manufacturing",
    base_headcount: 300,
    base_revenue: 50_000_000,
    base_market_salary: 55_000,
    base_stock_price: 25,
    base_market_share: 15,
    base_profit_margin: 12,
    base_turnover: 15,
    base_satisfaction: 65,
    base_engagement: 60,
    module_multipliers: {
      recruitment: 1.05,
      performance: 1.25,
      training: 1.3,
      relations: 1.2,
      compensation: 1.1,
      org_design: 1.0,
      dei: 0.9,
    },
    constraints: [
      {
        condition: "training_effectiveness < 5",
        effect: "productivity_penalty",
        value: 0.1,
      },
    ],
  },
  Service: {
    industry: "Service",
    base_headcount: 250,
    base_revenue: 35_000_000,
    base_market_salary: 45_000,
    base_stock_price: 20,
    base_market_share: 12,
    base_profit_margin: 10,
    base_turnover: 18,
    base_satisfaction: 60,
    base_engagement: 58,
    module_multipliers: {
      recruitment: 1.15,
      performance: 1.1,
      training: 1.2,
      relations: 1.3,
      compensation: 1.05,
      org_design: 1.0,
      dei: 1.05,
    },
    constraints: [
      {
        condition: "employee_satisfaction < 60",
        effect: "revenue_penalty",
        value: 0.05,
      },
    ],
  },
  "High-Tech": {
    industry: "High-Tech",
    base_headcount: 150,
    base_revenue: 40_000_000,
    base_market_salary: 95_000,
    base_stock_price: 40,
    base_market_share: 10,
    base_profit_margin: 18,
    base_turnover: 12,
    base_satisfaction: 70,
    base_engagement: 65,
    module_multipliers: {
      recruitment: 1.35,
      performance: 1.05,
      training: 1.25,
      relations: 1.0,
      compensation: 1.4,
      org_design: 1.2,
      dei: 1.1,
    },
    constraints: [
      {
        condition: "salary_below_95_pct_market",
        effect: "turnover_spike",
        value: 8,
      },
    ],
  },
  Banking: {
    industry: "Banking",
    base_headcount: 200,
    base_revenue: 60_000_000,
    base_market_salary: 75_000,
    base_stock_price: 35,
    base_market_share: 14,
    base_profit_margin: 15,
    base_turnover: 10,
    base_satisfaction: 62,
    base_engagement: 58,
    module_multipliers: {
      recruitment: 1.1,
      performance: 1.35,
      training: 1.2,
      relations: 1.0,
      compensation: 1.25,
      org_design: 1.05,
      dei: 1.1,
    },
    constraints: [
      {
        condition: "review_coverage < 80",
        effect: "process_penalty",
        value: 5,
      },
    ],
  },
  Retail: {
    industry: "Retail",
    base_headcount: 400,
    base_revenue: 45_000_000,
    base_market_salary: 38_000,
    base_stock_price: 18,
    base_market_share: 11,
    base_profit_margin: 6,
    base_turnover: 25,
    base_satisfaction: 55,
    base_engagement: 50,
    module_multipliers: {
      recruitment: 1.25,
      performance: 1.0,
      training: 0.95,
      relations: 1.15,
      compensation: 1.1,
      org_design: 0.85,
      dei: 1.0,
    },
    constraints: [
      {
        condition: "time_to_fill > 45",
        effect: "process_penalty",
        value: 5,
      },
    ],
  },
};

export const STRATEGY_CONFIGS: Record<Strategy, StrategyConfig> = {
  "Cost Leadership": {
    strategy: "Cost Leadership",
    bsc_weights: { financial: 30, employee: 20, process: 30, learning: 20 },
    bonus_conditions: [
      {
        condition: "budget_adherence > 95 AND compensation_ratio < 30",
        perspective: "financial",
        points: 3,
      },
    ],
  },
  Differentiation: {
    strategy: "Differentiation",
    bsc_weights: { financial: 20, employee: 30, process: 20, learning: 30 },
    bonus_conditions: [
      {
        condition: "training_roi > 15 AND retention > 88",
        perspective: "learning",
        points: 3,
      },
    ],
  },
  Innovation: {
    strategy: "Innovation",
    bsc_weights: { financial: 20, employee: 20, process: 25, learning: 35 },
    bonus_conditions: [
      {
        condition: "hr_tech_level == 2 AND succession_pipeline > 70",
        perspective: "learning",
        points: 3,
      },
    ],
  },
  "Customer Intimacy": {
    strategy: "Customer Intimacy",
    bsc_weights: { financial: 20, employee: 35, process: 25, learning: 20 },
    bonus_conditions: [
      {
        condition: "engagement_level > 80 AND employee_satisfaction > 80",
        perspective: "employee",
        points: 3,
      },
    ],
  },
  Focus: {
    strategy: "Focus",
    bsc_weights: { financial: 25, employee: 25, process: 25, learning: 25 },
    bonus_conditions: [
      {
        condition: "cost_per_hire < 5000 AND training_effectiveness > 15",
        perspective: "process",
        points: 3,
      },
    ],
  },
};

export function priorStateFromIndustry(
  industry: Industry,
  overrides: Partial<PriorState> = {}
): PriorState {
  const c = INDUSTRY_CONFIGS[industry];
  return {
    headcount: c.base_headcount,
    revenue: c.base_revenue,
    stock_price: c.base_stock_price,
    market_share: c.base_market_share,
    profit_margin: c.base_profit_margin,
    satisfaction: c.base_satisfaction,
    engagement: c.base_engagement,
    turnover_rate: c.base_turnover,
    ...overrides,
  };
}

export function getIndustryConfig(industry: Industry): IndustryConfig {
  return getIndustryConfigResolved(industry);
}

export function getStrategyConfig(strategy: Strategy): StrategyConfig {
  return getStrategyConfigResolved(strategy);
}
