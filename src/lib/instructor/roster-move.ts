/**
 * Whether an instructor may move a student from one team to another.
 *
 * future-fixes.md: "Instructor-initiated removal of a student ... a roster
 * panel on the session page that can move a student between teams." Unlike
 * the self-serve leave path (src/lib/student/leave-team.ts), an instructor
 * move is explicitly meant to work *after* a team has submitted — that is
 * the scenario the self-serve flow refuses and the reason this endpoint
 * exists. So this function does not check submission state at all; it only
 * validates the shape of the move itself.
 *
 * Pure on purpose — the API route loads context from the database, this
 * function decides, and the UI can preflight the same verdict without a
 * network round trip.
 */

export type RosterMoveVerdict =
  | { allowed: true }
  | { allowed: false; reason: RosterMoveBlockedReason; message: string };

export type RosterMoveBlockedReason =
  | "source-team-not-found"
  | "target-team-not-found"
  | "not-a-member"
  | "same-team";

/** What the caller must load before asking. */
export type RosterMoveContext = {
  /** True when the source team exists and belongs to this session. */
  sourceTeamExists: boolean;
  /** True when the target team exists and belongs to this session. */
  targetTeamExists: boolean;
  /** True when the student currently has a team_members row on the source team. */
  isMemberOfSourceTeam: boolean;
  sourceTeamId: string;
  targetTeamId: string;
};

export function canMoveStudent(ctx: RosterMoveContext): RosterMoveVerdict {
  if (!ctx.sourceTeamExists) {
    return {
      allowed: false,
      reason: "source-team-not-found",
      message: "The student's current team could not be found in this session.",
    };
  }

  if (!ctx.targetTeamExists) {
    return {
      allowed: false,
      reason: "target-team-not-found",
      message: "The destination team could not be found in this session.",
    };
  }

  if (!ctx.isMemberOfSourceTeam) {
    return {
      allowed: false,
      reason: "not-a-member",
      message: "This student is not currently on the team you selected.",
    };
  }

  if (ctx.sourceTeamId === ctx.targetTeamId) {
    return {
      allowed: false,
      reason: "same-team",
      message: "The student is already on that team.",
    };
  }

  return { allowed: true };
}

/** HTTP status the roster move endpoint should answer with for a blocked verdict. */
export function rosterMoveBlockedStatus(reason: RosterMoveBlockedReason): number {
  if (reason === "source-team-not-found" || reason === "target-team-not-found") {
    return 404;
  }
  return 409;
}
