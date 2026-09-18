import { describe, expect, it } from "vitest";
import {
  DEFAULT_INDUSTRY_NORMS,
  formatNormRange,
  MODULE_TAB_GUIDANCE,
} from "../industry-norms";

describe("DEFAULT_INDUSTRY_NORMS", () => {
  it("defines a profile for every Industry", () => {
    const industries = ["Manufacturing", "Service", "High-Tech", "Banking", "Retail"];
    for (const industry of industries) {
      expect(DEFAULT_INDUSTRY_NORMS).toHaveProperty(industry);
    }
  });

  it("org_design has no seeded norm on any industry (placeholder per Org Design/DEI comment)", () => {
    for (const profile of Object.values(DEFAULT_INDUSTRY_NORMS)) {
      expect(profile.org_design).toBeUndefined();
    }
  });
});

describe("formatNormRange", () => {
  it("prefers the suggested range when present", () => {
    expect(formatNormRange({ suggested: [5, 8], label: "Training" })).toBe(
      "5%–8% of HR budget"
    );
  });

  it("falls back to min-max when no suggested range is set", () => {
    expect(formatNormRange({ min: 10, max: 20, label: "X" })).toBe(
      "10%–20% of HR budget"
    );
  });

  it("formats a max-only range as an upper bound", () => {
    expect(formatNormRange({ max: 5, label: "Performance" })).toBe(
      "Up to 5% of HR budget"
    );
  });

  it("formats a min-only range as a lower bound", () => {
    expect(formatNormRange({ min: 15, label: "Recruitment" })).toBe(
      "At least 15% of HR budget"
    );
  });

  it("returns an empty string when the norm carries no bounds at all", () => {
    expect(formatNormRange({ label: "Empty" })).toBe("");
  });

  it("min+max wins over max-only branch when both min and max are set", () => {
    // Guards against the min/max checks being reordered so that only "max"
    // fires and silently drops the "min" half of the message.
    const result = formatNormRange({ min: 3, max: 8, label: "Training" });
    expect(result).toContain("3%");
    expect(result).toContain("8%");
  });
});

describe("MODULE_TAB_GUIDANCE", () => {
  it("maps every real budget module to a non-empty tab list except DEI", () => {
    expect(MODULE_TAB_GUIDANCE.Recruitment).toEqual(["recruitment"]);
    expect(MODULE_TAB_GUIDANCE.Compensation).toEqual(["compensation"]);
  });

  it("DEI intentionally maps to an empty list — no budget module backs it yet", () => {
    expect(MODULE_TAB_GUIDANCE.DEI).toEqual([]);
  });
});
