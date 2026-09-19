import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudentLanding, type StudentLandingProps } from "../StudentLanding";

const baseTeam: StudentLandingProps["team"] = {
  id: "team-1",
  name: "Acme Corp",
  industry: "Retail",
  strategy: "Cost Leadership",
  headcount: 120,
  revenue: 5_000_000,
  stock_price: 42.5,
  budget_carryover: 0,
};

const baseProps: StudentLandingProps = {
  displayName: "Jamie",
  sessionName: "Fall 2026",
  announcement: null,
  team: baseTeam,
  budgetBase: 100_000,
  roundsTotal: 4,
  roundsCompleted: 1,
  lastScore: 72.3,
  lastSummary: null,
  lastProfit: 250_000,
  teamsInClass: 12,
  initialOpenRound: null,
  initialDecision: null,
};

describe("StudentLanding", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the team name in the dashboard heading", () => {
    render(<StudentLanding {...baseProps} />);
    expect(
      screen.getByRole("heading", { name: "Acme Corp Dashboard" })
    ).toBeInTheDocument();
  });

  it("shows a waiting-for-instructor state when no round is open", () => {
    render(<StudentLanding {...baseProps} />);
    expect(screen.getAllByText("Waiting for instructor").length).toBeGreaterThan(0);
    expect(screen.queryByText("OPEN")).not.toBeInTheDocument();
  });

  it("shows the open round title, OPEN badge, and decisions link when a round is open", () => {
    render(
      <StudentLanding
        {...baseProps}
        initialOpenRound={{
          id: "round-5",
          round_number: 2,
          round_type: "practice",
          status: "open",
          economy_condition: "boom",
        }}
        initialDecision={{ exists: false, is_submitted: false }}
      />
    );
    expect(screen.getByText("Practice Round 2")).toBeInTheDocument();
    expect(screen.getByText("OPEN")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue to Decisions →" })
    ).toHaveAttribute("href", "/round/round-5/decisions");
  });

  it("shows Submitted status once the team's decision is submitted", () => {
    render(
      <StudentLanding
        {...baseProps}
        initialOpenRound={{
          id: "round-5",
          round_number: 2,
          round_type: "competition",
          status: "open",
          economy_condition: "normal",
        }}
        initialDecision={{ exists: true, is_submitted: true }}
      />
    );
    expect(screen.getByText("Submitted")).toBeInTheDocument();
  });

  it("shows the announcement only when one is provided", () => {
    const { rerender } = render(<StudentLanding {...baseProps} />);
    expect(
      screen.queryByText("Professor announcement")
    ).not.toBeInTheDocument();

    rerender(
      <StudentLanding {...baseProps} announcement="Round closes Friday." />
    );
    expect(screen.getByText("Professor announcement")).toBeInTheDocument();
    expect(screen.getByText("Round closes Friday.")).toBeInTheDocument();
  });

  it("displays team metrics from props", () => {
    render(<StudentLanding {...baseProps} />);
    expect(screen.getByText("120")).toBeInTheDocument(); // headcount
    expect(screen.getByText("$42.50")).toBeInTheDocument(); // stock price
    expect(screen.getAllByText("72.3").length).toBeGreaterThan(0); // last score
    expect(screen.getByText("12")).toBeInTheDocument(); // teams in class
  });

  it("polls the dashboard endpoint every 5s and updates the round title on refresh", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        openRound: {
          id: "round-9",
          round_number: 3,
          round_type: "competition",
          status: "open",
          economy_condition: "recession",
        },
        decision: { exists: false, is_submitted: false },
      }),
    });

    render(<StudentLanding {...baseProps} />);
    await vi.advanceTimersByTimeAsync(5000);

    expect(fetch).toHaveBeenCalledWith(
      "/api/student/dashboard",
      expect.objectContaining({ cache: "no-store" })
    );
    await waitFor(() =>
      expect(screen.getByText("Competition Round 3")).toBeInTheDocument()
    );
    vi.useRealTimers();
  });

  it("links to the leaderboard and workforce brief report", () => {
    render(<StudentLanding {...baseProps} />);
    expect(
      screen.getByRole("link", { name: "View Leaderboard" })
    ).toHaveAttribute("href", "/leaderboard");
    expect(
      screen.getByRole("link", { name: "View Full Report →" })
    ).toHaveAttribute("href", "/reports/workforce-brief");
  });
});
