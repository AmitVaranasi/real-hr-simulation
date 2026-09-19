import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FaqHelpView } from "../help/FaqHelpView";

describe("FaqHelpView", () => {
  it("opens the first question by default and toggles others on click", async () => {
    const user = userEvent.setup();
    render(<FaqHelpView />);

    const firstQuestion = screen.getByRole("button", {
      name: /Where can I find my reports and results\?/,
    });
    expect(firstQuestion).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/Access reports from Reports & HR Analytics/)
    ).toBeInTheDocument();

    const secondQuestion = screen.getByRole("button", {
      name: /How do I submit my team's decisions\?/,
    });
    expect(secondQuestion).toHaveAttribute("aria-expanded", "false");

    await user.click(secondQuestion);
    expect(secondQuestion).toHaveAttribute("aria-expanded", "true");
    // Opening a new question closes the previously open one (single-open accordion).
    expect(firstQuestion).toHaveAttribute("aria-expanded", "false");
  });

  it("filters questions by search text", async () => {
    const user = userEvent.setup();
    render(<FaqHelpView />);

    await user.type(
      screen.getByPlaceholderText("Search questions and answers..."),
      "submit"
    );

    expect(
      screen.getByRole("button", { name: /How do I submit my team's decisions\?/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Where can I find my reports and results\?/ })
    ).not.toBeInTheDocument();
  });

  it("shows a no-results message when the search matches nothing", async () => {
    const user = userEvent.setup();
    render(<FaqHelpView />);
    await user.type(
      screen.getByPlaceholderText("Search questions and answers..."),
      "zzzznomatch"
    );
    expect(
      screen.getByText(/No matching questions/)
    ).toBeInTheDocument();
  });

  it("filters questions by topic and toggles the topic filter off on a second click", async () => {
    const user = userEvent.setup();
    render(<FaqHelpView />);

    const topicButton = screen.getByRole("button", { name: /Team & Company/ });
    await user.click(topicButton);
    expect(
      screen.queryByRole("button", { name: /Where can I find my reports and results\?/ })
    ).not.toBeInTheDocument();

    await user.click(topicButton);
    expect(
      screen.getByRole("button", { name: /Where can I find my reports and results\?/ })
    ).toBeInTheDocument();
  });

  it("links out to technical support", () => {
    render(<FaqHelpView />);
    expect(
      screen.getByRole("link", { name: /Contact Technical Support/ })
    ).toHaveAttribute("href", "/help/technical-support");
  });

  it("does not give the search input an accessible name", () => {
    render(<FaqHelpView />);
    // NOTE: a11y gap — src/components/student/help/FaqHelpView.tsx:60-68 wraps
    // the search input in a <label> containing only a decorative Search icon,
    // so the input has no accessible name beyond its placeholder text.
    expect(
      screen.queryByRole("textbox", { name: /search/i })
    ).not.toBeInTheDocument();
  });
});
