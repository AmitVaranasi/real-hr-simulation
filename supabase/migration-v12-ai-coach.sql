-- Migration v12: AI coach messages and per-student daily cap.
--
-- The coach is a paid, external LLM call, so usage must be both auditable by
-- the instructor (they are grading these students and the coach is part of
-- how a team arrived at its decisions) and boundable server-side (a runaway
-- client cannot spend unlimited budget). This table is the single source of
-- truth for both: every exchange is a row, and the daily cap is enforced by
-- counting rows for (student, day) rather than trusting any client-supplied
-- counter.
--
-- Grounding note: this table stores only the requesting student's own
-- team_id, never other teams' data — the route layer is responsible for
-- only ever loading the caller's own team before writing here.

CREATE TABLE public.coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.rounds(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cache_read_input_tokens INTEGER,
  stop_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coach_messages_user_created
  ON public.coach_messages (user_id, created_at);

CREATE INDEX idx_coach_messages_team
  ON public.coach_messages (team_id, created_at);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- Students may read/insert only their own messages.
CREATE POLICY coach_messages_student_select ON public.coach_messages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY coach_messages_student_insert ON public.coach_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Instructors may read every coach exchange in a session they own, since
-- they grade these students on the decisions the coach discussed.
CREATE POLICY coach_messages_instructor_select ON public.coach_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.teams t
      JOIN public.sessions s ON s.id = t.session_id
      WHERE t.id = coach_messages.team_id
        AND s.instructor_id = auth.uid()
    )
  );

COMMENT ON TABLE public.coach_messages IS
  'AI coach chat transcript. One row per user/assistant turn. Used to enforce the per-student daily message cap and for instructor visibility into coach usage.';
