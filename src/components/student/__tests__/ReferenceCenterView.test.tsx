import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReferenceCenterView } from "../resources/ReferenceCenterView";
import type { ResourcesContext } from "../resources/ResourcesShared";

const context: ResourcesContext = {
  roundLabel: "Round 4",
  roundOpen: true,
  industry: "Tech",
  strategy: "Differentiation",
  economy: "normal",
};

describe("ReferenceCenterView", () => {
  it("renders every reference card with a numbered heading and its own link", () => {
    render(<ReferenceCenterView context={context} />);
    expect(
      screen.getByRole("heading", {
        name: /1\. Understanding the HR Balance Scorecard/,
      })
    ).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "View Reference →" });
    expect(links.length).toBeGreaterThan(1);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/resources/reference");
    }
  });

  it("lists the learning outcomes for a card", () => {
    render(<ReferenceCenterView context={context} />);
    expect(
      screen.getByText("The four perspectives and what they measure")
    ).toBeInTheDocument();
  });

  it("links back to Resources and the Dashboard", () => {
    render(<ReferenceCenterView context={context} />);
    expect(
      screen.getByRole("link", { name: "← Back to Resources" })
    ).toHaveAttribute("href", "/resources");
    expect(
      screen.getByRole("link", { name: "Back to Dashboard →" })
    ).toHaveAttribute("href", "/dashboard");
  });
});
