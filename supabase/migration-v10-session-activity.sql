-- Migration v10: session-scoped activity feed.
--
-- future-fixes.md "Notify teammates when someone leaves": leaving a team is
-- silent today — admin_audit_log records `team.leave` but nothing surfaces
-- it where the team or instructor would see it. Rather than build a
-- messaging backend, this adds a lightweight event log scoped to a single
-- session, which the instructor session page already reads from and the
-- roster-move feature reuses for its own events.
--
-- Kept deliberately separate from admin_audit_log: that table is an
-- admin-only audit trail (RLS restricts SELECT to admins). This table is
-- meant to be readable by the instructor who owns the session, and
-- potentially by students on the affected team later, without touching
-- admin-only policy.

CREATE TABLE IF NOT EXISTS public.session_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'team.leave', 'team.roster_move'
  )),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  from_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  to_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_activity_session_id_created_at_idx
  ON public.session_activity (session_id, created_at DESC);

ALTER TABLE public.session_activity ENABLE ROW LEVEL SECURITY;

-- Instructors read activity for sessions they own (same ownership pattern
-- as "Instructors manage own sessions" in rls.sql).
DROP POLICY IF EXISTS "Instructors read own session activity" ON public.session_activity;
CREATE POLICY "Instructors read own session activity"
  ON public.session_activity FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE instructor_id = auth.uid()
    )
  );

-- Students read activity for sessions their current team belongs to, via the
-- same SECURITY DEFINER helper rls.sql already uses to avoid recursing into
-- team_members from a team_members-adjacent policy.
DROP POLICY IF EXISTS "Students read activity in their session" ON public.session_activity;
CREATE POLICY "Students read activity in their session"
  ON public.session_activity FOR SELECT
  USING (session_id IN (SELECT public.user_session_ids()));

-- Rows are written by API routes via the service role (writeAdminAudit's
-- sibling helper), so no INSERT policy is granted to authenticated users.
