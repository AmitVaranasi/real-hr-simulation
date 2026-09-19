-- Migration v13: formula expression editor storage.
--
-- PILOT_CHECKLIST.md listed the formula editor as deferred: instructors
-- could tune numeric parameters (simulation_config) but not the shape of a
-- formula. This adds storage for instructor-authored formula overrides,
-- following the exact pattern simulation_config / simulation_config_revisions
-- already established: a "current" row per formula plus an append-only
-- revision log, so restoring a prior version of a formula works the same
-- way restoring a prior config snapshot does.
--
-- formula_overrides holds the *parsed* expression (source text — the AST is
-- re-derived by parsing at load time, never trusted from storage) currently
-- in effect for a catalog formula id. formula_override_revisions is the
-- append-only history, mirroring simulation_config_revisions's shape
-- (config_json / note / created_by / source) with expression_source in
-- place of config_json.
--
-- Storing only the source expression (not a serialized AST) means every
-- read re-parses through the same lexer/parser/validator the editor used to
-- accept it — there is no separate "trusted" AST representation that could
-- drift from what the grammar actually accepts.

CREATE TABLE IF NOT EXISTS public.formula_overrides (
  formula_id TEXT PRIMARY KEY,
  expression_source TEXT NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.formula_override_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id TEXT NOT NULL,
  expression_source TEXT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'save'
    -- save | restore
);

CREATE INDEX IF NOT EXISTS formula_override_revisions_formula_id_created_at_idx
  ON public.formula_override_revisions (formula_id, created_at DESC);

ALTER TABLE public.formula_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_override_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read formula overrides" ON public.formula_overrides;
CREATE POLICY "Admins read formula overrides"
  ON public.formula_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins write formula overrides" ON public.formula_overrides;
CREATE POLICY "Admins write formula overrides"
  ON public.formula_overrides FOR ALL
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

DROP POLICY IF EXISTS "Admins read formula override revisions" ON public.formula_override_revisions;
CREATE POLICY "Admins read formula override revisions"
  ON public.formula_override_revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins write formula override revisions" ON public.formula_override_revisions;
CREATE POLICY "Admins write formula override revisions"
  ON public.formula_override_revisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
