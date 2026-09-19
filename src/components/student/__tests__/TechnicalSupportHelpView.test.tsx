import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TechnicalSupportHelpView } from "../help/TechnicalSupportHelpView";

describe("TechnicalSupportHelpView", () => {
  // Fixed: there is no messaging backend behind this page, so "Start Live
  // Chat", "Send Email", and "Submit Ticket" used to render as live-looking
  // buttons with no onClick — a silent no-op for a student who is already
  // stuck. None of the three can reach a real instructor address from this
  // component's context (no session/team data is fetched here), so all
  // three are now honestly disabled with "coming soon" helper text that
  // points the student to their instructor instead.
  it("renders the three support channel cards as disabled controls with explanatory helper text", () => {
    render(<TechnicalSupportHelpView />);

    const chat = screen.getByRole("button", { name: "Start Live Chat" });
    const email = screen.getByRole("button", { name: "Send Email" });
    const ticket = screen.getByRole("button", { name: "Submit Ticket" });
    expect(chat).toBeDisabled();
    expect(email).toBeDisabled();
    expect(ticket).toBeDisabled();

    expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/contact your instructor/i).length
    ).toBeGreaterThan(0);
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
