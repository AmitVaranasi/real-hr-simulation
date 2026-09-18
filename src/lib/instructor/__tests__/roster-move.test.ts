import { describe, expect, it } from "vitest";
import { canMoveStudent, rosterMoveBlockedStatus } from "../roster-move";

const base = {
  sourceTeamExists: true,
  targetTeamExists: true,
  isMemberOfSourceTeam: true,
  sourceTeamId: "team-a",
  targetTeamId: "team-b",
};

describe("canMoveStudent (future-fixes.md instructor-initiated removal)", () => {
  it("allows a valid move between two different teams", () => {
    expect(canMoveStudent(base)).toEqual({ allowed: true });
  });

  it("allows a move even when the teams have already submitted decisions", () => {
    // Unlike leaveEligibility, this function takes no submission state at
    // all — that is the whole point of the instructor override.
    expect(canMoveStudent(base)).toEqual({ allowed: true });
  });

  it("blocks when the source team does not exist in this session", () => {
    const verdict = canMoveStudent({ ...base, sourceTeamExists: false });
    expect(verdict.allowed).toBe(false);
    if (verdict.allowed) return;
    expect(verdict.reason).toBe("source-team-not-found");
  });

  it("blocks when the target team does not exist in this session", () => {
    const verdict = canMoveStudent({ ...base, targetTeamExists: false });
    expect(verdict.allowed).toBe(false);
    if (verdict.allowed) return;
    expect(verdict.reason).toBe("target-team-not-found");
  });

  it("blocks when the student is not actually on the source team", () => {
    const verdict = canMoveStudent({ ...base, isMemberOfSourceTeam: false });
    expect(verdict.allowed).toBe(false);
    if (verdict.allowed) return;
    expect(verdict.reason).toBe("not-a-member");
  });

  it("blocks a no-op move to the same team", () => {
    const verdict = canMoveStudent({ ...base, targetTeamId: base.sourceTeamId });
    expect(verdict.allowed).toBe(false);
    if (verdict.allowed) return;
    expect(verdict.reason).toBe("same-team");
  });

  it("maps not-found reasons to 404 and the rest to 409", () => {
    expect(rosterMoveBlockedStatus("source-team-not-found")).toBe(404);
    expect(rosterMoveBlockedStatus("target-team-not-found")).toBe(404);
    expect(rosterMoveBlockedStatus("not-a-member")).toBe(409);
    expect(rosterMoveBlockedStatus("same-team")).toBe(409);
  });
});
