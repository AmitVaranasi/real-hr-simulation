-- Migration v9: decision deadline on rounds.
--
-- Iteration 5 §7 ("Decision Deadline and Time Remaining"):
--   "Deadline should populate from Round Management."
--   "Time remaining should calculate dynamically."
--   "If no deadline has been established, provide a neutral state rather than
--    a fabricated date."
--
-- Nullable on purpose: an unset deadline is a real state the UI renders
-- neutrally, not a value to default. closed_at remains the actual close
-- timestamp and is NOT a deadline.

ALTER TABLE public.rounds
  ADD COLUMN IF NOT EXISTS decision_deadline TIMESTAMPTZ;

COMMENT ON COLUMN public.rounds.decision_deadline IS
  'Professor-set student decision deadline. NULL = not established.';
