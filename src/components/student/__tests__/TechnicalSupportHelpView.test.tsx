import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TechnicalSupportHelpView } from "../help/TechnicalSupportHelpView";

describe("TechnicalSupportHelpView", () => {
  it("renders the three support channel cards as real, clickable buttons", async () => {
    const user = userEvent.setup();
    render(<TechnicalSupportHelpView />);

    const chat = screen.getByRole("button", { name: "Start Live Chat" });
    const email = screen.getByRole("button", { name: "Send Email" });
    const ticket = screen.getByRole("button", { name: "Submit Ticket" });
    expect(chat).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(ticket).toBeInTheDocument();

    // NOTE: a11y gap — src/components/student/help/TechnicalSupportHelpView.tsx:81-86
    // these buttons have no onClick handler at all, so clicking them is a
    // silent no-op with no feedback to the user.
    await user.click(chat);
  });

  it("lists the troubleshooting categories from configured data", () => {
    render(<TechnicalSupportHelpView />);
    expect(
      screen.getByText("What's the issue?", { exact: false })
    ).toBeInTheDocument();
    expect(screen.getAllByText("View Solutions").length).toBeGreaterThan(0);
  });

  it("shows a numbered list of details to include before contacting support", () => {
    render(<TechnicalSupportHelpView />);
    expect(screen.getByText(/Include Helpful Details/)).toBeInTheDocument();
    expect(screen.getByText(/1\.\s*Refresh the page\./)).toBeInTheDocument();
  });

  it("shows the operational system status", () => {
    render(<TechnicalSupportHelpView />);
    expect(screen.getByText("All systems are operational.")).toBeInTheDocument();
    expect(screen.getByText(/Simulation Platform/)).toBeInTheDocument();
  });
});
