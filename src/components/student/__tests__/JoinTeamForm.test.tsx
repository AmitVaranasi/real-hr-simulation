import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JoinTeamForm } from "../JoinTeamForm";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

describe("JoinTeamForm", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("fetch", vi.fn());
    push.mockClear();
    refresh.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("associates the join-code input with its label", () => {
    render(<JoinTeamForm />);
    expect(
      screen.getByLabelText(/Team join code/)
    ).toBeInTheDocument();
  });

  it("keeps the submit button disabled until a team is found for the code", async () => {
    const user = userEvent.setup({ delay: null });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        team: {
          name: "Rocket Co",
          industry: "Aerospace",
          strategy: "Cost leadership",
          sessions: { name: "Fall 2026" },
        },
      }),
    });

    render(<JoinTeamForm />);
    const submit = screen.getByRole("button", { name: "Join this team" });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/Team join code/), "abcd1234");
    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => expect(submit).not.toBeDisabled());
    expect(screen.getByText("Rocket Co")).toBeInTheDocument();
  });

  it("shows a preview error when the code does not match any team", async () => {
    const user = userEvent.setup({ delay: null });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    render(<JoinTeamForm />);
    await user.type(screen.getByLabelText(/Team join code/), "nomatch1");
    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() =>
      expect(
        screen.getByText(/No team found for this code/)
      ).toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: "Join this team" })
    ).toBeDisabled();
  });

  it("shows the switch-team warning and label only when allowSwitch is set", () => {
    const { rerender } = render(<JoinTeamForm />);
    expect(
      screen.queryByText(/Joining will leave your current team/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Switch to this team" })
    ).not.toBeInTheDocument();

    rerender(<JoinTeamForm allowSwitch />);
    expect(
      screen.getByText(/Joining will leave your current team/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch to this team" })
    ).toBeInTheDocument();
  });

  it("joins the team and navigates to the dashboard on submit", async () => {
    const user = userEvent.setup({ delay: null });
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          team: {
            name: "Rocket Co",
            industry: "Aerospace",
            strategy: "Cost leadership",
            sessions: { name: "Fall 2026" },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<JoinTeamForm />);
    await user.type(screen.getByLabelText(/Team join code/), "abcd1234");
    await vi.advanceTimersByTimeAsync(500);
    const submit = await screen.findByRole("button", {
      name: "Join this team",
    });
    await waitFor(() => expect(submit).not.toBeDisabled());

    await user.click(submit);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(refresh).toHaveBeenCalled();
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/teams/join",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ join_code: "abcd1234" }),
      })
    );
  });
});
