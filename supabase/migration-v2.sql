-- V2 Migration: Run in Supabase SQL Editor after backup

ALTER TABLE public.decisions
  ADD COLUMN IF NOT EXISTS positions_to_fill_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS role_compensation_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS role_performance_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS developmental_programs JSONB DEFAULT '["Technical Skills"]'::jsonb,
  ADD COLUMN IF NOT EXISTS conflict_approach TEXT DEFAULT 'mediation'
    CHECK (conflict_approach IN ('mediation', 'disciplinary', 'coaching')),
  ADD COLUMN IF NOT EXISTS benefits_pct NUMERIC DEFAULT 10
    CHECK (benefits_pct BETWEEN 6 AND 20),
  ADD COLUMN IF NOT EXISTS bonus_tier INTEGER DEFAULT 5
    CHECK (bonus_tier IN (5, 10, 15));

ALTER TABLE public.outcomes
  ADD COLUMN IF NOT EXISTS productivity NUMERIC,
  ADD COLUMN IF NOT EXISTS hiring_quality NUMERIC,
  ADD COLUMN IF NOT EXISTS turnover_cost NUMERIC,
  ADD COLUMN IF NOT EXISTS trace_json JSONB;

COMMENT ON COLUMN public.decisions.recruitment_budget_per_hire IS 'V1 DEPRECATED — use positions_to_fill_json';
COMMENT ON COLUMN public.decisions.salary_vs_market_pct IS 'V1 DEPRECATED — use role_compensation_json';
