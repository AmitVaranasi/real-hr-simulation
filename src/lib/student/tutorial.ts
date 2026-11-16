/**
 * First-time student tutorial state.
 *
 * Stored on the Supabase auth user's own metadata (`user_metadata`), which a
 * signed-in user may update for themselves. That keeps it per account and
 * across devices without a database migration. It is a learning aid, not a
 * security control, so user-editable storage is acceptable.
 */

export const TUTORIAL_PATH = "/tutorial";

export type TutorialStatus = "completed" | "skipped";

/** Keys inside `user.user_metadata`. */
export const TUTORIAL_STATUS_KEY = "tutorial_status";
export const TUTORIAL_UPDATED_KEY = "tutorial_updated_at";

/**
 * Student portal routes that stay locked until the tutorial is completed or
 * skipped. `/join` stays open so a new student can enter their team code first
 * (the tutorial then tells their own company's story).
 */
const GATED_STUDENT_PREFIXES = [
  "/dashboard",
  "/decisions",
  "/review",
  "/round",
  "/history",
  "/reports",
  "/team",
  "/resources",
  "/help",
  "/leaderboard",
];

export function isTutorialGatedPath(path: string): boolean {
  return GATED_STUDENT_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
}

export function tutorialStatus(
  metadata: Record<string, unknown> | null | undefined
): TutorialStatus | null {
  const value = metadata?.[TUTORIAL_STATUS_KEY];
  return value === "completed" || value === "skipped" ? value : null;
}

/** Only same-site student paths are allowed as the post-tutorial destination. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  if (next === TUTORIAL_PATH || next.startsWith(`${TUTORIAL_PATH}?`)) {
    return "/dashboard";
  }
  return next;
}
