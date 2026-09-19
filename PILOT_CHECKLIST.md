# Pilot / Expert Evaluation Checklist (Iteration 4)

Use this before Cooper (or another HR domain expert) evaluates the platform.

## Prerequisites

- [ ] Run `supabase/migration-v4.sql` (adds `sessions.announcement`)
- [ ] Supabase Auth redirect URLs include `{APP_URL}/auth/callback`
- [ ] `.env.local` has URL, anon key, service role key, `NEXT_PUBLIC_APP_URL`
- [ ] `npm run test` passes (engine golden tests)

## Auth reliability

- [ ] Login works in Chrome, Edge, Firefox, Safari (see `BROWSER_SMOKE_CHECKLIST.md`)
- [ ] Forgot password → email → reset password works
- [ ] Instructor can send student reset from session page
- [ ] Instructor lands on `/sessions`; student on `/dashboard`

## Student landing

- [ ] Dashboard shows team, round, budget, progress, announcements
- [ ] **Continue Simulation** opens decisions (or Review when draft exists)
- [ ] Role secondary nav appears on student pages

## Professor landing

- [ ] `/sessions` shows KPIs (teams, open round, submissions)
- [ ] Shortcuts to Config, Testing Center, Reports
- [ ] Session page: announcements, edit team industry/strategy, round processing

## Config / diagnostics / review

- [ ] Session create exposes practice + competitive round counts
- [ ] `/sessions/config` edits budget, economy, industries, strategies, benchmarks
- [ ] `/sessions/testing` runs scenarios and shows formula inspector
- [ ] Inspect page shows carry-forward section
- [ ] Review page separates Warnings vs Recommendations; shows compensation economics

## Full round demo path

1. Create session (1 practice + 2 competitive)
2. Add 2 teams (different industries/strategies)
3. Post an announcement
4. Open round 1 (normal economy)
5. As student: join → Continue → decisions → Review → submit
6. Close & compute
7. Inspect formula trace + carry-forward
8. View Class analytics reports
9. Release leaderboard

## Known limits (deferred)

- No full AI coach
- Formula expression editor now exists (Admin → Formula Repository) for the
  subset of catalog formulas with a configured variable whitelist
  (`src/lib/formula-lang/engine-variables.ts`): turnover, hiring quality,
  productivity, DEI, training ROI, revenue cascade, profit, stock price,
  BSC perspective/total, and strategy bonus. Budget-allocation formulas
  (`discretionary-budget`, `module-allocation`) don't map to a stored
  outcome column yet, so they remain documentation-only in the editor.
  Edits are validated by a hand-written parser/evaluator (no `eval`), must
  pass a preview against real historical `outcomes` rows before save, and
  are versioned via `formula_overrides` / `formula_override_revisions`
  (apply `supabase/migration-v13-formula-editor.sql`). The saved
  expression is **not yet wired into the live scoring pipeline** —
  `metrics.ts` / `scoring.ts` still compute with the built-in TypeScript
  formulas; the override is evaluated only for the editor's own preview.
  Wiring overrides into the runtime pipeline is the next step.
- Students cannot leave/rejoin teams yet
- No separate system-admin role / formula version repository
