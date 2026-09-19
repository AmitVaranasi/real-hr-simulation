import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateTeamForm } from "../CreateTeamForm";

describe("CreateTeamForm", () => {
  const reload = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true } as Response)));
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload },
      writable: true,
    });
    reload.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires a team name before the form can be submitted", async () => {
    render(<CreateTeamForm sessionId="sess-1" />);
    const nameInput = screen.getByRole("textbox", { name: "Team name" });
    expect(nameInput).toBeRequired();
  });

  it("posts the entered team name with the selected industry and strategy", async () => {
    const user = userEvent.setup();
    render(<CreateTeamForm sessionId="sess-1" />);

    await user.type(screen.getByRole("textbox", { name: "Team name" }), "Alpha Squad");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Industry" }),
      "Banking"
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Strategy" }),
      "Innovation"
    );
    await user.click(screen.getByRole("button", { name: "Add team" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/sessions/sess-1/teams",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Alpha Squad",
          industry: "Banking",
          strategy: "Innovation",
        }),
      })
    );
    expect(reload).toHaveBeenCalled();
  });

  it("defaults to Manufacturing / Focus when the selects are left untouched", async () => {
    const user = userEvent.setup();
    render(<CreateTeamForm sessionId="sess-1" />);
    await user.type(screen.getByRole("textbox", { name: "Team name" }), "Beta");
    await user.click(screen.getByRole("button", { name: "Add team" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/sessions/sess-1/teams",
      expect.objectContaining({
        body: JSON.stringify({
          name: "Beta",
          industry: "Manufacturing",
          strategy: "Focus",
        }),
      })
    );
  });
});
