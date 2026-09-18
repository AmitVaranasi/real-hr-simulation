/**
 * Whether a student may leave their team.
 *
 * Encodes rule 1 of docs/leave-team-policy.md: leaving is allowed until the
 * team submits its first decision in that session. After that the submission
 * is a graded artifact attributed to a roster, and the instructor has to move
 * the student instead.
 *
 * Pure on purpose — the API route decides, the UI renders the same verdict, and
 * neither needs a database to be tested.
 */

export type LeaveEligibility =
  | { allowed: true }
  | { allowed: false; reason: LeaveBlockedReason; message: string };

export type LeaveBlockedReason = "no-team" | "submitted";

/** What the caller must load before asking. */
export type LeaveContext = {
  /** True when the student currently holds a team membership. */
  hasTeam: boolean;
  /**
   * Number of decisions in this session already marked submitted, across every
   * round. Drafts do not count — only `is_submitted` rows.
   */
  submittedDecisionCount: number;
};

const INSTRUCTOR_HINT =
  "Ask your instructor to move you — they can change your team directly.";

export function leaveEligibility(ctx: LeaveContext): LeaveEligibility {
  if (!ctx.hasTeam) {
    return {
      allowed: false,
      reason: "no-team",
      message: "You are not on a team yet.",
    };
  }

  if (ctx.submittedDecisionCount > 0) {
    return {
      allowed: false,
      reason: "submitted",
      message: `Your team has already submitted decisions for this session, so you cannot leave on your own. ${INSTRUCTOR_HINT}`,
    };
  }

  return { allowed: true };
}

/** HTTP status the leave endpoint should answer with for a blocked verdict. */
export function leaveBlockedStatus(reason: LeaveBlockedReason): number {
  return reason === "no-team" ? 404 : 409;
}
