export interface Profile {
  id: string;
  role: "instructor" | "student" | "admin";
  display_name: string;
  created_at: string;
}

export interface Session {
  id: string;
  instructor_id: string;
  name: string;
  course_code: string | null;
  semester: string | null;
  rounds_total: number;
  practice_rounds: number;
  status: "setup" | "active" | "complete";
  created_at: string;
}

export interface Team {
  id: string;
  session_id: string;
  name: string;
  join_code: string;
  industry: Industry | null;
  strategy: Strategy | null;
  headcount: number | null;
  revenue: number | null;
  stock_price: number | null;
  market_share: number | null;
  profit_margin: number | null;
  satisfaction: number | null;
  engagement: number | null;
  turnover_rate: number | null;
  budget_carryover: number;
}

export type Industry =
  | "Manufacturing"
  | "Service"
  | "High-Tech"
  | "Banking"
  | "Retail";

export type Strategy =
  | "Cost Leadership"
  | "Differentiation"
  | "Innovation"
  | "Customer Intimacy"
  | "Focus";

export type EconomyCondition = "boom" | "normal" | "recession";

export type SalaryBand = -20 | -10 | 0 | 10 | 20;
export type BonusTier = 5 | 10 | 15;
export type ConflictApproach = "mediation" | "disciplinary" | "coaching";
export type DevelopmentalProgram =
  | "Leadership Development"
  | "Time Management"
  | "Managerial Skills"
  | "Technical Skills"
  | "Compliance"
  | "Project Management";

export type OrganizationalStructure =
  | "Functional"
  | "Divisional"
  | "Matrix"
  | "Team-Based"
  | "Flat";

export type ProcessFocus =
  | "Efficiency"
  | "Quality"
  | "Innovation"
  | "Customer Responsiveness"
  | "Agility";

export type InvestmentLevel =
  | "Minimal"
  | "Basic"
  | "Moderate"
  | "Strong"
  | "Advanced";

export type CollaborationEnablement =
  | "Limited"
  | "Standard"
  | "Enhanced"
  | "Highly Integrated";

export interface PositionToFill {
  role_id: string;
  count: number;
}

export interface RoleCompensation {
  role_id: string;
  salary_band: SalaryBand;
}

export interface RolePerformance {
  role_id: string;
  productivity: number;
  teamwork: number;
  leadership: number;
  communication: number;
}

export interface Decision {
  id?: string;
  team_id?: string;
  round_id?: string;
  submitted_by?: string | null;
  submitted_at?: string | null;
  is_submitted?: boolean;

  positions_to_fill: PositionToFill[];
  screening_rigor: 1 | 2 | 3;
  diversity_goal_pct: number;
  onboarding_investment: number;

  review_frequency: 1 | 2 | 4;
  role_performance: RolePerformance[];
  feedback_360: boolean;

  developmental_programs: DevelopmentalProgram[];
  pct_employees_trained: number;
  training_budget_per_ee: number;
  succession_investment: number;

  engagement_investment: number;
  conflict_approach: ConflictApproach;
  flexibility_level: 0 | 1 | 2;
  voice_mechanisms: 0 | 1 | 2;

  role_compensation: RoleCompensation[];
  benefits_pct: number;
  bonus_tier: BonusTier;
  equity_level: 0 | 1 | 2;

  hr_tech_level: 0 | 1 | 2;

  /** Org Design & Change (Decision 6) — stored now; structural scoring later */
  organizational_structure: OrganizationalStructure;
  span_of_control: number;
  process_focus: ProcessFocus;
  change_management_capability: InvestmentLevel;
  collaboration_enablement: CollaborationEnablement;

  /** DEI Initiatives (Decision 7) — portfolio levels; scoring later */
  dei_diverse_recruitment: InvestmentLevel;
  dei_equity_practices: InvestmentLevel;
  dei_inclusion_initiatives: InvestmentLevel;
  dei_training_education: InvestmentLevel;
  dei_accessibility_support: InvestmentLevel;
}

export interface PriorState {
  headcount: number;
  revenue: number;
  stock_price: number;
  market_share: number;
  profit_margin: number;
  satisfaction: number;
  engagement: number;
  turnover_rate: number;
}

