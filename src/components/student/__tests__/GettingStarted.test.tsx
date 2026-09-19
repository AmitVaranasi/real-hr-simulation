import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GettingStarted, type GettingStartedProps } from "../GettingStarted";

const baseProps: GettingStartedProps = {
  displayName: "Jamie Lee",
  firstName: "Jamie",
  hasTeam: false,
  teamName: null,
  courseLabel: "HR 301",
  industry: null,
  strategy: null,
  openRoundId: null,
  openRoundNumber: null,
  openRoundLabel: "No round open",
  decisionDraft: false,
  decisionSubmitted: false,
  roundsCompleted: 0,
};

describe("GettingStarted", () => {
  it("greets the student by first name", () => {
    render(<GettingStarted {...baseProps} />);
    expect(
      screen.getByRole("heading", { name: /Welcome, Jamie/ })
    ).toBeInTheDocument();
  });

  it("prompts to join a team when the student has none, and locks later steps", () => {
    render(<GettingStarted {...baseProps} />);
    expect(
      screen.getByRole("link", { name: "Join Your Team" })
    ).toHaveAttribute("href", "/join");
    // Steps 3 and 4 have no action until a team is joined.
    expect(
      screen.queryByRole("link", { name: "Open Brief" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Explore HR Areas" })
    ).not.toBeInTheDocument();
  });

  it("shows team management and brief/explore links once the student has a team", () => {
    render(
      <GettingStarted
        {...baseProps}
        hasTeam
        teamName="Acme Corp"
        industry="Retail"
        strategy="Growth"
      />
    );
    expect(
      screen.getByRole("link", { name: "Manage Team" })
    ).toHaveAttribute("href", "/team/members");
    expect(
      screen.getByRole("link", { name: "Open Brief" })
    ).toHaveAttribute("href", "/team/industry-strategy");
    expect(
      screen.getByRole("link", { name: "Explore HR Areas" })
    ).toHaveAttribute("href", "/learn/recruitment");
  });

  it("disables entering the simulation when the team has no open round", () => {
    render(<GettingStarted {...baseProps} hasTeam teamName="Acme Corp" />);
    const enterButton = screen.getByRole("button", { name: /Enter Simulation/ });
    expect(enterButton).toBeDisabled();
    expect(
      screen.getByText("Round will open when your instructor is ready.")
    ).toBeInTheDocument();
  });

  it("links to the decisions page for the open round, labelled with the round number", () => {
    render(
      <GettingStarted
        {...baseProps}
        hasTeam
        teamName="Acme Corp"
        openRoundId="round-9"
        openRoundNumber={4}
      />
    );
    const link = screen.getByRole("link", { name: "Begin Round 4" });
    expect(link).toHaveAttribute("href", "/round/round-9/decisions");
  });

  it("marks the simulation step complete once the round's decisions are submitted", () => {
    render(
      <GettingStarted
        {...baseProps}
        hasTeam
        teamName="Acme Corp"
        openRoundId="round-9"
        openRoundNumber={4}
        decisionSubmitted
      />
    );
    expect(
      screen.getByText(/Your team has submitted this round/)
    ).toBeInTheDocument();
  });

  it("links out to the Help Center and instructor messaging", () => {
    render(<GettingStarted {...baseProps} />);
    expect(
      screen.getByRole("link", { name: "Go to Help Center" })
    ).toHaveAttribute("href", "/help");
    expect(
      screen.getByRole("link", { name: /Message Instructor/ })
    ).toHaveAttribute("href", "/team/instructor");
  });
});
