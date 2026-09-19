import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScoreOverrideDialog } from "../ScoreOverrideDialog";

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));

function jsonResponse(ok = true) {
  return { ok, json: async () => ({}) } as Response;
}

describe("ScoreOverrideDialog", () => {
  beforeEach(() => {
    toastError.mockClear();
    toastSuccess.mockClear();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse())));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts collapsed, showing only the Override trigger", () => {
    render(<ScoreOverrideDialog teamId="t1" roundId="r1" currentScore={72} />);
    expect(
      screen.getByRole("button", { name: "Override" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("opens the edit form pre-filled with the current score, and Cancel collapses it again without saving", async () => {
    const user = userEvent.setup();
    render(<ScoreOverrideDialog teamId="t1" roundId="r1" currentScore={72} />);
    await user.click(screen.getByRole("button", { name: "Override" }));

    const scoreInput = screen.getByRole("spinbutton", {
      name: "Override score",
    }) as HTMLInputElement;
    expect(scoreInput.value).toBe("72");
    expect(
      screen.getByRole("textbox", { name: "Reason for override" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("saves the new score and reason via PATCH, then reloads the page on success", async () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload },
      writable: true,
    });
    const user = userEvent.setup();
    render(<ScoreOverrideDialog teamId="t1" roundId="r1" currentScore={72} />);
    await user.click(screen.getByRole("button", { name: "Override" }));

    const scoreInput = screen.getByRole("spinbutton");
    await user.clear(scoreInput);
    await user.type(scoreInput, "88");
    await user.type(
      screen.getByPlaceholderText("Reason"),
      "Bonus for exceptional decision quality"
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/override",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          team_id: "t1",
          round_id: "r1",
          override_score: 88,
          reason: "Bonus for exceptional decision quality",
        }),
      })
    );
    expect(await screen.findByRole("button", { name: "Override" })).toBeInTheDocument();
    expect(toastSuccess).toHaveBeenCalledWith("Score updated");
    expect(reload).toHaveBeenCalled();
  });

  it("shows an error toast and keeps the form open when the save request fails", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(false)
    );
    const user = userEvent.setup();
    render(<ScoreOverrideDialog teamId="t1" roundId="r1" currentScore={72} />);
    await user.click(screen.getByRole("button", { name: "Override" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(toastError).toHaveBeenCalledWith("Override failed");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
