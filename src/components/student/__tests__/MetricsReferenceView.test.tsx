import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricsReferenceView } from "../resources/MetricsReferenceView";
import type { ResourcesContext } from "../resources/ResourcesShared";

const context: ResourcesContext = {
  roundLabel: "Round 2",
  roundOpen: false,
  industry: "Finance",
  strategy: "Cost Leadership",
  economy: "recession",
};

describe("MetricsReferenceView", () => {
  it("groups metrics under their category headings", () => {
    render(<MetricsReferenceView context={context} />);
    expect(
      screen.getByRole("heading", { name: "Talent Acquisition Metrics" })
    ).toBeInTheDocument();
    expect(screen.getByText("Cost per Hire")).toBeInTheDocument();
    expect(screen.getByText(/Total cost to recruit and hire one employee\./)).toBeInTheDocument();
  });

  it("renders every metric as a real, focusable button", () => {
    render(<MetricsReferenceView context={context} />);
    const button = screen.getByRole("button", { name: /Cost per Hire/ });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe("BUTTON");
  });

  it("links to the reference center from the help sidebar", () => {
    render(<MetricsReferenceView context={context} />);
    expect(
      screen.getByRole("link", { name: /Go to Reference Center/ })
    ).toHaveAttribute("href", "/resources/reference");
  });
});
