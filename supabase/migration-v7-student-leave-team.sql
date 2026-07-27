-- Allow students to leave their own team membership (join/switch flow)
DROP POLICY IF EXISTS "Students can leave own teams" ON public.team_members;
CREATE POLICY "Students can leave own teams"
  ON public.team_members FOR DELETE
  USING (user_id = auth.uid());
