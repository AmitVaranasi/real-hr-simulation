import { describe, expect, it } from "vitest";
import { strategyPoints, hrImplications } from "../industry-strategy-brief";

describe("strategyPoints", () => {
  it("returns the strategy-specific points for a known strategy", () => {
    const points = strategyPoints("Innovation");
    expect(points).toContain(
      "Invest in learning, succession, and HR technology"
    );
    expect(points).toHaveLength(5);
  });

  it("falls back to generic guidance for an unknown strategy", () => {
    const points = strategyPoints("Not A Real Strategy");
    expect(points[0]).toBe(
      "Align recruitment, performance, and development with how you compete"
    );
  });

  it("falls back to generic guidance for null/undefined", () => {
    expect(strategyPoints(null)).toEqual(strategyPoints(undefined));
    expect(strategyPoints(null)[0]).toBe(
      "Align recruitment, performance, and development with how you compete"
    );
  });

  it("falls back for an empty string strategy", () => {
    expect(strategyPoints("")[0]).toBe(
      "Align recruitment, performance, and development with how you compete"
    );
  });
});

describe("hrImplications", () => {
  it("interpolates industry and strategy into the Talent Needs line", () => {
    const implications = hrImplications("High-Tech", "Innovation");
    const talent = implications.find((i) => i.label === "Talent Needs");
    expect(talent?.text).toBe(
      "Hire and develop the skills a High-Tech workforce needs to execute a Innovation strategy."
    );
  });

  it("always returns all seven HR dimensions in a fixed order", () => {
    const implications = hrImplications("Retail", "Focus");
    expect(implications.map((i) => i.label)).toEqual([
      "Talent Needs",
      "Workforce Planning",
      "Training & Development",
      "Performance Management",
      "Compensation Strategy",
      "Employee Engagement",
      "Change & Innovation",
    ]);
  });
});
