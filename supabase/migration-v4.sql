-- Iteration 4 — platform completion
-- Run after migration-v3.sql

-- Instructor announcements shown on the student landing page
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS announcement TEXT;

COMMENT ON COLUMN public.sessions.announcement IS
  'Optional instructor note shown on the student dashboard';
