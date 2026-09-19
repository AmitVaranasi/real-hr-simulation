-- Real HR Simulation — run in Supabase SQL Editor
-- v15: persist an explicit locale preference on profiles.
--
-- The app resolves locale as: profiles.locale (once signed in) >
-- hrsim_locale cookie > Accept-Language header > "en" default
-- (see src/lib/i18n/resolve.ts and src/lib/i18n/server.ts). This column
-- is the signed-in half of that precedence so a preference set on one
-- device follows the student to another.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en'
    CHECK (locale IN ('en', 'es'));

COMMENT ON COLUMN public.profiles.locale IS
  'Explicit UI language preference. Keep in sync with src/lib/i18n/config.ts LOCALES.';
