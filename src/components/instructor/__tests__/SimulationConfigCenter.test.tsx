import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SimulationConfigCenter } from "../SimulationConfigCenter";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
    blob: async () => new Blob([JSON.stringify(body)]),
  } as Response;
}

const SESSIONS = {
  sessions: [
    {
      id: "s1",
      name: "Fall Cohort",
      rounds: [
        { id: "r1", round_number: 1, round_type: "practice", status: "closed" },
        { id: "r2", round_number: 2, round_type: "regular", status: "open" },
      ],
    },
  ],
};

describe("SimulationConfigCenter", () => {
  beforeEach(() => {
    replace.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        if (url === "/api/simulation-config" && method === "GET") {
          return Promise.resolve(
            jsonResponse({ config: { overrides: {}, updated_at: null }, effective: {} })
          );
        }
        if (url === "/api/sessions") {
          return Promise.resolve(jsonResponse(SESSIONS));
        }
        if (url === "/api/simulation-config" && method === "PATCH") {
          return Promise.resolve(jsonResponse({ ok: true }));
        }
        if (url === "/api/simulation-config" && method === "POST") {
          return Promise.resolve(jsonResponse({ ok: true }));
        }
        if (url === "/api/simulation-config/process-round") {
          return Promise.resolve(jsonResponse({ computed: 3 }));
        }
        return Promise.resolve(jsonResponse({}));
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and shows the overview tab with its config summary by default", async () => {
    render(<SimulationConfigCenter />);
    expect(
      await screen.findByRole("heading", { name: "Configuration" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "(1) Simulation Scope" })
    ).toBeInTheDocument();
  });

  it("switches to the Process Round tab and enables processing only once a session and round are chosen", async () => {
    const user = userEvent.setup();
    render(<SimulationConfigCenter />);
    await screen.findByRole("heading", { name: "Configuration" });

    await user.click(screen.getByRole("button", { name: /Process Round/i }));
    expect(replace).toHaveBeenCalledWith("/sessions/config/process-round");

    const processButton = screen.getByRole("button", {
      name: /Process Next Round/i,
    });
    expect(processButton).toBeDisabled();

    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Session" })
      ).toBeInTheDocument()
    );
    const sessionSelect = screen.getByRole("combobox", { name: "Session" });
    await user.selectOptions(sessionSelect, "s1");

    const roundSelect = screen.getByRole("combobox", {
      name: "Next Round to Process",
    });
    expect(roundSelect).toBeEnabled();
    await user.selectOptions(roundSelect, "r2");

    expect(processButton).toBeEnabled();
    await user.click(processButton);

    expect(
      await screen.findByText("Processed 3 team(s).")
    ).toBeInTheDocument();
  });

  it("saves configuration via PATCH and surfaces the confirmation message", async () => {
    const user = userEvent.setup();
    render(<SimulationConfigCenter />);
    await screen.findByRole("heading", { name: "Configuration" });

    await user.click(
      screen.getByRole("button", { name: /Save & Apply Changes/i })
    );

    expect(
      await screen.findByText(
        "Configuration saved. Students will see updates on next page load."
      )
    ).toBeInTheDocument();

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const patchCall = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "PATCH"
    );
    expect(patchCall).toBeTruthy();
  });

  it("resets configuration to defaults on Reset to Defaults", async () => {
    const user = userEvent.setup();
    render(<SimulationConfigCenter />);
    await screen.findByRole("heading", { name: "Configuration" });

    // Reset lives in the parameters tab's save bar.
    await user.click(
      screen.getByRole("button", { name: /^Budget & Economy/ })
    );
    const resetButton = await screen.findByRole("button", {
      name: "Reset to defaults",
    });
    await user.click(resetButton);

    expect(await screen.findByText("Reset to code defaults.")).toBeInTheDocument();
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          url === "/api/simulation-config" && init?.method === "POST"
      )
    ).toBe(true);
  });

  it("disables Run Scenario Test once every industry is cleared, and re-enables after Select All", async () => {
    const user = userEvent.setup();
    render(<SimulationConfigCenter />);
    await screen.findByRole("heading", { name: "Configuration" });

    await user.click(
      screen.getByRole("button", { name: /^Scenario Test/ })
    );
    const runButton = await screen.findByRole("button", {
      name: /Run Scenario Test/i,
    });
    expect(runButton).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Clear All" }));
    expect(runButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Select All" }));
    expect(runButton).toBeEnabled();
  });

  it("toggling an industry chip removes it from the results table filter", async () => {
    const user = userEvent.setup();
    render(<SimulationConfigCenter />);
    await screen.findByRole("heading", { name: "Configuration" });
    await user.click(
      screen.getByRole("button", { name: /^Scenario Test/ })
    );

    const manufacturingChip = await screen.findByRole("button", {
      name: /Manufacturing/,
    });
    // Chip starts selected (all industries default on); the results table
    // shows one row per selected industry.
    const table = screen.getAllByRole("table")[0];
    expect(within(table).getByText("Manufacturing")).toBeInTheDocument();

    await user.click(manufacturingChip);
    expect(within(table).queryByText("Manufacturing")).not.toBeInTheDocument();
  });
});
