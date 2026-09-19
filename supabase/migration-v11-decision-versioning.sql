-- Migration v11: optimistic concurrency for decisions.
--
-- Bug: team/members page tells students "All team members can view and edit
-- decisions." POST /api/decisions has always done a blind
-- upsert(row, { onConflict: "team_id,round_id" }) with no version check, so
-- when two teammates save the same round concurrently, the second write
-- silently overwrites every field the first write just set — on the graded
-- artifact. This migration adds the version bookkeeping the API route uses
-- to detect and reject stale writes instead of clobbering them.
--
-- version: starts at 0 for a never-saved row (matches the API's null-safe
-- treatment of "no row yet" as version 0). Incremented by the trigger below
-- on every insert/update, not by application code, so a future caller can't
-- accidentally skip the bump by forgetting to compute it — the DB is the
-- only source of truth for "how many times has this been written."
--
-- last_written_by: nullable. NULL means the row predates this migration (a
-- decision saved before v11 has no recorded writer) or was written by a
-- process without a user context; not a value to fabricate a default for.

ALTER TABLE public.decisions
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.decisions
  ADD COLUMN IF NOT EXISTS last_written_by UUID REFERENCES public.profiles(id);

COMMENT ON COLUMN public.decisions.version IS
  'Optimistic-concurrency counter, incremented by trg_decisions_bump_version on every write. Clients send expected_version with a save; a mismatch means someone else wrote first.';

COMMENT ON COLUMN public.decisions.last_written_by IS
  'Profile id of whoever last wrote this row. NULL = pre-v11 row or a write without user context.';

-- Trigger, not application-level increment: the version bump must not be
-- skippable by a future direct-SQL admin fix, a batch job, or a caller that
-- forgets to read-then-increment. BEFORE INSERT OR UPDATE ensures NEW.version
-- always reflects "one more than what was there," even for the upsert's
-- ON CONFLICT DO UPDATE path, regardless of what the application sent in.
CREATE OR REPLACE FUNCTION public.trg_decisions_bump_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.version := COALESCE(OLD.version, 0) + 1;
  ELSE
    NEW.version := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS decisions_bump_version ON public.decisions;
CREATE TRIGGER decisions_bump_version
  BEFORE INSERT OR UPDATE ON public.decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_decisions_bump_version();
