# Pilot / Expert Evaluation Checklist (Iteration 4)

Use this before Cooper (or another HR domain expert) evaluates the platform.

## Prerequisites

- [ ] Run `supabase/migration-v4.sql` (adds `sessions.announcement`)
- [ ] Run `supabase/migration-v11-decision-version.sql` (adds `decisions.version` / `last_edited_by` + bump trigger, needed for concurrent-edit protection below)
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
- [ ] Two teammates editing the same round's decisions concurrently: second save gets a resolution dialog instead of silently losing the first teammate's field (open the same round decision page in two browser sessions as two team members, edit different fields, save both — second save should show "Resolve & Save" / "Merge & Save", not a silent overwrite)

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

- AI coach ships behind `ANTHROPIC_API_KEY`: student-only, Socratic (no
  answer key), grounded only in the student's own team data, capped at
  20 messages/student/day, transcripts visible to the owning instructor.
  Route degrades gracefully (503) when the key is unset.
- No formula expression editor (parameters only)
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
- No presence indicator for concurrent decision editing (students aren't shown *who else* has the round open, only warned via a save-time conflict — see `future-fixes.md`)
- No i18n on most surfaces yet: en/es translation infrastructure (typed t(), plural rules via Intl.PluralRules, locale-aware currency/percent/date formatting, cookie+Accept-Language+profile locale resolution) is built and tested, and proven on the join-team flow + dashboard empty state, but the rest of the ~279 candidate strings (StudentLanding, Help Center, Navbar, all instructor/admin surfaces) are still hardcoded English — see future-fixes.md for the prioritized list and `npm run i18n:coverage` for what's measurably left.

## LTI 1.3 (Canvas) — added, un-certified

- LTI 1.3 / LTI Advantage launch, deep linking, and AGS grade passback are
  implemented (`docs/lti-setup.md` has the full admin setup steps, security
  checklist, and unverified-items list).
- **Never exercised against a real Canvas instance** — no developer key or
  network access to one was available while building it. Treat the first
  real connection as its own pilot with a throwaway course before trusting
  it with real students.
- Grade passback is instructor-triggered only
  (`POST /api/lti/ags/sync/[sessionId]`), not automatic on round close.
- Requires `LTI_TOOL_PRIVATE_KEY` / `LTI_TOOL_PUBLIC_KEY` env vars and
  `supabase/migration-v14-lti.sql` applied before any LTI feature works; the
  rest of the app is unaffected if these are never set up.
