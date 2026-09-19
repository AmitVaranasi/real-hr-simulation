import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResourcesOverview } from "../ResourcesOverview";
import type { ResourcesContext } from "../resources/ResourcesShared";

const context: ResourcesContext = {
  roundLabel: "Round 2",
  roundOpen: true,
  industry: "Retail",
  strategy: "Differentiation",
  economy: "Stable",
};

describe("ResourcesOverview", () => {
  it("shows the round/industry/strategy/economy context cards", () => {
    render(<ResourcesOverview context={context} />);
    expect(screen.getByText("Round 2")).toBeInTheDocument();
    expect(screen.getByText("Retail")).toBeInTheDocument();
    expect(screen.getByText("Differentiation")).toBeInTheDocument();
    expect(screen.getByText("Stable")).toBeInTheDocument();
    expect(screen.getByText("OPEN")).toBeInTheDocument();
  });

  it("links each of the four resource sections to its own page", () => {
    render(<ResourcesOverview context={context} />);
    expect(
      screen.getByRole("link", { name: "View All Learning Guides →" })
    ).toHaveAttribute("href", "/resources/learning-guides");
    expect(
      screen.getByRole("link", { name: "Explore Reference Center →" })
    ).toHaveAttribute("href", "/resources/reference");
    expect(
      screen.getByRole("link", { name: "View All Metrics →" })
    ).toHaveAttribute("href", "/resources/metrics");
    expect(
      screen.getByRole("link", { name: "View All Downloads →" })
    ).toHaveAttribute("href", "/resources/downloads");
  });

  it("links back to the dashboard", () => {
    render(<ResourcesOverview context={context} />);
    expect(
      screen.getByRole("link", { name: "← Back to Dashboard" })
    ).toHaveAttribute("href", "/dashboard");
  });

  it("previews only the first four simulation downloads plus two course downloads", () => {
    render(<ResourcesOverview context={context} />);
    expect(screen.getByText("Student Simulation Guide")).toBeInTheDocument();
    expect(screen.getByText("Team Reflection Template")).toBeInTheDocument();
    expect(screen.getByText("Assignment Instructions")).toBeInTheDocument();
    expect(screen.getByText("Course Syllabus")).toBeInTheDocument();
    // Not part of the 4+2 preview slice.
    expect(screen.queryByText("Team Charter Template")).not.toBeInTheDocument();
    expect(screen.queryByText("Grading Rubrics")).not.toBeInTheDocument();
  });

  it("does not show the OPEN badge when the round is not open", () => {
    render(<ResourcesOverview context={{ ...context, roundOpen: false }} />);
    expect(screen.queryByText("OPEN")).not.toBeInTheDocument();
  });
});
