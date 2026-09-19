import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavigationHelpView } from "../help/NavigationHelpView";

describe("NavigationHelpView", () => {
  it("renders every navigation area as a link to its own destination", () => {
    render(<NavigationHelpView />);
    expect(
      screen.getByRole("link", { name: /Getting Started/ })
    ).toHaveAttribute("href", "/dashboard/getting-started");
  });

  it("gives every rendered link a real href", () => {
    render(<NavigationHelpView />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(3);
    for (const link of links) {
      expect(link.getAttribute("href")).toBeTruthy();
    }
  });

  it("links back to the Help Center", () => {
    render(<NavigationHelpView />);
    expect(
      screen.getByRole("link", { name: /Back to Help Center/ })
    ).toHaveAttribute("href", "/help");
  });
});
