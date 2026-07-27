-- MVP Admin role — run after migration-v4.sql
-- Widens profiles.role to include 'admin' and lets admins read/write global config.

-- Drop and recreate the role CHECK constraint (name may vary by install)
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT c.conname INTO con_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.relname = 'profiles'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%role%';

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('instructor', 'student', 'admin'));

-- Admins can read all sessions / teams (overview counts + system tools)
DROP POLICY IF EXISTS "Admins read all sessions" ON public.sessions;
CREATE POLICY "Admins read all sessions"
  ON public.sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins read all teams" ON public.teams;
CREATE POLICY "Admins read all teams"
  ON public.teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Extend simulation_config policies for admin
DROP POLICY IF EXISTS "Admins read simulation config" ON public.simulation_config;
CREATE POLICY "Admins read simulation config"
  ON public.simulation_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins update simulation config" ON public.simulation_config;
CREATE POLICY "Admins update simulation config"
  ON public.simulation_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Prevent self-serve admin via signup metadata (register UI only offers student/instructor)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  safe_role TEXT;
BEGIN
  IF requested IN ('instructor', 'student') THEN
    safe_role := requested;
  ELSE
    safe_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    safe_role,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- One-time bootstrap (optional): set a known user to admin by id
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
-- Or set ADMIN_EMAILS in .env.local (comma-separated) — app promotes on auth.
