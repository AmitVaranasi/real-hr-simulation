/**
 * Per-student daily message cap for the AI coach.
 *
 * The cap is enforced by counting `coach_messages` rows for the student
 * within a UTC calendar day — never by trusting a client-supplied counter —
 * so it survives page reloads, multiple devices, and a client that lies.
 *
 * Kept deliberately low: this is a cost-sensitive student-facing feature
 * calling a paid model, not an unlimited chat product. 20 student messages
 * per day is enough for a genuine coaching conversation across a round
 * (a handful of exchanges before and after submitting decisions) without
 * being an unbounded cost sink per student.
 */

export const DAILY_MESSAGE_CAP = 20;

/** Start of the UTC calendar day containing `now`, as an ISO string — the
 * boundary used for "how many messages has this student sent today." */
export function utcDayStart(now: Date): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString();
}

export interface CapCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

/** Pure decision function: given how many user messages the student has
 * already sent today, is one more allowed? Kept separate from the DB
 * lookup so the cap logic itself is trivially unit-testable. */
export function checkDailyCap(
  usedToday: number,
  limit: number = DAILY_MESSAGE_CAP
): CapCheckResult {
  const remaining = Math.max(0, limit - usedToday);
  return {
    allowed: usedToday < limit,
    used: usedToday,
    limit,
    remaining,
  };
}
