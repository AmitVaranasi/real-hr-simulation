-- Real HR Simulation — run in Supabase SQL Editor (in order)

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('instructor', 'student')),
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  course_code TEXT,
  semester TEXT,
  rounds_total INTEGER NOT NULL DEFAULT 3,
  practice_rounds INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'setup'
    CHECK (status IN ('setup', 'active', 'complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  industry TEXT CHECK (industry IN (
    'Manufacturing', 'Service', 'High-Tech', 'Banking', 'Retail'
  )),
  strategy TEXT CHECK (strategy IN (
    'Cost Leadership', 'Differentiation', 'Innovation',
    'Customer Intimacy', 'Focus'
  )),
  headcount INTEGER,
  revenue NUMERIC,
  stock_price NUMERIC,
  market_share NUMERIC,
  profit_margin NUMERIC,
  satisfaction NUMERIC,
  engagement NUMERIC,
  turnover_rate NUMERIC,
  budget_carryover NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  round_type TEXT NOT NULL CHECK (round_type IN ('practice', 'competitive')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'open', 'closed')),
  economy_condition TEXT NOT NULL DEFAULT 'normal'
    CHECK (economy_condition IN ('boom', 'normal', 'recession')),
  leaderboard_released BOOLEAN NOT NULL DEFAULT FALSE,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  UNIQUE(session_id, round_number)
);

CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  recruitment_budget_per_hire NUMERIC DEFAULT 5000,
  positions_to_fill INTEGER DEFAULT 10,
  screening_rigor INTEGER DEFAULT 2 CHECK (screening_rigor IN (1, 2, 3)),
  diversity_goal_pct NUMERIC DEFAULT 15,
  onboarding_investment NUMERIC DEFAULT 500,
  review_frequency INTEGER DEFAULT 2 CHECK (review_frequency IN (1, 2, 4)),
  performance_pay_pct NUMERIC DEFAULT 5,
  kpi_investment NUMERIC DEFAULT 5000,
  feedback_360 BOOLEAN DEFAULT FALSE,
  pip_investment NUMERIC DEFAULT 3000,
  training_budget_per_ee NUMERIC DEFAULT 800,
  pct_employees_trained NUMERIC DEFAULT 60,
  training_focus TEXT DEFAULT 'Technical',
  succession_investment NUMERIC DEFAULT 5000,
  engagement_investment NUMERIC DEFAULT 5000,
  conflict_budget NUMERIC DEFAULT 5000,
  flexibility_level INTEGER DEFAULT 1 CHECK (flexibility_level IN (0, 1, 2)),
  voice_mechanisms INTEGER DEFAULT 1 CHECK (voice_mechanisms IN (0, 1, 2)),
  salary_vs_market_pct NUMERIC DEFAULT 100,
  benefits_per_ee NUMERIC DEFAULT 3000,
  bonus_pool_pct NUMERIC DEFAULT 3,
  equity_level INTEGER DEFAULT 0 CHECK (equity_level IN (0, 1, 2)),
  span_of_control INTEGER DEFAULT 8,
  restructuring_investment NUMERIC DEFAULT 0,
  change_comm_effort INTEGER DEFAULT 3 CHECK (change_comm_effort BETWEEN 1 AND 5),
  hr_tech_level INTEGER DEFAULT 0 CHECK (hr_tech_level IN (0, 1, 2)),
  dei_training_per_ee NUMERIC DEFAULT 100,
  inclusive_hiring_investment NUMERIC DEFAULT 3000,
  erg_budget NUMERIC DEFAULT 2000,
  public_commitment_level INTEGER DEFAULT 1 CHECK (public_commitment_level IN (0, 1, 2)),
  UNIQUE(team_id, round_id)
);

CREATE TABLE public.outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cost_per_hire NUMERIC,
  time_to_fill NUMERIC,
  turnover_rate NUMERIC,
  employee_satisfaction NUMERIC,
  training_roi NUMERIC,
  engagement_level NUMERIC,
  dei_score NUMERIC,
  absenteeism_rate NUMERIC,
  review_coverage NUMERIC,
  training_effectiveness NUMERIC,
  succession_pipeline NUMERIC,
  hr_tech_score NUMERIC,
  compensation_ratio NUMERIC,
  budget_adherence NUMERIC,
  headcount INTEGER,
  revenue NUMERIC,
  profit NUMERIC,
  cashflow NUMERIC,
  stock_price NUMERIC,
  market_share NUMERIC,
  profit_margin NUMERIC,
  total_compensation NUMERIC,
  total_budget_spent NUMERIC,
  score_financial NUMERIC,
  score_employee NUMERIC,
  score_process NUMERIC,
  score_learning NUMERIC,
  total_score NUMERIC,
  strategy_bonus NUMERIC NOT NULL DEFAULT 0,
  industry_penalty NUMERIC NOT NULL DEFAULT 0,
  instructor_override NUMERIC,
  override_reason TEXT,
  feedback_json JSONB,
  UNIQUE(team_id, round_id)
);

CREATE TABLE public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, round_id)
);

-- Enable RLS and add policies from DESIGN_DOCUMENT.md sections 6–7.
