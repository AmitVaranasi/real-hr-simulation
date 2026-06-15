# Future Fixes

Ideas and enhancements to consider for a later release.

---

## Allow students to leave a team and join another

**Scenario:** A student joined the wrong team (typo in join code, wrong group) and wants to exit the current team and join a different one in the same or another session.

**Current behavior:**
- Once a student joins a team, there is no UI or API to leave the team.
- The join API blocks joining another team in the **same session** if the student is already on a team in that session.
- Students must ask the instructor to remove them manually (if that is even supported in Supabase/admin).

**Possible solution:**
1. **Student “Leave team”** on the dashboard (with confirmation).
2. **API** `POST /api/teams/leave` (or `DELETE` membership) that:
   - Removes the row from `team_members` for the current user.
   - Optionally clears or archives in-progress decisions for that team (policy decision).
3. **Re-join flow:** After leaving, redirect to `/join` so they can enter a new code (existing join flow).
4. **Rules to define with instructor:**
   - Can they leave after a round has started or only before the first submission?
   - Can they join a different team in the same session after leaving?
   - Should the instructor be notified or must approval be required?

**Related data:** `team_members`, `decisions`, `reflections`, `outcomes` (tie-break on whether leaving deletes history or keeps it for audit).
