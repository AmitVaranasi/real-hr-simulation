import { describe, expect, it } from "vitest";
import { createDefaultDecision } from "@/lib/engine/defaults";
import { CONFLICT_CONFIG } from "@/lib/engine/programs";
import { totalHires } from "@/lib/engine/roles";
import { decisionToRow } from "@/lib/db/decisions";
import type { Decision } from "@/lib/engine/types";

describe("decisionToRow", () => {
  it("collapses positions_to_fill into a single total and mirrors bonus_tier into both pay columns", () => {
    const decision = createDefaultDecision();
    const row = decisionToRow(decision, "team-1", "round-1");

    expect(row.positions_to_fill).toBe(totalHires(decision.positions_to_fill));
    expect(row.performance_pay_pct).toBe(decision.bonus_tier);
    expect(row.bonus_pool_pct).toBe(decision.bonus_tier);
  });

  it("looks up conflict_budget from CONFLICT_CONFIG for the chosen approach", () => {
    const decision = createDefaultDecision({ conflict_approach: "coaching" });
    const row = decisionToRow(decision, "team-1", "round-1");
    expect(row.conflict_budget).toBe(CONFLICT_CONFIG.coaching.cost);
  });

  it("maps developmental_programs[0] === 'Technical Skills' to a 'Technical' training_focus, and anything else to 'Leadership'", () => {
    const technical = createDefaultDecision({
      developmental_programs: ["Technical Skills"],
    });
    const leadership = createDefaultDecision({
      developmental_programs: ["Managerial Skills"],
    });
    const compliance = createDefaultDecision({
      developmental_programs: ["Compliance"],
    });

    expect(decisionToRow(technical, "t", "r").training_focus).toBe("Technical");
    expect(decisionToRow(leadership, "t", "r").training_focus).toBe("Leadership");
    // NOTE: suspected bug — any non-"Technical Skills" first program (including
    // "Compliance") collapses to "Leadership"; there is no dedicated mapping for
    // Compliance or Managerial Skills despite both being valid DevelopmentalProgram values.
    expect(decisionToRow(compliance, "t", "r").training_focus).toBe("Leadership");
  });

  it("only stamps submitted_by/submitted_at when is_submitted is true, preferring the passed-in userId over decision.submitted_by", () => {
    const decision = createDefaultDecision({
      is_submitted: true,
      submitted_by: "decision-owner",
    });
    const withUserId = decisionToRow(decision, "t", "r", "explicit-user");
    expect(withUserId.submitted_by).toBe("explicit-user");
    expect(withUserId.submitted_at).not.toBeNull();

    const withoutUserId = decisionToRow(decision, "t", "r");
    expect(withoutUserId.submitted_by).toBe("decision-owner");

    const draft = decisionToRow(
      createDefaultDecision({ is_submitted: false }),
      "t",
      "r",
      "explicit-user"
    );
    expect(draft.submitted_by).toBeNull();
    expect(draft.submitted_at).toBeNull();
  });

  it("falls back to createDefaultDecision() values for every optional field left undefined on the Decision", () => {
    const defaults = createDefaultDecision();
    // Simulate a partially-populated Decision (e.g. from a very old client) by
    // deleting optional fields the type declares as always-present but callers
    // in practice may omit before this function ever receives them.
    const sparse = { ...createDefaultDecision() } as Decision;
    delete (sparse as Partial<Decision>).screening_rigor;
    delete (sparse as Partial<Decision>).diversity_goal_pct;
    delete (sparse as Partial<Decision>).hr_tech_level;
    delete (sparse as Partial<Decision>).span_of_control;

    const row = decisionToRow(sparse, "t", "r");
    expect(row.screening_rigor).toBe(defaults.screening_rigor);
    expect(row.diversity_goal_pct).toBe(defaults.diversity_goal_pct);
    expect(row.hr_tech_level).toBe(defaults.hr_tech_level);
    expect(row.span_of_control).toBe(defaults.span_of_control);
    const orgDesign = row.org_design_json as { span_of_control: number };
    expect(orgDesign.span_of_control).toBe(defaults.span_of_control);
  });

  it("nests org design and DEI fields under org_design_json / dei_initiatives_json", () => {
    const decision = createDefaultDecision({
      organizational_structure: "Matrix",
      dei_equity_practices: "Advanced",
    });
    const row = decisionToRow(decision, "t", "r");
    const org = row.org_design_json as Record<string, unknown>;
    const dei = row.dei_initiatives_json as Record<string, unknown>;
    expect(org.organizational_structure).toBe("Matrix");
    expect(dei.dei_equity_practices).toBe("Advanced");
  });
});
