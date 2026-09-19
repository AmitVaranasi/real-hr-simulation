-- Migration v11: optimistic-concurrency version on decisions.
--
-- Bug: src/app/api/decisions/route.ts upserts the full decisions row with
-- `onConflict: "team_id,round_id"` and no version check. "All team members
-- can view and edit decisions" (src/app/team/members/page.tsx), but two
-- teammates editing the same round concurrently silently overwrite each
-- other on the graded artifact — the second save wins in full, the first
-- teammate's fields are gone with no warning.
--
-- Fix: a monotonically increasing `version` column plus `last_edited_by`.
-- The API will read the row's current version before writing, compare it to
-- the version the client says it loaded from, and reject (409) a write built
-- on a stale version instead of blindly overwriting.
--
-- version is incremented by a BEFORE INSERT OR UPDATE trigger rather than in
-- application code. The app upsert never sets `version` at all -- the
-- trigger is unconditional and cannot be bypassed by a client forgetting to
-- bump it, by a future code path that upserts directly, or by a bug in
-- decisionToRow(). This closes the same class of "forgot to do the safe
-- thing" bug that caused the original data-loss issue.

ALTER TABLE public.decisions
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES public.profiles(id);

COMMENT ON COLUMN public.decisions.version IS
  'Optimistic-concurrency counter. Incremented unconditionally by
   decisions_bump_version on every INSERT/UPDATE. Clients must send back the
   version they loaded from; the API rejects a write built on a stale
   version with 409 instead of silently overwriting a teammate''s edits.';

COMMENT ON COLUMN public.decisions.last_edited_by IS
  'Profile id of whoever last wrote this row (regardless of is_submitted).
   Distinct from submitted_by, which only records the final submitter.';

CREATE OR REPLACE FUNCTION public.decisions_bump_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.version := 1;
  ELSE
    NEW.version := COALESCE(OLD.version, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS decisions_bump_version_trigger ON public.decisions;
CREATE TRIGGER decisions_bump_version_trigger
  BEFORE INSERT OR UPDATE ON public.decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.decisions_bump_version();
