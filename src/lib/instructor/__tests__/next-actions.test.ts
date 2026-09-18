import { describe, expect, it } from "vitest";
import { nextActions, MAX_RAIL_ACTIONS, type NextActionContext } from "../next-actions";

/**
 * iteration5.test.ts already covers roundLifecycle() and the top-priority
 * title per lifecycle. This file covers the remaining rules in next-actions.ts
 * that aren't pinned elsewhere: the MAX_RAIL_ACTIONS truncation itself, the
 * "primary" flag shifting depending on whether a team is selected, and that
 * Team Discussion only appears (and is appended last) when a team is chosen.
 */

const base: NextActionContext = {
  sessionId: "s1",
  teamsSubmitted: 2,
  teamsTotal: 6,
  selectedTeamId: null,
  selectedTeamName: null,
  openRoundId: "r1",
  latestClosedRoundId: null,
  lifecycle: "deciding",
};

describe("nextActions", () => {
  it("caps output at MAX_RAIL_ACTIONS even when a team is selected in deciding state", () => {
    const actions = nextActions({
      ...base,
      lifecycle: "deciding",
      selectedTeamId: "t1",
      selectedTeamName: "Crazy Managers",
    });
    // Make HR Decisions + Review & Submit + Team Discussion = 3 candidates
    expect(actions.length).toBeLessThanOrEqual(MAX_RAIL_ACTIONS);
    expect(actions.map((a) => a.title)).toEqual([
      "Make HR Decisions",
      "Review & Submit",
      "Team Discussion",
    ]);
  });

  it("marks Review & Submit primary when deciding with no team selected", () => {
    const actions = nextActions({ ...base, lifecycle: "deciding", selectedTeamId: null });
    const review = actions.find((a) => a.title === "Review & Submit");
    expect(review?.primary).toBe(true);
  });

  it("marks Review & Submit non-primary when a team is selected (Make HR Decisions leads)", () => {
    const actions = nextActions({
      ...base,
      lifecycle: "deciding",
      selectedTeamId: "t1",
      selectedTeamName: "Crazy Managers",
    });
    const review = actions.find((a) => a.title === "Review & Submit");
    expect(review?.primary).toBe(false);
  });

  it("omits Team Discussion entirely when no team is selected", () => {
    const actions = nextActions({ ...base, lifecycle: "no-round", selectedTeamId: null });
    expect(actions.some((a) => a.title === "Team Discussion")).toBe(false);
  });

  it("appends Team Discussion as team-scoped whenever a team is selected, regardless of lifecycle", () => {
    for (const lifecycle of ["no-round", "awaiting-close", "processed"] as const) {
      const actions = nextActions({
        ...base,
        lifecycle,
        selectedTeamId: "t1",
        selectedTeamName: "Crazy Managers",
      });
      const discussion = actions.find((a) => a.title === "Team Discussion");
      expect(discussion?.teamScoped).toBe(true);
      expect(discussion?.body).toContain("Crazy Managers");
    }
  });

  it("falls back to a generic team name when selectedTeamName is null", () => {
    const actions = nextActions({
      ...base,
      lifecycle: "deciding",
      selectedTeamId: "t1",
      selectedTeamName: null,
    });
    const make = actions.find((a) => a.title === "Make HR Decisions");
    expect(make?.body).toContain("the selected team");
  });

  it("awaiting-close orders Close Round before Review & Submit", () => {
    const actions = nextActions({ ...base, lifecycle: "awaiting-close" });
    expect(actions.map((a) => a.title)).toEqual(["Close Round", "Review & Submit"]);
    expect(actions[0].primary).toBe(true);
    expect(actions[1].primary).toBeFalsy();
  });
});
