import { describe, expect, it } from "vitest";
import { createDefaultDecision } from "../defaults";
import { ROLE_GROUPS } from "../roles";

// createDefaultDecision has no module-level mutable state — it builds a fresh
// object literal on every call and spreads `overrides` last — so there is
// nothing to reset between tests here.
describe("createDefaultDecision", () => {
  it("returns one role_performance entry per ROLE_GROUPS, with managers/executives getting a higher default leadership score", () => {
    const decision = createDefaultDecision();
    expect(decision.role_performance).toHaveLength(ROLE_GROUPS.length);
    for (const rp of decision.role_performance) {
      if (rp.role_id === "manager" || rp.role_id === "executive") {
        expect(rp.leadership).toBe(7);
      } else {
        expect(rp.leadership).toBe(4);
      }
      expect(rp.productivity).toBe(5);
      expect(rp.teamwork).toBe(5);
      expect(rp.communication).toBe(5);
    }
  });

  it("returns one role_compensation entry per ROLE_GROUPS, all at salary_band 0", () => {
    const decision = createDefaultDecision();
    expect(decision.role_compensation).toHaveLength(ROLE_GROUPS.length);
    expect(decision.role_compensation.every((rc) => rc.salary_band === 0)).toBe(
      true
    );
  });

  it("lets a top-level override completely replace the corresponding default field", () => {
    // overrides is spread last (`...overrides` after every hardcoded field),
    // so a caller-supplied key wins outright — this is a shallow replace, not
    // a deep merge: supplying `positions_to_fill` drops the three default
    // entries entirely rather than adding to them.
    const decision = createDefaultDecision({
      positions_to_fill: [{ role_id: "entry", count: 1 }],
    });
    expect(decision.positions_to_fill).toEqual([
      { role_id: "entry", count: 1 },
    ]);
  });

  it("overriding one scalar field leaves all other defaults untouched", () => {
    const decision = createDefaultDecision({ screening_rigor: 3 });
    expect(decision.screening_rigor).toBe(3);
    expect(decision.diversity_goal_pct).toBe(15);
    expect(decision.onboarding_investment).toBe(500);
    expect(decision.hr_tech_level).toBe(0);
  });

  it("defaults developmental_programs to exactly Technical Skills", () => {
    const decision = createDefaultDecision();
    expect(decision.developmental_programs).toEqual(["Technical Skills"]);
  });

  it("does not mutate ROLE_GROUPS or leak state across independent calls", () => {
    // Regression guard for the .map(...) construction: two separate calls
    // must produce independent array instances, and overriding one call's
    // role_performance must not affect a later default call.
    const a = createDefaultDecision({
      role_performance: [
        { role_id: "entry", productivity: 1, teamwork: 1, leadership: 1, communication: 1 },
      ],
    });
    const b = createDefaultDecision();
    expect(a.role_performance).not.toBe(b.role_performance);
    expect(b.role_performance).toHaveLength(ROLE_GROUPS.length);
    expect(b.role_performance[0].productivity).toBe(5);
  });
});
