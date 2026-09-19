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

---

## Show who else has a round's decisions open (presence)

**Scenario:** Team members page tells students "All team members can view and edit decisions," but a student has no way to see whether a teammate currently has the same round open, making the conflict-resolution flow (see below) a surprise rather than an expected possibility.

**Current behavior:** No presence signal at all. Concurrent edits are now safe (see the conflict fix below) but silent until someone hits Save.

**Possible solution:** A lightweight heartbeat, matching the polling conventions already used elsewhere (`PortalShell.tsx`'s 15s nav refresh, `StudentLanding.tsx`'s 5s status poll): a small `decision_presence` table (`team_id`, `round_id`, `user_id`, `last_seen_at`), a POST endpoint the workspace pings every ~15s while mounted, and a GET the workspace polls to list teammates seen in the last ~30s. Deliberately scoped out of this pass (concurrency fix + conflict UI) to keep that change reviewable; no realtime/websocket dependency needed, plain polling is enough at this scale.

---

## Concurrent decision edits (resolved, follow-ups remain)

**Fixed:** `POST /api/decisions` now rejects a save built on a stale version with 409 instead of silently overwriting a teammate's edits (`supabase/migration-v11-decision-version.sql`, `src/app/api/decisions/route.ts`, `src/components/decisions/ConflictResolutionDialog.tsx`, `src/lib/decisions/conflict.ts`).

**Follow-ups not covered by this pass:**
- Presence (see above) so a conflict is anticipated rather than a surprise at save time.
- The debounced autosave in `DecisionWorkspace.tsx` now also handles 409s, but a conflict raised by autosave (vs. a manual Save click) could use a less intrusive UI treatment — right now it's the same full dialog either way.
- `route.test.ts`'s pinned NOTE about `round_id` not being validated against `team_id`'s session predates this change and is still an open issue, unrelated to concurrency.
