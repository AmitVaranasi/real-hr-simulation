-- Iteration #4: Org Design & DEI decision persistence (Team + Round)
-- Costs affect discretionary budget display; structural scoring deferred.

alter table public.decisions
  add column if not exists org_design_json jsonb,
  add column if not exists dei_initiatives_json jsonb;

comment on column public.decisions.org_design_json is
  'Org Design & Change selections: structure, span, process focus, change capability, collaboration';

comment on column public.decisions.dei_initiatives_json is
  'DEI Initiatives portfolio levels for five Version-1 decision categories';