export interface IndustryConfig {
  industry: Industry;
  base_headcount: number;
  base_revenue: number;
  base_market_salary: number;
  base_stock_price: number;
  base_market_share: number;
  base_profit_margin: number;
  base_turnover: number;
  base_satisfaction: number;
  base_engagement: number;
  module_multipliers: {
    recruitment: number;
    performance: number;
    training: number;
    relations: number;
    compensation: number;
    org_design: number;
    dei: number;
  };
  constraints: Array<{
    condition: string;
    effect: string;
    value: number;
  }>;
}

export interface StrategyConfig {
  strategy: Strategy;
  bsc_weights: {
    financial: number;
    employee: number;
    process: number;
    learning: number;
  };
  bonus_conditions: Array<{
    condition: string;
    perspective: "financial" | "employee" | "process" | "learning";
    points: number;
  }>;
}

export interface HRMetrics {
  cost_per_hire: number;
  time_to_fill: number;
  turnover_rate: number;
  employee_satisfaction: number;
  training_roi: number;
  engagement_level: number;
  dei_score: number;
  absenteeism_rate: number;
  review_coverage: number;
  training_effectiveness: number;
  succession_pipeline: number;
  hr_tech_score: number;
  compensation_ratio: number;
  budget_adherence: number;
  productivity: number;
  hiring_quality: number;
  turnover_cost: number;
}

export interface FinancialMetrics {
  headcount: number;
  revenue: number;
  profit: number;
  cashflow: number;
  stock_price: number;
  market_share: number;
  profit_margin: number;
  total_compensation: number;
  total_budget_spent: number;
  turnover_cost: number;
}

export interface BSCScores {
  score_financial: number;
  score_employee: number;
  score_process: number;
  score_learning: number;
  total_score: number;
  strategy_bonus: number;
  industry_penalty: number;
}

export interface MetricFeedback {
  metric_name: string;
  display_name: string;
  value: number;
  formatted_value: string;
  benchmark_excellent: number;
  benchmark_moderate: number;
  benchmark_poor: number;
  status: "excellent" | "moderate" | "poor" | "critical";
  feedback_text: string;
  perspective: "financial" | "employee" | "process" | "learning";
}

export interface PerspectiveFeedback {
  perspective: "financial" | "employee" | "process" | "learning";
  display_name: string;
  score: number;
  max_score: number;
  summary: string;
  top_strength: string;
  top_weakness: string;
}

export interface FeedbackPayload {
  metrics: MetricFeedback[];
  perspectives: PerspectiveFeedback[];
  round_summary?: string;
  learning_insights?: {
    went_well: string[];
    hurt_performance: string[];
    next_round: string[];
    causal_factors: string[];
  };
}

export interface SimulationTrace {
  budget_breakdown: BudgetBreakdown;
  raw_metrics: HRMetrics;
  normalized_metrics: Record<string, number>;
  industry_adjusted_metrics: HRMetrics;
  productivity_components: {
    training: number;
    engagement: number;
    retention: number;
    leadership: number;
    technology: number;
    total: number;
  };
  financial_cascade: {
    revenue: number;
    total_compensation: number;
    turnover_cost: number;
    other_hr_costs: number;
    non_hr_expenses: number;
    profit: number;
  };
  bsc_component_scores: {
    financial_components: number[];
    employee_components: number[];
    process_components: number[];
    learning_components: number[];
  };
  bsc_scores: BSCScores;
  feedback: FeedbackPayload;
}

export interface Outcome {
  hr_metrics: HRMetrics;
  financial_metrics: FinancialMetrics;
  bsc_scores: BSCScores;
  feedback: FeedbackPayload;
}

export interface BudgetBreakdown {
  recruitment_spend: number;
  performance_spend: number;
  training_spend: number;
  relations_spend: number;
  compensation_spend: number;
  org_design_spend: number;
  dei_spend: number;
  total_spend: number;
  available_budget: number;
  remaining: number;
  adherence_pct: number;
}

export interface Warning {
  severity: "info" | "warning" | "critical";
  module: string;
  message: string;
}

export interface Reflection {
  id: string;
  team_id: string;
  round_id: string;
  submitted_by: string;
  content: string;
  submitted_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  industry: Industry | string;
  strategy: Strategy | string;
  round_scores: number[];
  average_score: number;
  latest_score: number;
  latest_revenue: number;
  latest_stock_price: number;
}
