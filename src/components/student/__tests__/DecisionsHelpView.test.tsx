import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DecisionsHelpView } from "../help/DecisionsHelpView";

describe("DecisionsHelpView", () => {
  it("renders the decision topics grid with working links", () => {
    render(<DecisionsHelpView />);
    const overview = screen.getByRole("link", { name: /Overview/ });
    expect(overview).toHaveAttribute("href", "/help/decisions#overview");
  });

  it("links out to the HR decision learning guides", () => {
    render(<DecisionsHelpView />);
    expect(
      screen.getByRole("link", { name: /Go to HR Decision Learning Guides/ })
    ).toHaveAttribute("href", "/resources/learning-guides");
  });

  it("does not claim to recommend specific decisions", () => {
    render(<DecisionsHelpView />);
    expect(
      screen.getByText(/It does not recommend what decisions you should make\./)
    ).toBeInTheDocument();
  });
});
