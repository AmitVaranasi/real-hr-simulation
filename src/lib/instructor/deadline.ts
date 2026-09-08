/**
 * Decision deadline + time remaining.
 *
 * Iteration 5 §7: the deadline populates from Round Management, time remaining
 * calculates dynamically, a passed deadline must NOT keep counting up, and an
 * unset deadline gets "a neutral state rather than a fabricated date".
 */

export type DeadlineState =
  | { kind: "unset"; label: string; remaining: string }
  | { kind: "upcoming"; label: string; remaining: string; at: Date }
  | { kind: "passed"; label: string; remaining: string; at: Date };

/** "August 8, 2026, 11:59 PM CT" — the format the design specifies. */
export function formatDeadline(at: Date): string {
  const date = at.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const time = at.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

/** "2d 14h 35m" — days drop off once inside a day, minutes once inside a minute. */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function deadlineState(
  iso: string | null | undefined,
  now: number = Date.now()
): DeadlineState {
  if (!iso) {
    return {
      kind: "unset",
      label: "No deadline set",
      remaining: "—",
    };
  }
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) {
    return { kind: "unset", label: "No deadline set", remaining: "—" };
  }
  const delta = at.getTime() - now;
  if (delta <= 0) {
    return {
      kind: "passed",
      label: formatDeadline(at),
      remaining: "Deadline passed",
      at,
    };
  }
  return {
    kind: "upcoming",
    label: formatDeadline(at),
    remaining: formatRemaining(delta),
    at,
  };
}

/** A timestamptz for a <input type="datetime-local"> value, in local time. */
export function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}` +
    `T${pad(at.getHours())}:${pad(at.getMinutes())}`
  );
}

export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null;
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}
