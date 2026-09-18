# Future Fixes

Ideas and enhancements to consider for a later release.

---

## Notify teammates when someone leaves

**Scenario:** A student leaves a team mid-setup. The remaining members see the
roster shrink on `/team/members` but are never told, and the instructor only
finds out by reading the audit log.

**Current behavior:**
- Leaving is silent. `admin_audit_log` records a `team.leave` entry; nothing
  surfaces it to the team or the instructor.

**Possible solution:** a session-scoped activity feed the instructor already
watches, rather than email — the simulation has no messaging backend yet.

---

## Instructor-initiated removal of a student

**Scenario:** A student needs moving after their team has submitted, which the
self-serve leave flow deliberately refuses (see `docs/leave-team-policy.md`).

**Current behavior:** the instructor edits `team_members` in Supabase directly.

**Possible solution:** a roster panel on the session page that can move a
student between teams, with the same audit entry the self-serve path writes.

---

## Shipped

- **Allow students to leave a team and join another** — `POST /api/teams/leave`
  plus the Leave Team card on `/team/members`. Rules and the reasoning behind
  them are in `docs/leave-team-policy.md`.
