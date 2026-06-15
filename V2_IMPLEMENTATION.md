# V2 Implementation Progress

Branch: `feature/design-v2`  
Spec: `../DESIGN_DOCUMENT_V2.md`

## Completed

### Phase 1 — Engine & data layer
- [x] Roles, programs, normalize, types, defaults, migrate-v1
- [x] Metrics (Cooper formulas), budget, financials, engine trace, validation, config

### Phase 2 — Database & API
- [x] `supabase/migration-v2.sql`
- [x] V2 decisions serialization + compute with `trace_json`
- [x] Prior-round metrics passed into compute for round-summary feedback

### Phase 3 — Decision UI
- [x] `DecisionForm.tsx` — 5 tabs
- [x] `ScaffoldingText.tsx`, `MetricPreview.tsx` (recruitment tab preview)
- [ ] Dedicated subcomponents (`RolePositionEditor`, etc.) — optional polish

### Phase 4 — Results & feedback UI
- [x] Expanded `feedback.ts` (14+ metrics, templates, `generateRoundSummary`)
- [x] `round_summary` on results, dashboard, `FeedbackPanel`, PDF export
- [x] Dynamic BSC max scores from `strategy.bsc_weights` in `BSCScorecard`

### Phase 5 — Instructor tools
- [x] `/sessions/[sessionId]/inspect` page
- [x] `GET /api/sessions/[sessionId]/inspect/[teamId]/[roundId]`
- [x] `FormulaInspector.tsx`
- [x] Links from session detail and class reports

### Phase 6 — Branding & exports
- [x] Removed "Capsim-style" branding
- [x] PDF/Excel columns for productivity, hiring quality, turnover cost
- [x] `OutcomeMetricTable` V2 metrics

## Deploy notes

1. Run `supabase/migration-v2.sql` on your Supabase project before testing V2.
2. Existing V1 decision rows still load via `migrate-v1.ts`.
3. Recompute rounds after deploy so `feedback_json` and `trace_json` are populated.

## Manual test checklist (design doc §16)

- [ ] Instructor: create session, teams, open round, compute, inspect trace
- [ ] Student: join team, submit V2 decisions across 5 tabs, view results + round summary
- [ ] Strategy-specific BSC bar maxes match Focus/Cost/Differentiation/etc.
- [ ] High-Tech: salaries below 95% market increase turnover
- [ ] PDF and Excel export include V2 metrics
