-- V3: Professor-editable simulation parameters (run after migration-v2.sql)

CREATE TABLE IF NOT EXISTS public.simulation_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  config_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

INSERT INTO public.simulation_config (id, config_json)
VALUES ('global', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.simulation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors read simulation config"
  ON public.simulation_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'instructor'
    )
  );

CREATE POLICY "Instructors update simulation config"
  ON public.simulation_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'instructor'
    )
  );
