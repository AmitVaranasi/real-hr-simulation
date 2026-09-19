import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeaderboardRelease } from "../LeaderboardRelease";

describe("LeaderboardRelease", () => {
  const reload = vi.fn();

  beforeEach(() => {
    reload.mockClear();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a hint instead of a list when no round has been closed", () => {
    render(
      <LeaderboardRelease
        sessionId="sess-1"
        rounds={[{ id: "r1", round_number: 1, status: "open", leaderboard_released: false }]}
      />
    );
    expect(
      screen.getByText("Close a round to release its leaderboard.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("only lists closed rounds, filtering out open ones", () => {
    render(
      <LeaderboardRelease
        sessionId="sess-1"
        rounds={[
          { id: "r1", round_number: 1, status: "closed", leaderboard_released: false },
          { id: "r2", round_number: 2, status: "open", leaderboard_released: false },
        ]}
      />
    );
    expect(screen.getByText("Round 1", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("Round 2", { exact: false })).not.toBeInTheDocument();
  });

  it("releasing a hidden round's leaderboard PATCHes released:true and reloads", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true } as Response)));
    const user = userEvent.setup();
    render(
      <LeaderboardRelease
        sessionId="sess-1"
        rounds={[{ id: "r1", round_number: 1, status: "closed", leaderboard_released: false }]}
      />
    );
    await user.click(screen.getByRole("button", { name: "Release leaderboard" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/sessions/sess-1/rounds/r1/leaderboard",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ released: true }),
      })
    );
    expect(reload).toHaveBeenCalled();
  });

  it("a released round shows a Released badge and its button toggles released:false on click", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true } as Response)));
    const user = userEvent.setup();
    render(
      <LeaderboardRelease
        sessionId="sess-1"
        rounds={[{ id: "r1", round_number: 1, status: "closed", leaderboard_released: true }]}
      />
    );
    expect(screen.getByText("Released")).toBeInTheDocument();
    const hideButton = screen.getByRole("button", { name: "Hide leaderboard" });
    await user.click(hideButton);

    expect(fetch).toHaveBeenCalledWith(
      "/api/sessions/sess-1/rounds/r1/leaderboard",
      expect.objectContaining({
        body: JSON.stringify({ released: false }),
      })
    );
  });

  it("disables only the button for the round currently in flight", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          })
      )
    );
    const user = userEvent.setup();
    render(
      <LeaderboardRelease
        sessionId="sess-1"
        rounds={[
          { id: "r1", round_number: 1, status: "closed", leaderboard_released: false },
          { id: "r2", round_number: 2, status: "closed", leaderboard_released: false },
        ]}
      />
    );
    const buttons = screen.getAllByRole("button", { name: "Release leaderboard" });
    await user.click(buttons[0]);

    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeEnabled();

    resolveFetch({ ok: true } as Response);
  });
});
