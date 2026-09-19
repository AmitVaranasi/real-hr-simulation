import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CurrentRoundCard } from "../CurrentRoundCard";

describe("CurrentRoundCard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows the open round's number, type, and economy when one is open", () => {
    render(
      <CurrentRoundCard
        initialOpenRound={{
          id: "r1",
          round_number: 3,
          round_type: "Quarterly",
          status: "open",
          economy_condition: "Growth",
        }}
      />
    );
    expect(
      screen.getByText(/Round 3 \(Quarterly\) is open/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Growth economy/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Make decisions →" });
    expect(link).toHaveAttribute("href", "/round/r1/decisions");
  });

  it("shows a waiting message and a disabled-until-clicked check button when no round is open", () => {
    render(<CurrentRoundCard initialOpenRound={null} />);
    expect(screen.getByText(/No round open yet/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Check now" })
    ).toBeInTheDocument();
  });

  it("polls the dashboard endpoint and reveals the round when the user clicks Check now", async () => {
    const user = userEvent.setup();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        openRound: {
          id: "r2",
          round_number: 1,
          round_type: "Annual",
          status: "open",
          economy_condition: "Recession",
        },
      }),
    });

    render(<CurrentRoundCard initialOpenRound={null} />);
    await user.click(screen.getByRole("button", { name: "Check now" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Round 1 \(Annual\) is open/)
      ).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/student/dashboard",
      expect.objectContaining({ cache: "no-store" })
    );
  });
});
