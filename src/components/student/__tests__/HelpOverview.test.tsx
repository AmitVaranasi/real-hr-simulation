import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HelpOverview } from "../help/HelpOverview";

describe("HelpOverview", () => {
  it("shows all help categories by default", () => {
    render(<HelpOverview />);
    expect(
      screen.getByRole("link", { name: /^Getting Started/ })
    ).toHaveAttribute("href", "/help/getting-started");
    expect(
      screen.getAllByRole("link", { name: /Technical/ }).length
    ).toBeGreaterThan(0);
  });

  it("filters categories as the user types in the search box", async () => {
    const user = userEvent.setup();
    render(<HelpOverview />);

    await user.type(
      screen.getByPlaceholderText(/Search the Help Center/),
      "technical"
    );

    expect(screen.getByText("Technical Support")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Getting Started/ })
    ).not.toBeInTheDocument();
  });

  it("does not navigate on search form submit (search is client-side filtering)", async () => {
    const user = userEvent.setup();
    render(<HelpOverview />);
    const input = screen.getByPlaceholderText(/Search the Help Center/);
    await user.type(input, "reports{enter}");
    // Filtering already happened via onChange; submit is prevented and just
    // re-renders with the same filtered state.
    expect(input).toHaveValue("reports");
  });

  it("links each quick-help item and popular search to its destination", () => {
    render(<HelpOverview />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(5);
    for (const link of links) {
      expect(link).toHaveAttribute("href");
    }
  });

  it("links out to the instructor and technical support", () => {
    render(<HelpOverview />);
    expect(
      screen.getByRole("link", { name: "Contact Your Instructor" })
    ).toHaveAttribute("href", "/team/instructor");
    expect(
      screen.getByRole("link", { name: "Report a Technical Issue" })
    ).toHaveAttribute("href", "/help/technical-support");
  });
});
