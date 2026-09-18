# Pilot / Expert Evaluation Checklist (Iteration 4)

Use this before Cooper (or another HR domain expert) evaluates the platform.

## Prerequisites

- [ ] Run `supabase/migration-v4.sql` (adds `sessions.announcement`)
- [ ] Run `supabase/migration-v7-student-leave-team.sql` (DELETE policy on
      `team_members`; the leave endpoint uses the service role, but the policy
      keeps client-side reads/writes consistent)
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

## Leave / rejoin a team

- [ ] `/team/members` shows a Leave Team card before any submission
- [ ] Leaving asks for confirmation, then lands on `/join`
- [ ] The freed student can join a different team in the same session
- [ ] After a submission the card explains why leaving is blocked (no button)
- [ ] Joining a second team in the same session points at Team > Members
- [ ] `team.leave` appears in `/admin/audit`

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
- No formula expression editor (parameters only)
- Teammates are not notified when someone leaves
- Instructors cannot move a student after their team has submitted
- No separate system-admin role / formula version repository
