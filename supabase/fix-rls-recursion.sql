-- Fix: infinite recursion in team_members RLS policies
-- Run this in Supabase SQL Editor (safe to re-run)

-- Helper functions bypass RLS so policies don't query team_members recursively
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

-- Drop policies that cause recursion (names may vary if you edited them)
DROP POLICY IF EXISTS "Students see own team members" ON public.team_members;
DROP POLICY IF EXISTS "Instructors see team members in own sessions" ON public.team_members;
DROP POLICY IF EXISTS "Students can join teams" ON public.team_members;
DROP POLICY IF EXISTS "Students can read sessions they belong to" ON public.sessions;
DROP POLICY IF EXISTS "Students can read own team" ON public.teams;
DROP POLICY IF EXISTS "Students read rounds in their session" ON public.rounds;
DROP POLICY IF EXISTS "Teams manage own decisions" ON public.decisions;
DROP POLICY IF EXISTS "Teams read own outcomes" ON public.outcomes;
DROP POLICY IF EXISTS "Teams manage own reflections" ON public.reflections;
DROP POLICY IF EXISTS "Students read session outcomes when leaderboard released" ON public.outcomes;

-- team_members (fixed)
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

-- sessions (no team_members subquery in policy)
CREATE POLICY "Students can read sessions they belong to"
  ON public.sessions FOR SELECT
  USING (id IN (SELECT public.user_session_ids()));

-- teams
CREATE POLICY "Students can read own team"
  ON public.teams FOR SELECT
  USING (id IN (SELECT public.user_team_ids()));

-- rounds
CREATE POLICY "Students read rounds in their session"
  ON public.rounds FOR SELECT
  USING (session_id IN (SELECT public.user_session_ids()));

-- decisions
CREATE POLICY "Teams manage own decisions"
  ON public.decisions FOR ALL
  USING (team_id IN (SELECT public.user_team_ids()));

-- outcomes
CREATE POLICY "Teams read own outcomes"
  ON public.outcomes FOR SELECT
  USING (team_id IN (SELECT public.user_team_ids()));

CREATE POLICY "Students read session outcomes when leaderboard released"
  ON public.outcomes FOR SELECT
  USING (
    round_id IN (
      SELECT r.id FROM public.rounds r
      WHERE r.leaderboard_released = true
      AND r.session_id IN (SELECT public.user_session_ids())
    )
  );

-- reflections
CREATE POLICY "Teams manage own reflections"
  ON public.reflections FOR ALL
  USING (team_id IN (SELECT public.user_team_ids()));
