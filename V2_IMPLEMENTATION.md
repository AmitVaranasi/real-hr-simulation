# V2 Implementation Progress

Branch: `feature/design-v2`  
Spec: `../DESIGN_DOCUMENT_V2.md`

## Completed on this branch

### Phase 1 — Engine & data layer
- [x] `src/lib/engine/roles.ts` — ROLE_GROUPS and helpers
- [x] `src/lib/engine/programs.ts` — program costs, conflict config, HR tech costs
- [x] `src/lib/engine/normalize.ts` — normalization engine
- [x] `src/lib/engine/types.ts` — V2 Decision model, new metrics, SimulationTrace
- [x] `src/lib/engine/defaults.ts` — V2 default decisions
- [x] `src/lib/engine/migrate-v1.ts` — load V1 DB rows into V2 shape
- [x] `src/lib/engine/metrics.ts` — Cooper formulas + industry multipliers
- [x] `src/lib/engine/budget.ts` — role-based recruitment, KPI cost, V2 budget
- [x] `src/lib/engine/financials.ts` — productivity-based revenue, turnover cost in profit
- [x] `src/lib/engine/engine.ts` — `runSimulationWithTrace`
- [x] `src/lib/engine/validation.ts` — V2 validation/warnings
- [x] `src/lib/engine/config.ts` — updated industry multipliers

### Phase 2 — Database & API (partial)
- [x] `supabase/migration-v2.sql` — run in Supabase SQL Editor
- [x] `src/lib/db/decisions.ts` — V2 serialization + V1 fallback
- [x] `src/lib/db/compute.ts` — trace on round compute
- [x] Compute API stores `trace_json` on outcomes

### Phase 3 — Decision UI (partial)
- [x] `DecisionForm.tsx` — 5 tabs (Recruitment, Performance, Training, Relations, Compensation+HR Tech)
- [x] Org Design & DEI input tabs removed (DEI computed in engine)
- [ ] `ScaffoldingText`, `MetricPreview` components (design doc §5)
- [ ] Dedicated subcomponents (`RolePositionEditor`, etc.)

### Phase 6 — Branding
- [x] Removed "Capsim-style" from landing + metadata

## Not yet implemented

### Phase 4 — Results & feedback UI
- [ ] Expanded `feedback.ts` (14 metrics + narrative templates)
- [ ] Round summary narrative on results/dashboard
- [ ] Dynamic BSC max scores from strategy config

### Phase 5 — Instructor tools
- [ ] `/sessions/[sessionId]/inspect` page
- [ ] `GET /api/sessions/[sessionId]/inspect/[teamId]/[roundId]`
- [ ] `FormulaInspector.tsx`

### Other
- [ ] PDF/Excel export columns for V2 metrics
- [ ] Full testing checklist (design doc §16)

## Deploy notes

1. Merge only after running `supabase/migration-v2.sql` on your Supabase project.
2. Existing decisions without JSONB columns still load via `migrate-v1.ts`.
3. Test `/simulate` and a full instructor round close after migration.
