# Professor Portal — missing data / logic

UI pages are in place. These are the fields and stores the Figma screens show that the current backend does not have. Empty UI shows `—` until you provide them.

## Action items — after review is complete

Do not start these until the current page-by-page review is finished. Add more items here as gaps turn up.

1. **Announcement lifecycle (Draft / Scheduled / Posted / Archived)**  
   Spec: one announcement object, states `Draft → Scheduled → Posted → Archived`, no duplicate row on state change. Drafts need Last Modified + modified by; autosave never publishes; students see Posted only.  
   Today: one `sessions.announcement` string and a “Post to students” form. Drafts / Scheduled / Archived tables cannot receive rows, and those pages have no create/schedule/archive actions.  
   Build after review:
   - status + type on the one object
   - Save draft / autosave that never publishes
   - **Create scheduled** (date/time, not visible to students until release)
   - **Archive** (immutable; Reach / Engagement stay `—` until those events exist)
   - Drafts / Scheduled / Archived tables wired to real rows on those pages

## Course / announcements
- Scheduled / draft / archived announcement records (today: one `sessions.announcement` string). Tabs navigate; those views stay empty until a lifecycle store exists.
- Announcement type, audience, delivery channel, `scheduled_for`, date filter on a real posted/scheduled timestamp
- Reach and engagement (Figma archived table). Spec: do not show a % before the event is defined. Columns show `—` only on Archived.
- Actions Available beyond Edit (schedule, archive, kebab lifecycle). Needs the store above.
- Unassigned student roster (students join by code; no course enrollment table)
- Invite / invited-vs-enrolled state
- Decision-window due datetime (only `opened_at` / `closed_at`)
- Time remaining / countdown
- Students enrolled as a first-class count beyond `team_members` (Course Status now uses unique `team_members.user_id`; 0 means nobody joined a team)
- Auto-assign grouping algorithm (propose/commit UI exists; no unassigned pool)

### Course Status on Announcements — who owns the empty fields
- Practice open / closed, teams created, students enrolled, next pending round: **developers**. These are derived from `rounds`, `teams`, and `team_members`. The announcements page was not passing students or next-round into the rail; that is wired now. `—` / `0` / `Closed` after the fix means the live session has no matching row (no open practice, no members, no pending round).
- Reach, engagement, scheduled drafts, archive, calendar `scheduled_for`: **product / new feature**. Not in the current schema.

## Class Performance / Teaching
- Industry benchmark vs class (Industry Scoring “vs. Industry” columns). Figma dummy Mack numbers are not copied. UI is in place; values stay `—` until a stored benchmark exists.
- Decision quality % and decision-to-outcome correlation (Decision Analysis tabs). Spend bars use the existing budget engine; quality/correlation are not stored products.
- Rank and trend vs previous processed round when only one processed round exists
- Engagement %, collaboration score, discussion activity
- Learning analytics (participation over time, heatmap, topic learning)
- Teaching “top performing area / area to watch” computed insights
- Student reflections for debrief
- Config version / engine version / formula version bound to each processed round

## Resources
- Hosted file library (PPTX/DOCX/PDF), last updated, format, resource type
- Featured resource dates and document counts from Figma are dummy — not copied
- Downloads file hosting
- Professor Guide long-form copy from Cooper

## Simulation Lab
- Save ≠ Apply (today save and apply are the same write)
- Configuration change history (who/when/before/after)
- Configuration version label (Figma shows 1.0.0)
- Engine version label (Figma shows 2.4.1)
- Simulation mode (Competitive / Collaborative / Individual) as stored state
- Team size setting
- Custom economy (inflation, interest, demand, labor, volatility)
- Currency other than USD
- Named shareable custom scenarios
- Six Process Round pre-checks as server-authoritative results
- Process duration, processed_by, processing history table
- Diagnostic run history, response-time metric, “items need review”
- Test history / templates / last test run timestamp
- Dedicated engines for Multiplier, Sensitivity, Stress, Carry-Forward, Custom tests (only the existing scenario runner is live)
- Import configuration schema + compatibility check
- Reset to defaults confirmation + audit
- Immutable config snapshot on process (Round → Config Version → Engine Version → Formula Version)

## Help
- Support ticket system, live chat hours, support email backend
- Help-article CMS / search index

## Figma keys still missing from the folder dump
Course Overview (if separate), Industry Results, Decision Analysis, Discussion & Debrief, Learning Analytics, Formula Inspect, Diagnostics (if a separate file from configuration), Professor Guide, Downloads.

Dashboard key is confirmed: `P4UFkpakzJMOVUwrAINk21`.
