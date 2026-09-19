# Future Fixes

Ideas and enhancements to consider for a later release.

---

## AI coach follow-ups

**Shipped in this iteration:** `POST /api/coach` (streaming, student-only,
grounded in the caller's own team data via `src/lib/coach/grounding.ts`,
capped at 20 messages/student/day via `coach_messages`, Socratic system
prompt in `src/lib/coach/system-prompt.ts`), `HRCoach` chat UI on the
student results view, and `GET /api/coach/transcripts` +
`CoachTranscriptPanel` for instructor visibility.

**Left for a later pass:**
- No admin/instructor-wide spend dashboard across all teams/sessions —
  `coach_messages` has everything needed (input/output/cache tokens per
  row), just no aggregate view yet.
- No UI affordance showing the student their remaining daily messages
  before they hit the 429; the cap is enforced but only surfaces as an
  error message once reached.
- Conversation history is kept client-side in `HRCoach` (`historyRef`) and
  resent each turn rather than reloaded from `coach_messages` on page
  load, so a refresh mid-conversation loses in-progress chat context (the
  transcript itself is still persisted and instructor-visible).
- No streaming-abort handling if the student navigates away mid-reply;
  the fetch is simply garbage-collected rather than explicitly cancelled.

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
