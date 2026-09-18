# Future Fixes

Ideas and enhancements to consider for a later release.

---

## Shipped

- **Allow students to leave a team and join another** — `POST /api/teams/leave`
  plus the Leave Team card on `/team/members`. Rules and the reasoning behind
  them are in `docs/leave-team-policy.md`.
- **Notify teammates when someone leaves** — a session-scoped activity feed
  (`session_activity` table, `supabase/migration-v10-session-activity.sql`)
  rather than email. Both `POST /api/teams/leave` and the new roster-move
  route write a row; the "Recent Activity" panel on Session > Teams reads
  the last 20, newest first.
- **Instructor-initiated removal of a student** — `POST
  /api/sessions/[sessionId]/roster` moves a student between teams in one
  session, including after either team has submitted decisions (the case
  the self-serve leave flow refuses). Writes the same audit shape as
  `team.leave` (`team.roster_move` in `admin_audit_log`), plus a
  `session_activity` row. Instructors drive it from the "Move a Student"
  panel on Session > Teams. `src/lib/instructor/roster-move.ts` holds the
  pure eligibility check, mirroring `src/lib/student/leave-team.ts`.
