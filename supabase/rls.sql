-- Run after schema.sql
-- Uses SECURITY DEFINER helpers to avoid infinite recursion on team_members

-- ============================================================
-- HELPER FUNCTIONS (bypass RLS for membership lookups)
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_team_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT team_id FROM public.team_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_session_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT t.session_id
  FROM public.teams t
  INNER JOIN public.team_members tm ON tm.team_id = t.id
  WHERE tm.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.user_team_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_session_ids() TO authenticated;

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE POLICY "Instructors manage own sessions"
  ON public.sessions FOR ALL
  USING (instructor_id = auth.uid());
CREATE POLICY "Students can read sessions they belong to"
  ON public.sessions FOR SELECT
  USING (id IN (SELECT public.user_session_ids()));

-- ============================================================
-- TEAMS
-- ============================================================
CREATE POLICY "Instructors manage teams in own sessions"
  ON public.teams FOR ALL
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE instructor_id = auth.uid()
    )
  );
CREATE POLICY "Students can read own team"
  ON public.teams FOR SELECT
  USING (id IN (SELECT public.user_team_ids()));
CREATE POLICY "Anyone authenticated can read teams"
  ON public.teams FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- TEAM MEMBERS (no self-referencing subqueries)
-- ============================================================
CREATE POLICY "Instructors see team members in own sessions"
  ON public.team_members FOR ALL
  USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      JOIN public.sessions s ON s.id = t.session_id
      WHERE s.instructor_id = auth.uid()
    )
  );
CREATE POLICY "Students see team members on their teams"
  ON public.team_members FOR SELECT
  USING (team_id IN (SELECT public.user_team_ids()));
CREATE POLICY "Students can join teams"
  ON public.team_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- ROUNDS
-- ============================================================
CREATE POLICY "Instructors manage rounds"
  ON public.rounds FOR ALL
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE instructor_id = auth.uid()
    )
  );
CREATE POLICY "Students read rounds in their session"
  ON public.rounds FOR SELECT
  USING (session_id IN (SELECT public.user_session_ids()));

-- ============================================================
-- DECISIONS
-- ============================================================
CREATE POLICY "Teams manage own decisions"
  ON public.decisions FOR ALL
  USING (team_id IN (SELECT public.user_team_ids()));
CREATE POLICY "Instructors read all decisions in own sessions"
  ON public.decisions FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      JOIN public.sessions s ON s.id = t.session_id
      WHERE s.instructor_id = auth.uid()
    )
  );

-- ============================================================
-- OUTCOMES
-- ============================================================
CREATE POLICY "Teams read own outcomes"
  ON public.outcomes FOR SELECT
  USING (team_id IN (SELECT public.user_team_ids()));
CREATE POLICY "Instructors read all outcomes in own sessions"
  ON public.outcomes FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      JOIN public.sessions s ON s.id = t.session_id
      WHERE s.instructor_id = auth.uid()
    )
  );
CREATE POLICY "Students read session outcomes when leaderboard released"
  ON public.outcomes FOR SELECT
  USING (
    round_id IN (
      SELECT r.id FROM public.rounds r
      WHERE r.leaderboard_released = true
      AND r.session_id IN (SELECT public.user_session_ids())
    )
  );

-- ============================================================
-- REFLECTIONS
-- ============================================================
CREATE POLICY "Teams manage own reflections"
  ON public.reflections FOR ALL
  USING (team_id IN (SELECT public.user_team_ids()));
CREATE POLICY "Instructors read reflections in own sessions"
  ON public.reflections FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      JOIN public.sessions s ON s.id = t.session_id
      WHERE s.instructor_id = auth.uid()
    )
  );
