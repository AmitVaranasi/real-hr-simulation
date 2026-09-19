import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GettingStartedHelpView } from "../help/GettingStartedHelpView";

describe("GettingStartedHelpView", () => {
  it("opens the first question by default", () => {
    render(<GettingStartedHelpView />);
    const first = screen.getByRole("button", { name: /Where Do I Start\?/ });
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/begin with Getting Started for orientation/)
    ).toBeInTheDocument();
  });

  it("toggles a closed question open and closes the previously open one", async () => {
    const user = userEvent.setup();
    render(<GettingStartedHelpView />);

    const second = screen.getByRole("button", {
      name: /What Should I Review Before Round 1\?/,
    });
    expect(second).toHaveAttribute("aria-expanded", "false");

    await user.click(second);
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: /Where Do I Start\?/ })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("links to the Getting Started dashboard area", () => {
    render(<GettingStartedHelpView />);
    expect(
      screen.getByRole("link", { name: "Go to Getting Started" })
    ).toHaveAttribute("href", "/dashboard/getting-started");
  });

  it("provides links to the FAQ and technical support in the sidebar", () => {
    render(<GettingStartedHelpView />);
    expect(
      screen.getByRole("link", { name: /Frequently Asked Questions/ })
    ).toHaveAttribute("href", "/help/faq");
    expect(
      screen.getByRole("link", { name: "Contact Technical Support" })
    ).toHaveAttribute("href", "/help/technical-support");
  });
});
