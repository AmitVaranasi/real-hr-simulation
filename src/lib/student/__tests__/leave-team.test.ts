import { describe, expect, it } from "vitest";
import { leaveBlockedStatus, leaveEligibility } from "../leave-team";

describe("leave-team eligibility (docs/leave-team-policy.md rule 1)", () => {
  it("lets a student out while the team has submitted nothing", () => {
    expect(
      leaveEligibility({ hasTeam: true, submittedDecisionCount: 0 })
    ).toEqual({ allowed: true });
  });

  it("blocks once the team has a submitted decision", () => {
    const verdict = leaveEligibility({
      hasTeam: true,
      submittedDecisionCount: 1,
    });
    expect(verdict.allowed).toBe(false);
    if (verdict.allowed) return;
    expect(verdict.reason).toBe("submitted");
    expect(verdict.message).toMatch(/instructor/i);
  });

  it("stays blocked for later rounds, not just the first", () => {
    const verdict = leaveEligibility({
      hasTeam: true,
      submittedDecisionCount: 3,
    });
    expect(verdict.allowed).toBe(false);
  });

  it("separates 'no team' from 'too late'", () => {
    const verdict = leaveEligibility({
      hasTeam: false,
      submittedDecisionCount: 0,
    });
    expect(verdict.allowed).toBe(false);
    if (verdict.allowed) return;
    expect(verdict.reason).toBe("no-team");
  });

  it("maps the two refusals to different statuses", () => {
    expect(leaveBlockedStatus("no-team")).toBe(404);
    expect(leaveBlockedStatus("submitted")).toBe(409);
  });
});
