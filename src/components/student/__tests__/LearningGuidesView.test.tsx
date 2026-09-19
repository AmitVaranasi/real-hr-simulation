import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LearningGuidesView } from "../resources/LearningGuidesView";
import type { ResourcesContext } from "../resources/ResourcesShared";

const context: ResourcesContext = {
  roundLabel: "Round 3",
  roundOpen: true,
  industry: "Healthcare",
  strategy: "Innovation",
  economy: "boom",
};

describe("LearningGuidesView", () => {
  it("renders every guide as a numbered link to its own /learn page", () => {
    render(<LearningGuidesView context={context} />);
    const link = screen.getByRole("link", {
      name: /1\. Recruitment & Selection/,
    });
    expect(link).toHaveAttribute("href", "/learn/recruitment");
  });

  it("shows each guide's key metrics", () => {
    render(<LearningGuidesView context={context} />);
    expect(screen.getByText("Cost per Hire")).toBeInTheDocument();
    expect(screen.getByText("Turnover Rate")).toBeInTheDocument();
  });

  it("links to the reference center from the help sidebar", () => {
    render(<LearningGuidesView context={context} />);
    expect(
      screen.getByRole("link", { name: /Go to Reference Center/ })
    ).toHaveAttribute("href", "/resources/reference");
  });
});
