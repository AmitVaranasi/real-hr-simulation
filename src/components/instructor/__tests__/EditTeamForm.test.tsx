import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditTeamForm } from "../EditTeamForm";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const TEAM = {
  id: "team-1",
  name: "Alpha Squad",
  industry: "Manufacturing" as const,
  strategy: "Focus" as const,
  join_code: "ABCD",
};

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("EditTeamForm", () => {
  beforeEach(() => {
    refresh.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pre-fills the form fields from the given team", () => {
    render(<EditTeamForm sessionId="sess-1" team={TEAM} />);
    expect(screen.getByRole("textbox", { name: "Team name" })).toHaveValue(
      "Alpha Squad"
    );
    expect(screen.getByRole("combobox", { name: "Industry" })).toHaveValue(
      "Manufacturing"
    );
    expect(screen.getByRole("combobox", { name: "Strategy" })).toHaveValue(
      "Focus"
    );
  });

  it("saves edits via PATCH with the team id, shows Saved, and refreshes the route", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse({}))));
    const user = userEvent.setup();
    render(<EditTeamForm sessionId="sess-1" team={TEAM} />);

    const nameInput = screen.getByRole("textbox", { name: "Team name" });
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed Squad");
    await user.click(screen.getByRole("button", { name: "Update team" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/sessions/sess-1/teams",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          teamId: "team-1",
          name: "Renamed Squad",
          industry: "Manufacturing",
          strategy: "Focus",
        }),
      })
    );
    expect(await screen.findByRole("button", { name: "Saved" })).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the server error and does not flip to Saved when the PATCH fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ error: "Team name already in use" }, false))
      )
    );
    const user = userEvent.setup();
    render(<EditTeamForm sessionId="sess-1" team={TEAM} />);
    await user.click(screen.getByRole("button", { name: "Update team" }));

    expect(
      await screen.findByText("Team name already in use")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Saved" })).not.toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("re-attempting after an error clears the previous error message", async () => {
    const fetchMock = vi.fn();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "Team name already in use" }, false)
    );
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<EditTeamForm sessionId="sess-1" team={TEAM} />);

    await user.click(screen.getByRole("button", { name: "Update team" }));
    expect(await screen.findByText("Team name already in use")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Update team" }));
    expect(
      screen.queryByText("Team name already in use")
    ).not.toBeInTheDocument();
  });
});
