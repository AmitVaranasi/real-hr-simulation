# Leave Team — policy decisions

`future-fixes.md` listed "Allow students to leave a team and join another" with
four rules left open for the instructor. This file records the answers the
implementation assumes. Change the rules here first; the code reads from
`src/lib/student/leave-team.ts`.

## 1. When may a student leave?

**Before their team has submitted any decisions in that session.**

Once a team submits, the submission is a graded artifact attributed to a roster.
Letting a member walk out from under it changes who the grade belongs to. Before
the first submission nothing has been recorded, so leaving is free.

A student blocked by this rule is told to ask their instructor, who can still
move them directly in Supabase.

## 2. Does leaving delete their work?

**No.** Decisions, reflections and outcomes belong to the *team*, not the member
who happened to type them. `team_members` is the only row removed. This also
keeps `decisions.submitted_by` pointing at a real profile.

Because of rule 1 a leaving student has no submitted work anyway — this rule
only matters for in-progress drafts, which stay with the team.

## 3. May they rejoin a team in the same session?

**Yes.** `POST /api/teams/join` only blocks a second team in the same session
while a membership exists. Once the row is gone the normal join flow applies,
including the wrong-code case this feature exists to fix.

## 4. Is instructor approval required?

**No, not in v1.** Requiring approval reintroduces the manual step the feature
removes. Instead every leave is written to `admin_audit_log` as `team.leave`, so
an instructor can see who left which team and when.

## Out of scope

- Instructor-initiated removal of a student (separate roster-management screen).
- Notifying teammates that someone left.
- Any change to how the engine scores a team whose size changed mid-session.
