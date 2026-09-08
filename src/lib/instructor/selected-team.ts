/**
 * Selected-team context for the professor portal.
 *
 * Iteration 5 §15: "Do not require the professor to repeatedly reselect the
 * same team when moving between related teaching pages where session context
 * can reasonably be maintained." A cookie is the mechanism because the portal
 * pages are server-rendered — the selection has to be readable before render,
 * not hydrated afterwards.
 *
 * §16 draws the line this context must respect: a selected team is TEAM-level
 * context (decisions, results, ranking, instructional experimentation) and
 * must never stand in for CLASS-level context (round, environment, deadline,
 * class progress).
 */

const COOKIE = "rhs_selected_team";
/** Team selection is a working convenience, not an academic record. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Client: remember the team the professor is teaching from. */
export function rememberSelectedTeam(teamId: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=${encodeURIComponent(
    teamId
  )}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
}

/** Client: read it back without waiting for the server. */
export function readSelectedTeamCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(COOKIE.length + 1)) || null;
}

/**
 * Server: the remembered team, but only when it is still one of this course's
 * teams — a stale id from another course must never leak across sessions.
 */
export async function selectedTeamId(
  courseTeamIds: string[]
): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const value = store.get(COOKIE)?.value ?? null;
  if (!value) return null;
  return courseTeamIds.includes(value) ? value : null;
}
