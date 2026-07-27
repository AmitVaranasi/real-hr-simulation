-- Full Admin — run after migration-v5-admin.sql
-- Audit log, config revisions, profile disable flags, formula notes

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

COMMENT ON COLUMN public.profiles.disabled_at IS
  'Set when an admin disables the account (mirrors Auth ban)';
COMMENT ON COLUMN public.profiles.disabled_reason IS
  'Optional reason shown in admin User Management';

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON public.admin_audit_log (created_at DESC);

CREATE TABLE IF NOT EXISTS public.simulation_config_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_json JSONB NOT NULL,
  note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'save'
    -- save | restore | reset | manual
);

CREATE INDEX IF NOT EXISTS simulation_config_revisions_created_at_idx
  ON public.simulation_config_revisions (created_at DESC);

-- Optional admin notes / expression documentation for formula catalog entries
CREATE TABLE IF NOT EXISTS public.formula_notes (
  formula_id TEXT PRIMARY KEY,
  expression_override TEXT,
  notes TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_config_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log"
  ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins read config revisions" ON public.simulation_config_revisions;
CREATE POLICY "Admins read config revisions"
  ON public.simulation_config_revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins read formula notes" ON public.formula_notes;
CREATE POLICY "Admins read formula notes"
  ON public.formula_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins write formula notes" ON public.formula_notes;
CREATE POLICY "Admins write formula notes"
  ON public.formula_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Writes to audit/revisions go through service role (API), so no insert policies for anon.
